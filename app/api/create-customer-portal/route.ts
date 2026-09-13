import { type NextRequest, NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import Stripe from "stripe"
import { STRIPE_CONFIG } from "@/lib/stripe-config"
import { getAuthedUserIdFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(secret, { apiVersion: "2024-04-10" })
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthedUserIdFromRequest(request)
    if (!userId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const supabase = getSupabaseServer()
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    const email = authUser?.user?.email?.trim()
    if (!email) {
      return withApiCorsHeaders(NextResponse.json({ error: "La cuenta no tiene email" }, { status: 400 }))
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", userId)
      .maybeSingle()

    const stripe = getStripe()
    let customerId =
      typeof subscription?.stripe_customer_id === "string" ? subscription.stripe_customer_id : ""

    if (!customerId) {
      const customers = await stripe.customers.list({ email, limit: 5 })
      customerId = customers.data[0]?.id || ""
    }

    if (!customerId) {
      return withApiCorsHeaders(
        NextResponse.json({ error: "No hay una suscripción de Stripe asociada a esta cuenta" }, { status: 404 }),
      )
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${STRIPE_CONFIG.domain}/subscription`,
    })

    return withApiCorsHeaders(NextResponse.json({ url: session.url }))
  } catch (error) {
    console.error("Error creating customer portal session:", error)
    return withApiCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Error creating customer portal session" },
        { status: 500 },
      ),
    )
  }
}
