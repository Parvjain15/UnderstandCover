import Stripe from 'stripe'

// Lazily initialised so the build succeeds without STRIPE_SECRET_KEY set.
// The key is only required at request time.
let _stripe: Stripe | null = null

function getStripe(): Stripe {
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-04-22.dahlia',
    })
  }
  return _stripe
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    return getStripe()[prop as keyof Stripe]
  },
})

export const PLANS = {
  free: {
    label: 'Free',
    policyLimit: 3,
    questionLimit: 20,
  },
  pro: {
    label: 'Pro',
    policyLimit: null, // unlimited
    questionLimit: 50,
  },
} as const

export type Tier = keyof typeof PLANS
