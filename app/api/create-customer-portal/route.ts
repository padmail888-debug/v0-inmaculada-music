import { type NextRequest, NextResponse } from "next/server"
import { handleApiCorsPreflight } from "@/lib/api-cors"
import Stripe from "stripe"
import { STRIPE_CONFIG } from "@/lib/stripe-config"

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
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json({ error: "Customer ID is required" }, { status: 400 })
    }

    const stripe = getStripe()
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${STRIPE_CONFIG.domain}/subscription`,
    })

    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("Error creating customer portal session:", error)
    return NextResponse.json({ error: "Error creating customer portal session" }, { status: 500 })
  }
}
