import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE(req: NextRequest) {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { policyId } = await req.json()
  if (!policyId) return NextResponse.json({ error: 'Missing policyId' }, { status: 400 })

  const { data: policy } = await supabase.from('policies').select('file_url').eq('id', policyId).eq('user_id', user.id).single()
  if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 })

  // Delete storage file
  if (policy.file_url) {
    await adminClient.storage.from('policy-files').remove([policy.file_url])
  }

  // Delete DB records (cascade should handle related tables)
  await adminClient.from('policy_summaries').delete().eq('policy_id', policyId)
  await adminClient.from('questions').delete().eq('policy_id', policyId)
  await adminClient.from('policy_chunks').delete().eq('policy_id', policyId)
  await adminClient.from('policy_pages').delete().eq('policy_id', policyId)
  await adminClient.from('ai_logs').delete().eq('policy_id', policyId)
  await adminClient.from('policies').delete().eq('id', policyId)

  return NextResponse.json({ success: true })
}
