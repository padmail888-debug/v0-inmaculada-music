/**
 * Stripe config for the client (publishable key) and shared constants.
 * Server-side code uses process.env.STRIPE_SECRET_KEY and creates its own Stripe instance.
 */
export const STRIPE_CONFIG = {
  publishableKey:
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
    "pk_test_51RQqzeRQQkRvF5V9Z62VGTCQCwSq1miasCzPUEXFYDuGxYqGenFMfqCg0f5T0UyAd2TkCUJqMTE4lLNh8vaRDKZM001SZ95PCS",
  domain: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  prices: {
    premium_monthly: process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || "price_1RQr0PRQQkRvF5V9premium_monthly",
    artist_pro_monthly:
      process.env.NEXT_PUBLIC_STRIPE_PRICE_ARTIST_PRO || "price_1RQr0PRQQkRvF5V9artist_pro_monthly",
  },
} as const
