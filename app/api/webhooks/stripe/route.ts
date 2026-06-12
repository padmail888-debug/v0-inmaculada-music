import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getSupabaseServer } from "@/lib/supabase/server"
import { createAndDispatchNotification } from "@/lib/notification-service"

function getStripe(): Stripe {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(secret, { apiVersion: "2024-04-10" })
}

/** Map Stripe plan name (metadata) to Supabase app_metadata.role (login form maps these to UserRole). */
function planNameToAppRole(planName: string): string {
  const n = (planName || "").toLowerCase()
  if (n.includes("artist") && n.includes("pro")) return "Artist Pro"
  if (n.includes("premium")) return "Paid User"
  return "Paid User"
}

export async function POST(req: NextRequest) {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!endpointSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set")
    return NextResponse.json({ error: "Webhook configuration error" }, { status: 500 })
  }

  const body = await req.text()
  const sig = req.headers.get("stripe-signature")
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  const stripe = getStripe()
  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Webhook signature verification failed"
    console.error(msg)
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const userId =
        (typeof session.metadata?.userId === "string" ? session.metadata.userId : null) ??
        (typeof session.client_reference_id === "string" ? session.client_reference_id : null)
      const planName = (session.metadata?.planName as string) || "Premium"

      console.log("[Stripe webhook] checkout.session.completed", {
        sessionId: session.id,
        userId: userId ?? "(missing)",
        metadata: session.metadata,
        client_reference_id: session.client_reference_id,
      })

      if (!userId) {
        console.warn(
          "[Stripe webhook] No userId in session — role not updated. User must be logged in when clicking Subscribe, and create-checkout-session must receive userId."
        )
        break
      }

      try {
        const supabase = getSupabaseServer()
        const appRole = planNameToAppRole(planName)
        const { data: existing } = await supabase.auth.admin.getUserById(userId)
        const currentAppMeta = (existing?.user?.app_metadata ?? {}) as Record<string, unknown>
        const mergedAppMeta = { ...currentAppMeta, role: appRole }
        const { data: updatedUser, error } = await supabase.auth.admin.updateUserById(userId, {
          app_metadata: mergedAppMeta,
        })
        if (error) {
          console.error("[Stripe webhook] updateUserById error:", error.message, "userId:", userId)
        } else {
          const gotRole = (updatedUser?.user?.app_metadata as Record<string, unknown>)?.role
          console.log("[Stripe webhook] Updated user role:", userId, "→", appRole, "| read-back:", gotRole ?? "(undefined)")

          await createAndDispatchNotification({
            type: "payment_success",
            title: "Pago completado correctamente",
            message:
              appRole === "Artist Pro"
                ? "Tu suscripción Artist Pro está activa. Ya puedes usar las funciones pro."
                : "Tu suscripción Premium está activa.",
            deepLink: appRole === "Artist Pro" ? "/artist/profile?tab=summary" : "/dashboard",
            recipientUserIds: [userId],
            metadata: { plan: appRole, source: "stripe_webhook" },
          })

          if (appRole === "Artist Pro") {
            const { data: adminUsers } = await supabase.auth.admin.listUsers()
            const adminIds =
              adminUsers?.users
                ?.filter((u) => String((u.app_metadata as Record<string, unknown>)?.role ?? "").toLowerCase().includes("super"))
                .map((u) => u.id) ?? []
            if (adminIds.length > 0) {
              await createAndDispatchNotification({
                type: "admin_alert",
                title: "Nuevo pago Artist Pro",
                message: "Se confirmó un nuevo pago de Artist Pro.",
                recipientUserIds: adminIds,
                metadata: { paidUserId: userId, plan: appRole },
              })
            }
          }
        }
      } catch (e) {
        console.error("[Stripe webhook] Supabase error:", e)
      }
      break
    }

    case "customer.subscription.created": {
      const subscription = event.data.object as Stripe.Subscription
      const priceId = subscription.items.data[0]?.price?.id
      const roleByPriceId: Record<string, string> = {
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_PREMIUM || ""]: "Paid User",
        [process.env.NEXT_PUBLIC_STRIPE_PRICE_ARTIST_PRO || ""]: "Artist Pro",
      }
      const appRole = roleByPriceId[priceId || ""]
      if (!appRole) break
      const userId = subscription.metadata?.userId
      if (userId) {
        try {
          const supabase = getSupabaseServer()
          await supabase.auth.admin.updateUserById(userId, { app_metadata: { role: appRole } })
        } catch (e) {
          console.error("[Stripe webhook] subscription.created Supabase error:", e)
        }
      }
      break
    }

    case "customer.subscription.updated":
      break
    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription
      const userId = subscription.metadata?.userId
      if (userId) {
        try {
          const supabase = getSupabaseServer()
          await supabase.auth.admin.updateUserById(userId, { app_metadata: { role: "free" } })
        } catch (e) {
          console.error("[Stripe webhook] subscription.deleted Supabase error:", e)
        }
      }
      break
    }

    case "invoice.payment_succeeded":
      break
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice
      let userId: string | undefined

      const subscriptionId =
        typeof invoice.subscription === "string"
          ? invoice.subscription
          : invoice.subscription && typeof invoice.subscription !== "string"
            ? invoice.subscription.id
            : null

      if (subscriptionId) {
        try {
          const sub = await stripe.subscriptions.retrieve(subscriptionId)
          const fromMeta = sub.metadata?.userId
          if (typeof fromMeta === "string" && fromMeta.trim()) userId = fromMeta.trim()
        } catch (e) {
          console.error("[Stripe webhook] invoice.payment_failed subscription retrieve:", e)
        }
      }

      if (!userId) {
        const anyInvoice = invoice as unknown as {
          parent?: { subscription_details?: { metadata?: Record<string, string> } }
        }
        const legacy = anyInvoice.parent?.subscription_details?.metadata?.userId
        if (typeof legacy === "string" && legacy.trim()) userId = legacy.trim()
      }

      if (userId) {
        await createAndDispatchNotification({
          type: "payment_failed",
          title: "Pago no completado",
          message: "No pudimos procesar tu pago. Revisa tu método de pago e inténtalo de nuevo.",
          deepLink: "/subscription",
          recipientUserIds: [userId],
          metadata: { source: "stripe_invoice_failed", invoiceId: invoice.id },
        })
      } else {
        console.warn("[Stripe webhook] invoice.payment_failed: could not resolve userId (set subscription metadata userId at checkout).")
      }
      break
    }
    default:
      break
  }

  return NextResponse.json({ received: true })
}
