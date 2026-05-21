import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const policyId = req.nextUrl.searchParams.get('policyId')
  if (!policyId) return NextResponse.json({ error: 'Missing policyId' }, { status: 400 })

  const { data } = await supabase
    .from('policies')
    .select('policy_type')
    .eq('id', policyId)
    .eq('user_id', user.id)
    .single()

  return NextResponse.json({ type: data?.policy_type ?? 'other' })
}
