import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const policyId = req.nextUrl.searchParams.get('policyId')
  if (!policyId) return NextResponse.json({ error: 'Missing policyId' }, { status: 400 })

  const { data: policy } = await supabase
    .from('policies')
    .select('policy_type, user_context_json')
    .eq('id', policyId)
    .eq('user_id', user.id)
    .single()

  if (!policy) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [{ count }, { data: questions }] = await Promise.all([
    supabase
      .from('questions')
      .select('id', { count: 'exact', head: true })
      .eq('policy_id', policyId)
      .eq('user_id', user.id)
      .gte('created_at', monthAgo),
    supabase
      .from('questions')
      .select('*')
      .eq('policy_id', policyId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return NextResponse.json({
    policyType: policy.policy_type ?? 'other',
    userContext: policy.user_context_json ?? null,
    questionsUsed: count ?? 0,
    questionsLimit: 20,
    questions: questions ?? [],
  })
}
