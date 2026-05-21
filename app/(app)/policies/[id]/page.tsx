import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PolicyNav } from '@/components/policy/policy-nav'
import { CoverageCard } from '@/components/policy/coverage-card'
import { RiskFlagCard } from '@/components/policy/risk-flag-card'
import { DisclaimerBanner } from '@/components/layout/disclaimer-banner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle, Calendar, PoundSterling, MessageSquare, Download } from 'lucide-react'
import { policyTypeLabel, ownerTypeLabel } from '@/lib/utils'
import type { PolicySummary, Question } from '@/types'
import { DeletePolicyButton } from './delete-button'
import { ReprocessButton } from './reprocess-button'

export default async function PolicyDashboard({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: policy } = await supabase
    .from('policies')
    .select('*')
    .eq('id', id)
    .eq('user_id', user!.id)
    .single()

  if (!policy) notFound()

  const { data: summary } = await supabase
    .from('policy_summaries')
    .select('*')
    .eq('policy_id', id)
    .single() as { data: PolicySummary | null }

  const { data: recentQuestions } = await supabase
    .from('questions')
    .select('*')
    .eq('policy_id', id)
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(5) as { data: Question[] | null }

  return (
    <div className="min-h-screen">
      {/* Policy header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-slate-900">{policy.policy_nickname}</h1>
                <Badge variant={policy.status as 'ready' | 'processing' | 'failed' | 'uploading'}>
                  {policy.status}
                </Badge>
                <Badge variant="outline">{policyTypeLabel(policy.policy_type)}</Badge>
              </div>
              <p className="text-sm text-slate-500">
                {policy.insurer_name ?? 'Insurer not detected'} &middot;{' '}
                {ownerTypeLabel(policy.owner_type)} &middot; {policy.jurisdiction}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <ReprocessButton policyId={id} />
              <Link href={`/policies/${id}/report`}>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                  Export Report
                </Button>
              </Link>
              <DeletePolicyButton policyId={id} />
            </div>
          </div>
        </div>
        <PolicyNav policyId={id} />
      </div>

      {policy.status === 'processing' && (
        <div className="max-w-4xl mx-auto px-4 py-10 text-center">
          <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Your policy is still being processed. Please check back in a moment.</p>
        </div>
      )}

      {policy.status === 'failed' && (
        <div className="max-w-4xl mx-auto px-4 py-10">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <h2 className="font-semibold text-red-800 mb-2">Processing failed</h2>
            <p className="text-sm text-red-700">{policy.processing_error ?? 'An unknown error occurred.'}</p>
          </div>
        </div>
      )}

      {policy.status === 'ready' && summary && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

          {/* Relevant for you */}
          {(() => {
            const ctx = policy.user_context_json
            if (!ctx) return null
            const keys: Array<['preExistingConditions' | 'highValueItems' | 'adventureActivities', 'pre_existing_conditions' | 'high_value_items' | 'adventure_activities', string]> = [
              ['preExistingConditions', 'pre_existing_conditions', 'pre-existing conditions'],
              ['highValueItems', 'high_value_items', 'high-value items'],
              ['adventureActivities', 'adventure_activities', 'adventure activities'],
            ]
            const activeKeys = keys.filter(([k]) => ctx[k]).map(([, tag]) => tag)
            if (activeKeys.length === 0) return null
            const relevant = summary.risk_flags_json.filter(
              (f) => f.relevantFor && f.relevantFor.some((r) => activeKeys.includes(r))
            )
            if (relevant.length === 0) return null
            return (
              <section>
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-1">
                  <span className="text-blue-600">★</span> Relevant for you
                </h2>
                <p className="text-sm text-slate-500 mb-4">
                  Based on your profile ({keys.filter(([k]) => ctx[k]).map(([,,label]) => label).join(', ')}), these flags apply to you most.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {relevant.map((flag, i) => (
                    <RiskFlagCard key={i} flag={flag} highlight />
                  ))}
                </div>
              </section>
            )
          })()}

          {/* Overview */}
          <section>
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Policy Overview</h2>
            <Card>
              <CardContent className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Policy type', value: summary.overview_json.policy_type },
                  { label: 'Insurer', value: summary.overview_json.insurer ?? 'Not found' },
                  { label: 'Policyholder', value: summary.overview_json.policyholder ?? 'Not found' },
                  { label: 'Policy period', value: summary.overview_json.policy_period ?? 'Not found' },
                  { label: 'Jurisdiction', value: summary.overview_json.jurisdiction },
                  { label: 'Confidence', value: summary.overview_json.confidence },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-slate-400 mb-0.5">{item.label}</p>
                    <p className="text-sm font-medium text-slate-900">{item.value}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </section>

          {/* Risk flags — all */}
          {summary.risk_flags_json?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Key Risk Flags
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summary.risk_flags_json.map((flag, i) => (
                  <RiskFlagCard key={i} flag={flag} />
                ))}
              </div>
            </section>
          )}

          {/* Coverage */}
          {summary.coverage_json?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">What&apos;s Covered</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.coverage_json.map((item, i) => (
                  <CoverageCard key={i} item={item} policyId={id} />
                ))}
              </div>
            </section>
          )}

          {/* Exclusions */}
          {summary.exclusions_json?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4">What&apos;s Not Covered</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.exclusions_json.map((item, i) => (
                  <CoverageCard key={i} item={item} policyId={id} />
                ))}
              </div>
            </section>
          )}

          {/* Limits */}
          {summary.limits_json?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <PoundSterling className="h-5 w-5 text-blue-600" />
                Limits &amp; Excess
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.limits_json.map((limit, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-slate-900 mb-1">{limit.title}</h3>
                      <p className="text-2xl font-bold text-blue-600 mb-2">{limit.amount}</p>
                      <p className="text-sm text-slate-500 mb-2">{limit.context}</p>
                      {limit.quote && (
                        <blockquote className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2 mb-2">&ldquo;{limit.quote}&rdquo;</blockquote>
                      )}
                      {limit.page > 0 && (
                        <p className="text-xs text-slate-400">Page {limit.page} &middot; {limit.section}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Important Conditions */}
          {summary.important_conditions_json?.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-slate-500" />
                Important Conditions
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.important_conditions_json.map((cond, i) => (
                  <Card key={i}>
                    <CardContent className="p-5">
                      <h3 className="font-semibold text-slate-900 mb-1">{cond.title}</h3>
                      <p className="text-sm text-slate-600 mb-3 leading-relaxed">{cond.explanation}</p>
                      {cond.quote && (
                        <blockquote className="text-xs text-slate-500 italic border-l-2 border-slate-200 pl-2 mb-2">&ldquo;{cond.quote}&rdquo;</blockquote>
                      )}
                      {cond.page > 0 && (
                        <p className="text-xs text-slate-400">Page {cond.page} &middot; {cond.section}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Recent Q&A */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-blue-600" />
                Recent Questions
              </h2>
              <Link href={`/policies/${id}/ask`}>
                <Button size="sm">Ask a Question</Button>
              </Link>
            </div>
            {recentQuestions && recentQuestions.length > 0 ? (
              <div className="space-y-3">
                {recentQuestions.map((q) => (
                  <Card key={q.id}>
                    <CardContent className="p-4">
                      <p className="font-medium text-slate-900 mb-1">{q.question_text}</p>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          q.answer_json.shortAnswer === 'May be covered' ? 'covered' :
                          q.answer_json.shortAnswer === 'May not be covered' ? 'excluded' :
                          q.answer_json.shortAnswer === 'Conditions or exclusions may apply' ? 'limited' :
                          'unclear'
                        }>
                          {q.answer_json.shortAnswer}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500 leading-relaxed">{q.answer_json.plainEnglishExplanation}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-slate-500">
                  <p>No questions yet.</p>
                  <Link href={`/policies/${id}/ask`}>
                    <Button variant="outline" size="sm" className="mt-3">Ask your first question</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </section>

          <DisclaimerBanner />
        </div>
      )}
    </div>
  )
}
