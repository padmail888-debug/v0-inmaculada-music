/** Canonical production deployment (Vercel). */
export const PRODUCTION_APP_URL = "https://v0-inmaculada-music-ochre.vercel.app"

/**
 * Resolves the public app URL for metadata, Stripe redirects, and native API calls.
 * Priority: NEXT_PUBLIC_APP_URL → VERCEL_URL → production default → localhost.
 */
export function getSiteUrl(): string {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "").trim()
  if (raw && /^https?:\/\//i.test(raw)) {
    return raw.replace(/\/$/, "")
  }

  const vercelUrl = (process.env.VERCEL_URL || "").trim()
  if (vercelUrl) {
    const host = vercelUrl.replace(/^https?:\/\//i, "").replace(/\/$/, "")
    return `https://${host}`
  }

  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_APP_URL
  }

  return "http://localhost:3000"
}
