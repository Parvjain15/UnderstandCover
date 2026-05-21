import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/server'
import type Stripe from 'stripe'

async function applySubscription(
  adminClient: Awaited<ReturnType<typeof createAdminClient>>,
  subscription: Stripe.Subscription
) {
  const userId = subscription.metadata?.supabase_user_id
  if (!userId) return

  const isActive = subscription.status === 'active' || subscription.status === 'trialing'

  await adminClient.from('profiles').upsert({
    id: userId,
    stripe_subscription_id: subscription.id,
    subscription_tier: isActive ? 'pro' : 'free',
    subscription_status: subscription.status,
    current_period_end: new Date(
      (subscription as Stripe.Subscription & { current_period_end: number }).current_period_end * 1000
    ).toISOString(),
    updated_at: new Date().toISOString(),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 })

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    console.error('Webhook signature failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const adminClient = await createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break

        // Link Stripe customer to user
        const userId = session.metadata?.supabase_user_id
        if (userId && session.customer) {
          await adminClient.from('profiles').upsert({
            id: userId,
            stripe_customer_id: session.customer as string,
            updated_at: new Date().toISOString(),
          })
        }

        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        await applySubscription(adminClient, subscription)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await applySubscription(adminClient, subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.supabase_user_id
        if (userId) {
          await adminClient.from('profiles').update({
            subscription_tier: 'free',
            subscription_status: 'canceled',
            stripe_subscription_id: null,
            updated_at: new Date().toISOString(),
          }).eq('id', userId)
        }
        break
      }
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
    return NextResponse.json({ error: 'Handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
