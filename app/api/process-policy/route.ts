import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { extractPdfPages, hasReadableText } from '@/lib/pdf/extract'
import { chunkPolicyPages } from '@/lib/pdf/chunking'
import { callGeminiWithRetry, extractJSON, generateEmbeddingsBatch } from '@/lib/gemini/client'
import { z } from 'zod'

export const maxDuration = 300

const MetadataSchema = z.object({
  insurer_name: z.string().nullable().optional(),
  policyholder_name: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
})

const CoverageItemSchema = z.object({
  title: z.string(),
  status: z.enum(['Covered', 'Limited', 'Unclear', 'Excluded']),
  explanation: z.string(),
  page: z.number().nullable().optional().transform(v => v ?? 0),
  section: z.string().nullable().optional().transform(v => v ?? ''),
  quote: z.string().nullable().optional().transform(v => v ?? ''),
  confidence: z.enum(['High', 'Medium', 'Low']).optional().default('Medium'),
})

const LimitItemSchema = z.object({
  title: z.string(),
  amount: z.string(),
  context: z.string(),
  page: z.number().nullable().optional().transform(v => v ?? 0),
  section: z.string().nullable().optional().transform(v => v ?? ''),
  quote: z.string().nullable().optional().transform(v => v ?? ''),
})

const RiskFlagSchema = z.object({
  level: z.enum(['High', 'Medium', 'Low']),
  title: z.string(),
  explanation: z.string(),
  quote: z.string().nullable().optional().transform(v => v ?? ''),
  page: z.number().nullable().optional().transform(v => v ?? 0),
  section: z.string().nullable().optional().transform(v => v ?? ''),
  questionToAsk: z.string(),
  relevantFor: z.array(z.string()).optional().default([]),
})

const ImportantConditionSchema = z.object({
  title: z.string(),
  explanation: z.string(),
  page: z.number().nullable().optional().transform(v => v ?? 0),
  section: z.string().nullable().optional().transform(v => v ?? ''),
  quote: z.string().nullable().optional().transform(v => v ?? ''),
})

const Pass1Schema = z.object({
  overview: z.object({
    policy_type: z.string(),
    insurer: z.string().nullable().optional(),
    policyholder: z.string().nullable().optional(),
    policy_period: z.string().nullable().optional(),
    jurisdiction: z.string(),
    confidence: z.enum(['High', 'Medium', 'Low']),
  }),
  coverage: z.array(CoverageItemSchema),
  exclusions: z.array(CoverageItemSchema),
  limits: z.array(LimitItemSchema),
})

const Pass2Schema = z.object({
  risk_flags: z.array(RiskFlagSchema),
  important_conditions: z.array(ImportantConditionSchema),
})

function buildUserContextNote(userContext: { preExistingConditions: boolean; highValueItems: boolean; adventureActivities: boolean } | null): string {
  if (!userContext) return ''
  const flags: string[] = []
  if (userContext.preExistingConditions) flags.push('pre-existing medical conditions')
  if (userContext.highValueItems) flags.push('high-value electronics/items (>£500)')
  if (userContext.adventureActivities) flags.push('winter sports or adventure activities')
  if (flags.length === 0) return ''
  return `
═══ POLICYHOLDER PROFILE ═══
This policyholder has told us they have: ${flags.join(', ')}.
- Tag risk flags relevant to each profile item with "relevantFor": ["pre_existing_conditions"] / ["high_value_items"] / ["adventure_activities"] (or multiple).
- Prioritise (but do not invent) risk flags that directly affect someone with these characteristics.
- If a risk flag is NOT relevant to any profile item, use "relevantFor": [].
`
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { policyId } = await req.json()
  if (!policyId) return NextResponse.json({ error: 'Missing policyId' }, { status: 400 })

  const { data: policy } = await supabase.from('policies').select('*').eq('id', policyId).eq('user_id', user.id).single()
  if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 })

  try {
    await adminClient.from('policies').update({ status: 'processing' }).eq('id', policyId)

    // Download PDF
    const { data: fileData } = await adminClient.storage.from('policy-files').download(policy.file_url)
    if (!fileData) throw new Error('Could not download policy file')

    const buffer = Buffer.from(await fileData.arrayBuffer())

    // Extract pages
    const pages = await extractPdfPages(buffer)
    if (!hasReadableText(pages)) {
      await adminClient.from('policies').update({ status: 'failed', processing_error: 'Could not read text from this PDF. It may be a scanned document. Please try a digital PDF.' }).eq('id', policyId)
      return NextResponse.json({ error: 'unreadable_pdf' }, { status: 422 })
    }

    // Store pages
    const pageInserts = pages.map((p) => ({
      policy_id: policyId,
      page_number: p.pageNumber,
      raw_text: p.text,
    }))
    await adminClient.from('policy_pages').insert(pageInserts)
    await adminClient.from('policies').update({ total_pages: pages.length }).eq('id', policyId)

    // Extract metadata
    const firstPagesText = pages.slice(0, 3).map((p) => `[Page ${p.pageNumber}]\n${p.text}`).join('\n\n')
    const metaPrompt = `Extract the following from this insurance policy text. Return JSON only.
Fields: insurer_name (string or null), policyholder_name (string or null), start_date (ISO date string or null), end_date (ISO date string or null).
If a field is not found, return null. Do not guess.

Policy text:
${firstPagesText}`

    try {
      const metaRaw = await callGeminiWithRetry(metaPrompt)
      const metaParsed = MetadataSchema.parse(JSON.parse(extractJSON(metaRaw)))
      await adminClient.from('policies').update({
        insurer_name: metaParsed.insurer_name ?? null,
        policyholder_name: metaParsed.policyholder_name ?? null,
        start_date: metaParsed.start_date ?? null,
        end_date: metaParsed.end_date ?? null,
      }).eq('id', policyId)
    } catch {
      // Metadata extraction is best-effort
    }

    // Chunk text
    const chunks = chunkPolicyPages(pages)

    // Generate embeddings
    const chunkTexts = chunks.map((c) => c.chunkText)
    const embeddings = await generateEmbeddingsBatch(chunkTexts)

    // Store chunks with embeddings
    const chunkInserts = chunks.map((c, i) => ({
      policy_id: policyId,
      page_number: c.pageNumber,
      section_title: c.sectionTitle,
      clause_reference: c.clauseReference,
      chunk_text: c.chunkText,
      chunk_index: c.chunkIndex,
      embedding: JSON.stringify(embeddings[i]),
    }))

    for (let i = 0; i < chunkInserts.length; i += 50) {
      await adminClient.from('policy_chunks').insert(chunkInserts.slice(i, i + 50))
    }

    const fullText = pages.map((p) => `[Page ${p.pageNumber}]\n${p.text}`).join('\n\n')
    const truncatedText = fullText.length > 30000 ? fullText.slice(0, 30000) + '\n...[truncated]' : fullText

    // ── PASS 1: Coverage / exclusions / limits ──────────────────────────────
    const pass1Prompt = `You are an expert insurance analyst. Analyse this insurance policy and return a structured JSON summary of coverage, exclusions, and limits.

═══ ABSOLUTE RULES ═══
1. Only use information explicitly stated in the policy text. Do not invent, infer, or guess.
2. Every item MUST include "page" (integer), "section" (clause/section name), and "quote" (verbatim phrase under 15 words from that page).
3. Return ONLY valid JSON — no commentary, no markdown, no explanation.

═══ COVERAGE EXTRACTION DEPTH ═══
- Extract at sub-section level (e.g. 3.1, 3.3, 5.4), not just main sections.
- For each item, capture sub-limits, conditions, or exclusions that apply specifically to it in the explanation.
- Coverage types by policy type:
  - Travel: medical expenses, emergency dental, cancellation, curtailment, baggage, delayed baggage, personal money, travel delay (exact incremental structure), missed departure, abandonment, cruise cover (cabin confinement, missed port, unused excursions), winter sports (flag Excluded if not included), gadget cover (flag Excluded if not included), personal liability, legal expenses
  - Renters/Contents: contents, personal possessions, accidental damage, liability, alternative accommodation, freezer contents, student belongings
  - Home: buildings, contents, personal possessions, accidental damage, liability, alternative accommodation, outbuildings
  - Car: third-party, fire & theft, comprehensive, personal accident, legal expenses, breakdown

═══ BADGE SELECTION ═══
- "Covered": broad, unconditional cover within the headline limit
- "Limited": sub-limits, specific conditions, time thresholds, or causation requirements apply
- "Excluded": clearly excluded by the policy wording
- "Unclear": policy text is ambiguous about this specific item

═══ SCHEMA ═══
{
  "overview": {
    "policy_type": "string",
    "insurer": "string or null",
    "policyholder": "string or null",
    "policy_period": "string or null",
    "jurisdiction": "string",
    "confidence": "High|Medium|Low"
  },
  "coverage": [
    {
      "title": "Coverage name",
      "status": "Covered|Limited|Unclear|Excluded",
      "explanation": "Plain-English explanation including exact amounts and payment structure",
      "page": <integer>,
      "section": "Section or clause name",
      "quote": "Verbatim phrase under 15 words",
      "confidence": "High|Medium|Low"
    }
  ],
  "exclusions": [
    {
      "title": "Exclusion name",
      "status": "Excluded",
      "explanation": "What is not covered and why this matters",
      "page": <integer>,
      "section": "Section or clause name",
      "quote": "Verbatim phrase under 15 words",
      "confidence": "High|Medium|Low"
    }
  ],
  "limits": [
    {
      "title": "Specific limit name (e.g. 'Policy Excess – per person per claim')",
      "amount": "£X,XXX or as stated",
      "context": "What this applies to, any conditions or sub-limits",
      "page": <integer>,
      "section": "Section or clause name",
      "quote": "Verbatim phrase under 15 words"
    }
  ]
}

MUST extract for limits:
- Policy excess / deductible (search for "excess", "deductible", "compulsory excess")
- All named monetary limits; if one category has multiple sub-limits, create a SEPARATE entry for each

POLICY TEXT:
${truncatedText}`

    const pass1Raw = await callGeminiWithRetry(pass1Prompt)
    const pass1 = Pass1Schema.parse(JSON.parse(extractJSON(pass1Raw)))

    // ── PASS 2: Risk flags / important conditions ───────────────────────────
    const userContextNote = buildUserContextNote(policy.user_context_json)

    const pass2Prompt = `You are an expert insurance analyst. Analyse this insurance policy and return risk flags and important conditions as structured JSON.

═══ ABSOLUTE RULES ═══
1. Only use information explicitly stated in the policy text. Do not invent, infer, or guess.
2. Every item MUST include "page" (integer), "section" (clause/section name), and "quote" (verbatim phrase under 15 words from that page).
3. Return ONLY valid JSON — no commentary, no markdown, no explanation.
${userContextNote}
═══ RISK FLAG TARGETS ═══
- Aim for 7–10 risk flags.
- Must include where applicable: eligibility restrictions, pre-authorisation requirements, reporting deadlines, conduct exclusions (alcohol, drugs, recklessness), "not included unless purchased" optional covers, geographic limits, age limits, and sub-limits that catch out modern users (e.g. £300 single-article limit against a £1,000 phone, gadget not covered without add-on, winter sports excluded).
- "questionToAsk" must reference the actual policy restriction — never generic safety advice.

═══ CRITICAL CONDITIONS ═══
- List every condition where the policyholder's action (or inaction) directly affects whether a claim will be paid:
  - Age or residency eligibility requirements
  - Pre-authorisation or emergency assistance calls before costs are incurred
  - Reporting deadlines to police, insurer, or carrier
  - Evidence requirements (receipts, medical certificates, reports)
  - Reasonable care duty (leaving items unattended, etc.)
  - Fraud and misrepresentation consequences

═══ SCHEMA ═══
{
  "risk_flags": [
    {
      "level": "High|Medium|Low",
      "title": "Risk name",
      "explanation": "Why this commonly catches policyholders out",
      "quote": "Verbatim phrase under 15 words",
      "page": <integer>,
      "section": "Section or clause name",
      "questionToAsk": "Specific question referencing the actual policy restriction",
      "relevantFor": ["pre_existing_conditions"|"high_value_items"|"adventure_activities"] (empty array if not profile-specific)
    }
  ],
  "important_conditions": [
    {
      "title": "Condition name",
      "explanation": "What the policyholder must do or know",
      "page": <integer>,
      "section": "Section or clause name",
      "quote": "Verbatim phrase under 15 words"
    }
  ]
}

POLICY TEXT:
${truncatedText}`

    const pass2Raw = await callGeminiWithRetry(pass2Prompt)
    const pass2 = Pass2Schema.parse(JSON.parse(extractJSON(pass2Raw)))

    const { error: upsertError } = await adminClient.from('policy_summaries').upsert({
      policy_id: policyId,
      overview_json: pass1.overview,
      coverage_json: pass1.coverage,
      exclusions_json: pass1.exclusions,
      limits_json: pass1.limits,
      risk_flags_json: pass2.risk_flags,
      important_conditions_json: pass2.important_conditions,
      generated_at: new Date().toISOString(),
    })
    if (upsertError) throw new Error(`Failed to save summary: ${upsertError.message}`)

    await adminClient.from('policies').update({ status: 'ready' }).eq('id', policyId)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Processing error:', err)
    const message = err instanceof Error ? err.message : 'Processing failed'
    await adminClient.from('policies').update({ status: 'failed', processing_error: message }).eq('id', policyId)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
