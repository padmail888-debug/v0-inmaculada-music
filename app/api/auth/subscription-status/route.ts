import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { decodeJwtPayload } from "@/lib/jwt-decode"
import { getSupabaseServer } from "@/lib/supabase/server"
import { mapSupabaseRoleToUserRole } from "@/lib/user-role"
import { STRIPE_CONFIG } from "@/lib/stripe-config"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(secret, { apiVersion: "2024-04-10" })
}

function planFromPriceId(priceId: string | undefined): "premium" | "artist-pro" | null {
  if (!priceId) return null
  if (priceId === STRIPE_CONFIG.prices.artist_pro_monthly) return "artist-pro"
  if (priceId === STRIPE_CONFIG.prices.premium_monthly) return "premium"
  return null
}

/**
 * POST /api/auth/subscription-status
 * Body: { accessToken: string }
 * Returns active Stripe subscription for the user (by metadata userId or customer email).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : null
    if (!accessToken) {
      return withApiCorsHeaders(NextResponse.json({ error: "accessToken required" }, { status: 400 }))
    }

    const payload = decodeJwtPayload<{ sub?: string; email?: string }>(accessToken)
    const userId = payload?.sub
    if (!userId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Invalid token" }, { status: 401 }))
    }

    const supabase = getSupabaseServer()
    const { data: userData } = await supabase.auth.admin.getUserById(userId)
    const email = userData?.user?.email ?? payload.email ?? undefined

    const stripe = getStripe()
    const activeStatuses = new Set<Stripe.Subscription.Status>(["active", "trialing", "past_due"])

    let matched: Stripe.Subscription | null = null

    // Subscriptions tagged with userId at checkout
    let startingAfter: string | undefined
    for (let page = 0; page < 5 && !matched; page++) {
      const list = await stripe.subscriptions.list({
        status: "all",
        limit: 100,
        ...(startingAfter ? { starting_after: startingAfter } : {}),
      })
      matched =
        list.data.find(
          (s) =>
            activeStatuses.has(s.status) &&
            (s.metadata?.userId === userId || s.metadata?.user_id === userId),
        ) ?? null
      if (!list.has_more || matched) break
      startingAfter = list.data[list.data.length - 1]?.id
    }

    // Fallback: customer email → active subscriptions
    if (!matched && email) {
      const customers = await stripe.customers.list({ email, limit: 3 })
      for (const customer of customers.data) {
        const subs = await stripe.subscriptions.list({
          customer: customer.id,
          status: "all",
          limit: 20,
        })
        const hit = subs.data.find((s) => activeStatuses.has(s.status))
        if (hit) {
          matched = hit
          break
        }
      }
    }

    if (!matched) {
      return withApiCorsHeaders(
        NextResponse.json({ active: false, plan: null, role: "free" as const }),
      )
    }

    const priceId = matched.items.data[0]?.price?.id
    const planFromMeta = (matched.metadata?.planName as string | undefined) ?? ""
    const planFromPrice = planFromPriceId(priceId)
    const planFromMetaMapped = mapSupabaseRoleToUserRole(planFromMeta)
    const plan =
      planFromPrice ??
      (planFromMetaMapped === "artist-pro" ? "artist-pro" : planFromMetaMapped === "premium" ? "premium" : "premium")

    return withApiCorsHeaders(
      NextResponse.json({
        active: true,
        plan,
        role: plan,
        status: matched.status,
        currentPeriodEnd: matched.current_period_end
          ? new Date(matched.current_period_end * 1000).toISOString()
          : null,
      }),
    )
  } catch (e) {
    console.error("[subscription-status]", e)
    return withApiCorsHeaders(
      NextResponse.json(
        { error: "Server error", detail: e instanceof Error ? e.message : String(e) },
        { status: 500 },
      ),
    )
  }
}
