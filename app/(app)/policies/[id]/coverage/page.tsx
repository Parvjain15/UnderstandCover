import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PolicyNav } from '@/components/policy/policy-nav'
import { CoverageCard } from '@/components/policy/coverage-card'
import { RiskFlagCard } from '@/components/policy/risk-flag-card'
import { DisclaimerBanner } from '@/components/layout/disclaimer-banner'
import { Card, CardContent } from '@/components/ui/card'
import { ChevronLeft, PoundSterling, Calendar } from 'lucide-react'
import type { PolicySummary } from '@/types'

export default async function CoveragePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: policy } = await supabase.from('policies').select('policy_nickname').eq('id', id).eq('user_id', user!.id).single()
  if (!policy) notFound()

  const { data: summary } = await supabase.from('policy_summaries').select('*').eq('policy_id', id).single() as { data: PolicySummary | null }

  return (
    <div className="min-h-screen">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <Link href={`/policies/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-900">
            <ChevronLeft className="h-4 w-4" /> Back to overview
          </Link>
        </div>
        <PolicyNav policyId={id} />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {!summary && (
          <p className="text-slate-500">No summary available yet. Please wait for processing to complete.</p>
        )}

        {summary && (
          <>
            {summary.coverage_json?.length > 0 && (
              <section id="coverage">
                <h2 className="text-xl font-bold text-slate-900 mb-4">What&apos;s Covered</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {summary.coverage_json.map((item, i) => (
                    <CoverageCard key={i} item={item} policyId={id} />
                  ))}
                </div>
              </section>
            )}

            {summary.exclusions_json?.length > 0 && (
              <section id="exclusions">
                <h2 className="text-xl font-bold text-slate-900 mb-4">What&apos;s Not Covered (Exclusions)</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {summary.exclusions_json.map((item, i) => (
                    <CoverageCard key={i} item={item} policyId={id} />
                  ))}
                </div>
              </section>
            )}

            {summary.limits_json?.length > 0 && (
              <section id="limits">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <PoundSterling className="h-6 w-6 text-blue-600" />
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
                        {limit.page > 0 && <p className="text-xs text-slate-400">Page {limit.page} &middot; {limit.section}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {summary.risk_flags_json?.length > 0 && (
              <section id="risk-flags">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Risk Flags</h2>
                <div className="space-y-4">
                  {summary.risk_flags_json.map((flag, i) => (
                    <RiskFlagCard key={i} flag={flag} />
                  ))}
                </div>
              </section>
            )}

            {summary.important_conditions_json?.length > 0 && (
              <section id="important-conditions">
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-6 w-6 text-slate-500" />
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
                        {cond.page > 0 && <p className="text-xs text-slate-400">Page {cond.page} &middot; {cond.section}</p>}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            <DisclaimerBanner />
          </>
        )}
      </div>
    </div>
  )
}
