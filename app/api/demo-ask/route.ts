import { NextRequest, NextResponse } from 'next/server'
import { callGeminiWithRetry, extractJSON } from '@/lib/gemini/client'
import { DEMO_CHUNKS, DEMO_POLICY_ID } from '@/lib/demo/policy'
import { z } from 'zod'

export const maxDuration = 60

const AnswerSchema = z.object({
  shortAnswer: z.enum(['May be covered', 'Conditions or exclusions may apply', 'May not be covered', 'Unclear from policy', 'Not found in policy']),
  confidence: z.enum(['High', 'Medium', 'Low']),
  plainEnglishExplanation: z.string(),
  relevantClauses: z.array(z.object({ page: z.number(), section: z.string(), clause: z.string().nullable().optional(), quote: z.string() })),
  possibleExclusions: z.array(z.object({ page: z.number(), section: z.string(), explanation: z.string() })),
  questionsToAsk: z.array(z.string()),
  professionalReviewRecommended: z.boolean(),
  professionalReviewReason: z.string().nullable().optional(),
})

export async function POST(req: NextRequest) {
  const { question } = await req.json()
  if (!question) return NextResponse.json({ error: 'Missing question' }, { status: 400 })

  const contextText = DEMO_CHUNKS
    .map((c) => `[Page ${c.page_number}, ${c.section_title}${c.clause_reference ? `, Clause ${c.clause_reference}` : ''}]\n${c.chunk_text}`)
    .join('\n\n---\n\n')

  const prompt = `You are Understand Cover, an educational insurance policy explainer. This is a FICTIONAL demo policy for illustration.

RULES: Answer using only the policy text below. Return JSON only.

SCHEMA:
{"shortAnswer": "May be covered"|"Conditions or exclusions may apply"|"May not be covered"|"Unclear from policy"|"Not found in policy","confidence":"High"|"Medium"|"Low","plainEnglishExplanation":"2-4 sentences","relevantClauses":[{"page":<int>,"section":"<str>","clause":"<str or null>","quote":"<under 15 words>"}],"possibleExclusions":[{"page":<int>,"section":"<str>","explanation":"<str>"}],"questionsToAsk":["<str>","<str>","<str>"],"professionalReviewRecommended":<bool>,"professionalReviewReason":"<str or null>"}

POLICY TEXT:
${contextText}

QUESTION: ${question}`

  try {
    const raw = await callGeminiWithRetry(prompt)
    const parsed = AnswerSchema.parse(JSON.parse(extractJSON(raw)))
    return NextResponse.json({ answer: parsed })
  } catch {
    return NextResponse.json({
      answer: {
        shortAnswer: 'Unclear from policy',
        confidence: 'Low',
        plainEnglishExplanation: 'I could not generate a reliable answer from the demo policy. Please try rephrasing your question.',
        relevantClauses: [],
        possibleExclusions: [],
        questionsToAsk: ['Please contact your insurer for clarification.'],
        professionalReviewRecommended: true,
        professionalReviewReason: 'Could not generate a structured answer.',
      }
    })
  }
}
