'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, AlertCircle, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { CoverageCard } from '@/components/policy/coverage-card'
import { RiskFlagCard } from '@/components/policy/risk-flag-card'
import { AnswerCard } from '@/components/question/answer-card'
import { DEMO_POLICY, DEMO_SUMMARY, DEMO_POLICY_ID } from '@/lib/demo/policy'
import { policyTypeLabel, DISCLAIMER } from '@/lib/utils'
import type { QuestionAnswer } from '@/types'

const SUGGESTED = [
  'Am I covered if my laptop is stolen from a café?',
  "What's my excess?",
  'Is accidental damage covered?',
  'Am I covered if I leave my front door unlocked?',
  'What do I need to do to make a claim?',
]

interface QA { question: string; answer: QuestionAnswer; timestamp: string }

type DemoSection = 'overview' | 'coverage' | 'exclusions' | 'limits' | 'risks' | 'ask'

export default function DemoPage() {
  const [section, setSection] = useState<DemoSection>('overview')
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [answers, setAnswers] = useState<QA[]>([])

  async function handleAsk(q: string) {
    if (!q.trim() || loading) return
    setLoading(true)
    setError(null)
    setSection('ask')

    const res = await fetch('/api/demo-ask', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q }),
    })
    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong. Please try again.')
      return
    }

    setAnswers((prev) => [{ question: q, answer: data.answer, timestamp: new Date().toISOString() }, ...prev])
    setQuestion('')
  }

  const navItems: { key: DemoSection; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'coverage', label: "What's Covered" },
    { key: 'exclusions', label: 'Exclusions' },
    { key: 'limits', label: 'Limits' },
    { key: 'risks', label: 'Risk Flags' },
    { key: 'ask', label: 'Ask a Question' },
  ]

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      {/* Demo banner */}
      <div className="bg-amber-500 text-white text-center py-2 px-4 text-sm font-medium">
        <AlertCircle className="inline h-4 w-4 mr-1.5" />
        This is a fictional demo policy for illustration only. No real insurance data.{' '}
        <Link href="/signup" className="underline font-bold">Sign up free</Link> to upload your own policy.
      </div>

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <Link href="/" className="flex items-center gap-2 text-blue-700 font-bold text-lg">
              <Shield className="h-5 w-5" />
              Understand Cover
            </Link>
            <div className="flex gap-2">
              <Link href="/signin"><Button variant="outline" size="sm">Sign in</Button></Link>
              <Link href="/signup"><Button size="sm">Sign up free</Button></Link>
            </div>
          </div>
          <div className="pb-3">
            <h1 className="text-lg font-bold text-slate-900">{DEMO_POLICY.policy_nickname}</h1>
            <p className="text-sm text-slate-500">{DEMO_POLICY.insurer_name} &middot; {policyTypeLabel(DEMO_POLICY.policy_type)} &middot; {DEMO_POLICY.jurisdiction}</p>
          </div>
          <nav className="flex gap-1 overflow-x-auto">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setSection(item.key)}
                className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  section === item.key
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {section === 'overview' && (
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Policy Overview</h2>
              <Card>
                <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {(Object.entries(DEMO_SUMMARY.overview_json) as [string, string | null][]).map(([k, v]) => (
                    <div key={k}>
                      <p className="text-xs text-slate-400 mb-0.5 capitalize">{k.replace(/_/g, ' ')}</p>
                      <p className="text-sm font-medium text-slate-900">{v ?? 'Not found'}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Top Risk Flags</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {DEMO_SUMMARY.risk_flags_json.slice(0, 3).map((flag) => (
                  <RiskFlagCard key={flag.title} flag={flag} />
                ))}
              </div>
            </div>
          </div>
        )}

        {section === 'coverage' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">What&apos;s Covered</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_SUMMARY.coverage_json.map((item) => (
                <CoverageCard
                  key={item.title}
                  item={item}
                  policyId={DEMO_POLICY_ID}
                  onAsk={(q) => { setQuestion(q); handleAsk(q) }}
                />
              ))}
            </div>
          </div>
        )}

        {section === 'exclusions' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">What&apos;s Not Covered</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_SUMMARY.exclusions_json.map((item) => (
                <CoverageCard key={item.title} item={item} policyId={DEMO_POLICY_ID} />
              ))}
            </div>
          </div>
        )}

        {section === 'limits' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Limits &amp; Excess</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {DEMO_SUMMARY.limits_json.map((limit) => (
                <Card key={limit.title}>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-slate-900 mb-1">{limit.title}</h3>
                    <p className="text-2xl font-bold text-blue-600 mb-2">{limit.amount}</p>
                    <p className="text-sm text-slate-500">{limit.context}</p>
                    <p className="text-xs text-slate-400 mt-2">Page {limit.page}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {section === 'risks' && (
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">Risk Flags</h2>
            <div className="space-y-4">
              {DEMO_SUMMARY.risk_flags_json.map((flag) => (
                <RiskFlagCard key={flag.title} flag={flag} />
              ))}
            </div>
          </div>
        )}

        {section === 'ask' && (
          <div className="max-w-3xl">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Ask about this policy</h2>
            <p className="text-slate-500 mb-6 text-sm">
              This uses the demo policy text to answer questions. Try it out — then{' '}
              <Link href="/signup" className="text-blue-600 hover:underline font-medium">sign up free</Link> to upload your own policy.
            </p>

            <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4">
              <Textarea
                placeholder='Ask anything about this policy. For example: "Am I covered if my laptop is stolen?"'
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="min-h-20 border-0 focus-visible:ring-0 p-0 resize-none"
                maxLength={500}
              />
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">{question.length}/500</span>
                <Button onClick={() => handleAsk(question)} disabled={!question.trim() || loading} size="sm">
                  <Send className="h-3.5 w-3.5" />
                  {loading ? 'Thinking…' : 'Ask'}
                </Button>
              </div>
            </div>

            {answers.length === 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {SUGGESTED.map((s) => (
                  <button
                    key={s}
                    onClick={() => handleAsk(s)}
                    className="text-sm bg-white border border-slate-200 rounded-full px-3 py-1.5 hover:bg-blue-50 hover:border-blue-300 text-slate-600 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {error && <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3 mb-4">{error}</div>}

            {loading && (
              <div className="bg-white rounded-xl border border-slate-200 p-8 text-center mb-4">
                <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Reading the demo policy…</p>
              </div>
            )}

            <div className="space-y-6">
              {answers.map((qa) => (
                <AnswerCard key={qa.timestamp} question={qa.question} answer={qa.answer} timestamp={qa.timestamp} />
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <p className="text-xs text-slate-400 text-center">{DISCLAIMER}</p>
        </div>
      </div>
    </div>
  )
}
