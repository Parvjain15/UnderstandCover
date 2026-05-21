import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getUserTier, PLANS } from '@/lib/subscription'
import { v4 as uuidv4 } from 'uuid'

export const maxDuration = 60

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const policyType = formData.get('policyType') as string
    const ownerType = formData.get('ownerType') as string
    const jurisdiction = formData.get('jurisdiction') as string || 'UK'
    const nickname = formData.get('nickname') as string
    const userContext = {
      preExistingConditions: formData.get('preExistingConditions') === 'true',
      highValueItems: formData.get('highValueItems') === 'true',
      adventureActivities: formData.get('adventureActivities') === 'true',
    }

    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (file.type !== 'application/pdf') return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
    if (file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'File exceeds 20MB limit' }, { status: 400 })

    const tier = await getUserTier(user.id)
    const policyLimit = PLANS[tier].policyLimit
    if (policyLimit !== null) {
      const { count } = await supabase.from('policies').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'ready')
      if ((count ?? 0) >= policyLimit) {
        return NextResponse.json({
          error: tier === 'free'
            ? `Free plan is limited to ${policyLimit} policies. Upgrade to Pro for unlimited policies.`
            : `You have reached your policy limit of ${policyLimit}.`,
          upgradeRequired: tier === 'free',
        }, { status: 429 })
      }
    }

    const policyId = uuidv4()
    const filePath = `policies/${user.id}/${policyId}.pdf`
    const fileBuffer = await file.arrayBuffer()

    const adminClient = await createAdminClient()
    const { error: storageError } = await adminClient.storage
      .from('policy-files')
      .upload(filePath, fileBuffer, { contentType: 'application/pdf' })

    if (storageError) {
      console.error('Storage error:', storageError)
      return NextResponse.json({ error: 'Failed to store file' }, { status: 500 })
    }

    const { error: dbError } = await adminClient.from('policies').insert({
      id: policyId,
      user_id: user.id,
      file_url: filePath,
      policy_nickname: nickname || file.name.replace('.pdf', ''),
      policy_type: policyType,
      owner_type: ownerType,
      jurisdiction,
      status: 'uploading',
      user_context_json: userContext,
    })

    if (dbError) {
      await adminClient.storage.from('policy-files').remove([filePath])
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    return NextResponse.json({ policyId })
  } catch (err) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}
