import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserTier, PLANS } from '@/lib/subscription'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Upload, FileText, Zap } from 'lucide-react'
import { policyTypeLabel, formatDate } from '@/lib/utils'
import { DeletePolicyButton } from './[id]/delete-button'

export default async function PoliciesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: policies }, tier] = await Promise.all([
    supabase
      .from('policies')
      .select('*')
      .eq('user_id', user!.id)
      .order('uploaded_at', { ascending: false }),
    getUserTier(user!.id),
  ])

  const policyLimit = PLANS[tier].policyLimit
  const readyCount = policies?.filter((p) => p.status === 'ready').length ?? 0
  const atLimit = policyLimit !== null && readyCount >= policyLimit
  const isPro = tier === 'pro'

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Policies</h1>
          <p className="text-slate-500 mt-1">
            {isPro
              ? `${readyCount} ${readyCount === 1 ? 'policy' : 'policies'} · Pro plan`
              : `${readyCount} of ${policyLimit} policies used · Free plan`}
          </p>
        </div>
        {!atLimit && (
          <Link href="/upload">
            <Button>
              <Upload className="h-4 w-4" />
              Upload new policy
            </Button>
          </Link>
        )}
      </div>

      {/* Upgrade banner — shown when free user hits the limit */}
      {atLimit && !isPro && (
        <div className="mb-8 rounded-xl border border-blue-200 bg-blue-50 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="h-5 w-5 text-blue-600" />
              <p className="font-semibold text-slate-900">You&apos;ve reached the 3-policy limit</p>
            </div>
            <p className="text-sm text-slate-600">Upgrade to Pro for unlimited policy uploads and 50 questions per policy per month.</p>
          </div>
          <Link href="/settings">
            <Button className="shrink-0">Upgrade to Pro — £6.99/mo</Button>
          </Link>
        </div>
      )}

      {(!policies || policies.length === 0) ? (
        <div className="text-center py-20">
          <FileText className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No policies yet</h2>
          <p className="text-slate-400 mb-6">Upload your first insurance policy to get started.</p>
          <Link href="/upload">
            <Button>Upload your first policy</Button>
          </Link>
          <p className="mt-4 text-sm text-slate-400">
            Or{' '}
            <Link href="/demo" className="text-blue-600 hover:underline">
              try the demo policy
            </Link>
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {policies.map((policy) => (
            <Card key={policy.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <Badge variant={policy.status as 'ready' | 'processing' | 'failed' | 'uploading'}>
                    {policy.status}
                  </Badge>
                  <Badge variant="outline">{policyTypeLabel(policy.policy_type)}</Badge>
                </div>
                <h3 className="font-semibold text-slate-900 mb-1">{policy.policy_nickname}</h3>
                {policy.insurer_name && (
                  <p className="text-sm text-slate-500 mb-0.5">{policy.insurer_name}</p>
                )}
                {(policy.start_date || policy.end_date) && (
                  <p className="text-xs text-slate-400 mb-3">
                    {formatDate(policy.start_date)} — {formatDate(policy.end_date)}
                  </p>
                )}
                <p className="text-xs text-slate-400 mb-4">
                  Uploaded {formatDate(policy.uploaded_at)}
                </p>
                <div className="flex gap-2">
                  <Link href={`/policies/${policy.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      View
                    </Button>
                  </Link>
                  <DeletePolicyButton policyId={policy.id} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
