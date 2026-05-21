import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia',
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
