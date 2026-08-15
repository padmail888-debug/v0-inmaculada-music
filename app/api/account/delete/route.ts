import { NextResponse } from "next/server"
import Stripe from "stripe"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { getAuthedUserIdFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"
import { mapSupabaseRoleToUserRole } from "@/lib/user-role"
import { isDeleteAccountConfirm } from "@/lib/account-delete"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

function getStripe(): Stripe | null {
  const secret = process.env.STRIPE_SECRET_KEY
  if (!secret) return null
  return new Stripe(secret, { apiVersion: "2024-04-10" })
}

async function cancelStripeForUser(params: {
  email?: string | null
  stripeCustomerId?: string | null
  stripeSubscriptionId?: string | null
}) {
  const stripe = getStripe()
  if (!stripe) return

  const cancelled = new Set<string>()

  const cancelSub = async (id: string) => {
    if (!id || cancelled.has(id)) return
    try {
      await stripe.subscriptions.cancel(id)
      cancelled.add(id)
    } catch (err) {
      console.warn("[account/delete] Stripe subscription cancel failed:", id, err)
    }
  }

  const cancelCustomerSubs = async (customerId: string) => {
    try {
      const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 20 })
      for (const sub of subs.data) {
        if (["active", "trialing", "past_due", "unpaid"].includes(sub.status)) {
          await cancelSub(sub.id)
        }
      }
    } catch (err) {
      console.warn("[account/delete] Stripe customer subscriptions failed:", customerId, err)
    }
  }

  if (params.stripeSubscriptionId) {
    await cancelSub(params.stripeSubscriptionId)
  }

  const customerIds = new Set<string>()
  if (params.stripeCustomerId) customerIds.add(params.stripeCustomerId)

  if (params.email) {
    try {
      const customers = await stripe.customers.list({ email: params.email, limit: 5 })
      for (const customer of customers.data) customerIds.add(customer.id)
    } catch (err) {
      console.warn("[account/delete] Stripe customer lookup failed:", err)
    }
  }

  for (const customerId of customerIds) {
    await cancelCustomerSubs(customerId)
    try {
      await stripe.customers.del(customerId)
    } catch (err) {
      console.warn("[account/delete] Stripe customer delete failed:", customerId, err)
    }
  }
}

async function removeStorageFolder(
  supabase: ReturnType<typeof getSupabaseServer>,
  bucket: string,
  prefix: string,
) {
  try {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: 1000 })
    if (error || !data?.length) return
    const paths = data
      .filter((item) => item.name && item.id)
      .map((item) => `${prefix}/${item.name}`)
    if (paths.length === 0) return
    await supabase.storage.from(bucket).remove(paths)
  } catch (err) {
    console.warn("[account/delete] storage cleanup failed:", bucket, prefix, err)
  }
}

/** Authenticated user permanently deletes their own account. Super Admin cannot self-delete. */
export async function POST(request: Request) {
  try {
    const userId = await getAuthedUserIdFromRequest(request)
    if (!userId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const body = (await request.json().catch(() => ({}))) as { confirm?: string }
    const confirm = typeof body.confirm === "string" ? body.confirm : ""
    if (!isDeleteAccountConfirm(confirm)) {
      return withApiCorsHeaders(
        NextResponse.json(
          { error: "Escribe ELIMINAR o DELETE para confirmar la eliminación." },
          { status: 400 },
        ),
      )
    }

    const supabase = getSupabaseServer()
    const { data: authUser, error: authErr } = await supabase.auth.admin.getUserById(userId)
    if (authErr || !authUser?.user) {
      return withApiCorsHeaders(NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 }))
    }

    const role = mapSupabaseRoleToUserRole(
      ((authUser.user.app_metadata as { role?: string } | undefined)?.role ||
        (authUser.user.user_metadata as { role?: string } | undefined)?.role) ??
        "",
    )
    if (role === "superadmin") {
      return withApiCorsHeaders(
        NextResponse.json(
          { error: "Un Super Admin no puede eliminar su propia cuenta." },
          { status: 403 },
        ),
      )
    }

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", userId)
      .maybeSingle()

    await cancelStripeForUser({
      email: authUser.user.email,
      stripeCustomerId: subscription?.stripe_customer_id ?? null,
      stripeSubscriptionId: subscription?.stripe_subscription_id ?? null,
    })

    await removeStorageFolder(supabase, "songs", userId)
    await removeStorageFolder(supabase, "covers", userId)
    await removeStorageFolder(supabase, "covers", `playlists/${userId}`)

    const tableDeletes: Array<{ table: string; column?: string }> = [
      { table: "device_tokens" },
      { table: "user_notifications" },
      { table: "favorite_songs" },
      { table: "favorite_artists" },
      { table: "downloaded_songs" },
      { table: "playlists" },
      { table: "subscriptions" },
      { table: "artists" },
      { table: "profiles", column: "id" },
    ]

    for (const { table, column } of tableDeletes) {
      const { error } = await supabase.from(table).delete().eq(column || "user_id", userId)
      if (error && !/schema cache|does not exist|relation/i.test(error.message)) {
        console.warn(`[account/delete] ${table} cleanup:`, error.message)
      }
    }

    const { error: deleteErr } = await supabase.auth.admin.deleteUser(userId)
    if (deleteErr) {
      return withApiCorsHeaders(
        NextResponse.json({ error: deleteErr.message || "No se pudo eliminar la cuenta" }, { status: 500 }),
      )
    }

    return withApiCorsHeaders(NextResponse.json({ ok: true }))
  } catch (error) {
    return withApiCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      ),
    )
  }
}
