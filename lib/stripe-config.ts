import { getSiteUrl } from "@/lib/site-url"

/**
 * Stripe config for the client (publishable key) and shared constants.
 * Server-side code uses process.env.STRIPE_SECRET_KEY and creates its own Stripe instance.
 * Missing env values stay empty so checkout fails closed instead of using dummy IDs.
 */
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
  domain: getSiteUrl(),
  prices: {
    premium_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || "",
    artist_pro_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_ARTIST_PRO || "",
  },
} as const
