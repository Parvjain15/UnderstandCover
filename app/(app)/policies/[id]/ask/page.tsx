'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ChevronLeft, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { AnswerCard } from '@/components/question/answer-card'
import { DisclaimerBanner } from '@/components/layout/disclaimer-banner'
import { PolicyNav } from '@/components/policy/policy-nav'
import type { Question, QuestionAnswer, UserContext } from '@/types'

const SUGGESTED_BY_TYPE: Record<string, string[]> = {
  renters: [
    'Am I covered if my laptop is stolen from a café?',
    "What's my excess?",
    'Is accidental damage covered?',
    'What do I need to do to make a claim?',
    'Am I covered if I leave my front door unlocked?',
  ],
  travel: [
    'Is my phone covered if it breaks while abroad?',
    'What if my flight is cancelled?',
    'Am I covered for medical treatment overseas?',
    "What's the maximum I can claim for baggage?",
    'What happens if I miss my connecting flight?',
  ],
  car: [
    'Am I covered to drive other cars?',
    'What is my voluntary excess?',
    'Am I covered for a courtesy car?',
    'Is breakdown cover included?',
  ],
  home: [
    'Am I covered for flooding?',
    'What is my buildings insurance excess?',
    'Is accidental damage included?',
    'Am I covered if a tree falls on my house?',
  ],
  default: [
    'What are the main exclusions?',
    "What's my excess?",
    'How do I make a claim?',
    'What is the maximum payout?',
  ],
}

const CONTEXT_SUGGESTIONS: Record<string, string[]> = {
  pre_existing_conditions: [
    'Are my pre-existing medical conditions covered?',
    'Do I need to declare a pre-existing condition to make a claim?',
    'What happens if I need treatment related to a pre-existing condition?',
  ],
  high_value_items: [
    'What is the single-item limit for valuables?',
    'Is my laptop covered if stolen outside the home?',
    'Do I need to list high-value items separately?',
  ],
  adventure_activities: [
    'Am I covered for skiing or snowboarding?',
    'Are adventure sports excluded from my policy?',
    'What winter sports activities are covered or excluded?',
  ],
}

interface QA {
  id?: string
  question: string
  answer: QuestionAnswer
  timestamp: string
}

function buildSuggestions(policyType: string, userContext: UserContext | null): string[] {
  const base = SUGGESTED_BY_TYPE[policyType] ?? SUGGESTED_BY_TYPE.default
  if (!userContext) return base

  const extras: string[] = []
  if (userContext.preExistingConditions) extras.push(...CONTEXT_SUGGESTIONS.pre_existing_conditions)
  if (userContext.highValueItems) extras.push(...CONTEXT_SUGGESTIONS.high_value_items)
  if (userContext.adventureActivities) extras.push(...CONTEXT_SUGGESTIONS.adventure_activities)

  // interleave: lead with personalised, then base, dedupe
  const seen = new Set<string>()
  const merged: string[] = []
  for (const s of [...extras, ...base]) {
    if (!seen.has(s)) { seen.add(s); merged.push(s) }
  }
  return merged.slice(0, 6)
}

export default function AskPage({ params }: Readonly<{ params: Promise<{ id: string }> }>) {
  const { id: policyId } = use(params)
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<QA[]>([])
  const [policyType, setPolicyType] = useState('default')
  const [userContext, setUserContext] = useState<UserContext | null>(null)
  const [questionsUsed, setQuestionsUsed] = useState(0)
  const [questionsLimit, setQuestionsLimit] = useState(20)

  useEffect(() => {
    fetch(`/api/policy-context?policyId=${policyId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.policyType) setPolicyType(d.policyType)
        if (d.userContext) setUserContext(d.userContext)
        setQuestionsUsed(d.questionsUsed ?? 0)
        setQuestionsLimit(d.questionsLimit ?? 20)
        if (d.questions?.length > 0) {
          setAnswers(
            d.questions.map((q: Question) => ({
              id: q.id,
              question: q.question_text,
              answer: q.answer_json,
              timestamp: q.created_at,
            }))
          )
        }
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false))
  }, [policyId])

  const suggestions = buildSuggestions(policyType, userContext)
  const questionsRemaining = questionsLimit - questionsUsed
  const atLimit = questionsRemaining <= 0

  async function handleAsk(q: string) {
    if (!q.trim() || loading || atLimit) return
    setLoading(true)
    setError(null)

    const res = await fetch('/api/ask-policy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ policyId, question: q }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      if (res.status === 429) {
        setQuestionsUsed(questionsLimit)
        setError('You have reached your monthly question limit for this policy.')
      } else {
        setError(data.error ?? 'Something went wrong. Please try again.')
      }
      return
    }

    setQuestionsUsed((prev) => prev + 1)
    setAnswers((prev) => [{ question: q, answer: data.answer, timestamp: new Date().toISOString() }, ...prev])
    setQuestion('')
  }

  let remainingColor = 'text-slate-400'
  if (questionsRemaining <= 3) remainingColor = 'text-red-600'
  else if (questionsRemaining <= 8) remainingColor = 'text-amber-600'

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link href={`/policies/${policyId}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4" /> Back to overview
          </Link>
        </div>
        <PolicyNav policyId={policyId} />
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">Ask about your policy</h1>
            <p className="text-slate-500">Type a real-life question and get a cited answer from your policy.</p>
          </div>
          {!initialLoading && (
            <div className={`text-sm font-medium shrink-0 ${remainingColor}`}>
              {questionsRemaining > 0
                ? <>{questionsRemaining}<span className="font-normal text-slate-400">/{questionsLimit} questions left</span></>
                : <span className="text-red-600">Limit reached</span>
              }
            </div>
          )}
        </div>

        {atLimit ? (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-6 text-sm text-amber-800">
            You&apos;ve used all {questionsLimit} questions for this policy this month. Your allowance resets in 30 days.
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
            <Textarea
              placeholder='Ask anything about your policy. For example: "Am I covered if my laptop is stolen from a café?"'
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="min-h-25 border-0 focus-visible:ring-0 p-0 resize-none"
              maxLength={500}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleAsk(question)
              }}
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs text-slate-400">{question.length}/500 &middot; Ctrl+Enter to send</span>
              <Button onClick={() => handleAsk(question)} disabled={!question.trim() || loading} size="sm">
                <Send className="h-3.5 w-3.5" />
                {loading ? 'Thinking…' : 'Ask'}
              </Button>
            </div>
          </div>
        )}

        {/* Personalised suggestions — only when no answers yet */}
        {!initialLoading && answers.length === 0 && !atLimit && (
          <div className="mb-8">
            <p className="text-xs text-slate-400 mb-2 font-medium uppercase tracking-wide">
              {userContext && (userContext.preExistingConditions || userContext.highValueItems || userContext.adventureActivities)
                ? 'Suggested for your profile'
                : 'Try asking…'}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => { setQuestion(s); handleAsk(s) }}
                  className="text-sm bg-white border border-slate-200 rounded-full px-3 py-1.5 hover:bg-blue-50 hover:border-blue-300 text-slate-600 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">
            {error}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center mb-4">
            <div className="w-8 h-8 rounded-full border-3 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Reading your policy…</p>
          </div>
        )}

        {initialLoading && (
          <div className="py-12 text-center">
            <div className="w-6 h-6 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin mx-auto" />
          </div>
        )}

        {!initialLoading && answers.length > 0 && (
          <>
            {answers.length > 1 && (
              <p className="text-xs text-slate-400 mb-3 font-medium uppercase tracking-wide">
                {answers.length} question{answers.length === 1 ? '' : 's'} asked
              </p>
            )}
            <div className="space-y-6">
              {answers.map((qa, i) => (
                <AnswerCard key={qa.id ?? i} question={qa.question} answer={qa.answer} timestamp={qa.timestamp} />
              ))}
            </div>
            <div className="mt-6">
              <DisclaimerBanner />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
