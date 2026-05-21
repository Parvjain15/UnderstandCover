import { createAdminClient } from '@/lib/supabase/server'
import { stripe, PLANS, type Tier } from '@/lib/stripe'

export { PLANS, type Tier }

export async function getUserTier(userId: string): Promise<Tier> {
  const adminClient = await createAdminClient()
  const { data } = await adminClient
    .from('profiles')
    .select('subscription_tier, subscription_status')
    .eq('id', userId)
    .single()

  if (
    data?.subscription_tier === 'pro' &&
    (data.subscription_status === 'active' || data.subscription_status === 'trialing')
  ) {
    return 'pro'
  }
  return 'free'
}

export async function getOrCreateStripeCustomer(userId: string, email: string): Promise<string> {
  const adminClient = await createAdminClient()

  const { data: profile } = await adminClient
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .single()

  if (profile?.stripe_customer_id) return profile.stripe_customer_id

  const customer = await stripe.customers.create({
    email,
    metadata: { supabase_user_id: userId },
  })

  await adminClient
    .from('profiles')
    .upsert({ id: userId, stripe_customer_id: customer.id, updated_at: new Date().toISOString() })

  return customer.id
}
