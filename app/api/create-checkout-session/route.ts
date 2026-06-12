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
    const body = await request.json()
    const { priceId, planName, userId, customerEmail } = body as {
      priceId?: string
      planName?: string
      userId?: string
      customerEmail?: string
    }

    if (!priceId) {
      return NextResponse.json({ error: "priceId is required" }, { status: 400 })
    }

    if (!userId) {
      console.warn(
        "[create-checkout-session] userId missing — after payment the webhook will not update the user's role. Ensure the user is logged in and the subscription page sends user.id."
      )
    }

    const baseUrl = STRIPE_CONFIG.domain
    const stripe = getStripe()

    const planSlug = (planName || "Premium").toLowerCase().includes("artist") ? "artist-pro" : "premium"
    const successUrl =
      planSlug === "artist-pro"
        ? `${baseUrl}/artist/profile?success=true&session_id={CHECKOUT_SESSION_ID}`
        : `${baseUrl}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}&plan=${planSlug}`

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
      metadata: {
        planName: planName || "Premium",
        ...(userId && { userId }),
      },
      // Copy onto the Subscription so invoice.* / subscription.* webhooks can resolve the app user.
      ...(userId
        ? {
            subscription_data: {
              metadata: {
                userId,
                planName: planName || "Premium",
              },
            },
          }
        : {}),
      ...(customerEmail && { customer_email: customerEmail }),
      client_reference_id: userId || undefined,
      allow_promotion_codes: true,
      billing_address_collection: "required",
    })

    return NextResponse.json({ sessionId: session.id, url: session.url })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creating checkout session" },
      { status: 500 }
    )
  }
}
