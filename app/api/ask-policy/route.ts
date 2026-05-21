import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserTier, PLANS } from '@/lib/subscription'
import { generateEmbedding, callGeminiWithRetry, extractJSON } from '@/lib/gemini/client'
import { z } from 'zod'

export const maxDuration = 60

const AnswerSchema = z.object({
  shortAnswer: z.enum(['May be covered', 'Conditions or exclusions may apply', 'May not be covered', 'Unclear from policy', 'Not found in policy']),
  confidence: z.enum(['High', 'Medium', 'Low']),
  plainEnglishExplanation: z.string(),
  relevantClauses: z.array(z.object({
    page: z.number(),
    section: z.string(),
    clause: z.string().nullable().optional(),
    quote: z.string(),
  })),
  possibleExclusions: z.array(z.object({
    page: z.number(),
    section: z.string(),
    explanation: z.string(),
  })),
  questionsToAsk: z.array(z.string()),
  professionalReviewRecommended: z.boolean(),
  professionalReviewReason: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  const start = Date.now()
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { policyId, question, isDemo } = await req.json()
  if (!policyId || !question) return NextResponse.json({ error: 'Missing policyId or question' }, { status: 400 })

  if (!isDemo) {
    const { data: policy } = await supabase.from('policies').select('id, status').eq('id', policyId).eq('user_id', user.id).single()
    if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 })
    if (policy.status !== 'ready') return NextResponse.json({ error: 'Policy not ready' }, { status: 400 })

    const tier = await getUserTier(user.id)
    const questionLimit = PLANS[tier].questionLimit
    const { count } = await supabase.from('questions').select('id', { count: 'exact', head: true })
      .eq('policy_id', policyId)
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    if ((count ?? 0) >= questionLimit) {
      return NextResponse.json({
        error: `You've used all ${questionLimit} questions for this month.${tier === 'free' ? ' Upgrade to Pro for 50 questions per month.' : ''}`,
        upgradeRequired: tier === 'free',
      }, { status: 429 })
    }
  }

  // Embed question and find relevant chunks
  const questionEmbedding = await generateEmbedding(question)

  const { data: chunks } = await adminClient.rpc('match_policy_chunks', {
    policy_id_input: policyId,
    query_embedding: questionEmbedding,
    match_count: 12,
  })

  const { data: definitionChunks } = await adminClient
    .from('policy_chunks')
    .select('chunk_text, page_number, section_title, clause_reference')
    .eq('policy_id', policyId)
    .or('section_title.ilike.%definition%,section_title.ilike.%general condition%,section_title.ilike.%exclusion%')
    .limit(4)

  const allChunks = [
    ...(chunks ?? []),
    ...(definitionChunks ?? []).filter((d: { chunk_text: string }) => !chunks?.some((c: { chunk_text: string }) => c.chunk_text === d.chunk_text)),
  ]

  const contextText = allChunks
    .map((c: { page_number: number; section_title?: string; clause_reference?: string; chunk_text: string }) =>
      `[Page ${c.page_number}${c.section_title ? `, ${c.section_title}` : ''}${c.clause_reference ? `, Clause ${c.clause_reference}` : ''}]\n${c.chunk_text}`
    )
    .join('\n\n---\n\n')

  const prompt = `You are Understand Cover, an educational insurance policy explainer.

STRICT RULES:
1. Answer ONLY using the policy text provided in the context below.
2. Do NOT use outside knowledge about insurance.
3. Do NOT give legal, insurance, financial, or claims advice.
4. Do NOT guarantee coverage, claim outcomes, or insurer behaviour.
5. Do NOT tell the user to file or not file a claim.
6. Do NOT recommend buying, cancelling, or switching policies.
7. If the answer is not in the policy text provided, say "Not found in the uploaded policy."
8. Every claim you make must cite: page number, section title, clause reference if available, and a short quote (under 15 words).
9. NEVER invent page numbers or fabricate quotes.
10. Use cautious language: "may", "appears to", "could", "based on the uploaded wording".
11. Avoid definitive language: "definitely", "guaranteed", "must", "will", "should".

RETURN JSON ONLY matching this exact schema:
{
  "shortAnswer": "May be covered" | "Conditions or exclusions may apply" | "May not be covered" | "Unclear from policy" | "Not found in policy",
  "confidence": "High" | "Medium" | "Low",
  "plainEnglishExplanation": "2-4 sentences",
  "relevantClauses": [{"page": <int>, "section": "<str>", "clause": "<str or null>", "quote": "<under 15 words>"}],
  "possibleExclusions": [{"page": <int>, "section": "<str>", "explanation": "<str>"}],
  "questionsToAsk": ["<question 1>", "<question 2>", "<question 3>"],
  "professionalReviewRecommended": <boolean>,
  "professionalReviewReason": "<str or null>"
}

POLICY TEXT (with page numbers):
${contextText}

USER QUESTION:
${question}`

  const rawResponse = await callGeminiWithRetry(prompt)
  const latencyMs = Date.now() - start

  let parsed
  let verificationPassed = true

  try {
    parsed = AnswerSchema.parse(JSON.parse(extractJSON(rawResponse)))

    // Verify citations
    const pageTexts = new Map<number, string>()
    for (const chunk of allChunks) {
      const existing = pageTexts.get(chunk.page_number) ?? ''
      pageTexts.set(chunk.page_number, existing + ' ' + chunk.chunk_text)
    }

    const maxPageInChunks = Math.max(...allChunks.map((c: { page_number: number }) => c.page_number), 0)

    for (const clause of parsed.relevantClauses) {
      const pageExists = clause.page > 0 && clause.page <= (maxPageInChunks + 5)
      const pageText = pageTexts.get(clause.page) ?? ''
      const quoteFound = clause.quote.length < 5 || pageText.toLowerCase().includes(clause.quote.toLowerCase().slice(0, 20))
      if (!pageExists || !quoteFound) {
        verificationPassed = false
        break
      }
    }

    if (!verificationPassed) {
      parsed = {
        shortAnswer: 'Unclear from policy' as const,
        confidence: 'Low' as const,
        plainEnglishExplanation: 'I could not find a reliable answer in your uploaded policy for this question. The relevant clauses could not be verified. Please review your policy directly or speak with your insurer.',
        relevantClauses: [],
        possibleExclusions: [],
        questionsToAsk: ['Could you clarify what the policy covers in this situation?', 'What evidence would I need to support a claim?', 'Are there any exclusions that might apply?'],
        professionalReviewRecommended: true,
        professionalReviewReason: 'Could not verify citations against the uploaded document.',
      }
    }
  } catch {
    parsed = {
      shortAnswer: 'Unclear from policy' as const,
      confidence: 'Low' as const,
      plainEnglishExplanation: 'Unable to parse a structured answer from your policy. Please try rephrasing your question.',
      relevantClauses: [],
      possibleExclusions: [],
      questionsToAsk: ['Please contact your insurer directly for clarification.'],
      professionalReviewRecommended: true,
      professionalReviewReason: 'Could not generate a structured answer.',
    }
    verificationPassed = false
  }

  // Log the AI call
  await adminClient.from('ai_logs').insert({
    user_id: user.id,
    policy_id: policyId,
    request_type: 'qa',
    prompt_sent: prompt,
    chunks_retrieved: allChunks,
    llm_response: rawResponse,
    parsed_response: parsed,
    citation_verification_passed: verificationPassed,
    latency_ms: latencyMs,
  })

  // Save question to DB (not for demo)
  if (!isDemo) {
    await adminClient.from('questions').insert({
      user_id: user.id,
      policy_id: policyId,
      question_text: question,
      answer_json: parsed,
    })
  }

  return NextResponse.json({ answer: parsed })
}
