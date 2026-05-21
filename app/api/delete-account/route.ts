import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase = await createClient()
  const adminClient = await createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Delete all storage files
  const { data: policies } = await adminClient
    .from('policies')
    .select('file_url')
    .eq('user_id', user.id)

  if (policies?.length) {
    const filePaths = policies.map((p) => p.file_url).filter(Boolean)
    if (filePaths.length) {
      await adminClient.storage.from('policy-files').remove(filePaths)
    }
  }

  // Delete all user data (cascades via FK)
  await adminClient.from('ai_logs').delete().eq('user_id', user.id)
  await adminClient.from('questions').delete().eq('user_id', user.id)

  // Get all policy IDs to delete related records
  const policyIds = policies?.map((p) => (p as { id?: string }).id).filter(Boolean) ?? []
  for (const policyId of policyIds) {
    await adminClient.from('policy_summaries').delete().eq('policy_id', policyId)
    await adminClient.from('policy_chunks').delete().eq('policy_id', policyId)
    await adminClient.from('policy_pages').delete().eq('policy_id', policyId)
  }

  await adminClient.from('policies').delete().eq('user_id', user.id)
  await adminClient.from('users').delete().eq('id', user.id)
  await adminClient.auth.admin.deleteUser(user.id)

  return NextResponse.json({ success: true })
}
