import { getFirebaseAdminApp, sendPushToTokens } from "@/lib/firebase-admin"
import { getSupabaseServer } from "@/lib/supabase/server"

export type PushPayload = {
  title: string
  body: string
  data?: Record<string, string>
}

async function deactivateInvalidTokens(tokens: string[]) {
  if (tokens.length === 0) return
  const supabase = getSupabaseServer()
  await supabase.from("device_tokens").update({ is_active: false }).in("token", tokens)
}

/** Wait for FCM token registration after login (race with PushNotificationRegistrar). */
export async function fetchActiveDeviceTokens(
  userIds: string[],
  options?: { maxAttempts?: number; delayMs?: number },
): Promise<string[]> {
  const maxAttempts = options?.maxAttempts ?? 10
  const delayMs = options?.delayMs ?? 400
  const supabase = getSupabaseServer()

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const { data, error } = await supabase
      .from("device_tokens")
      .select("token")
      .in("user_id", userIds)
      .eq("is_active", true)

    if (error) {
      console.error("[notifications] device_tokens read failed:", error.message)
      return []
    }

    const tokens = (data ?? []).map((r: { token: string }) => r.token).filter(Boolean)
    if (tokens.length > 0) {
      if (attempt > 1) {
        console.log("[notifications] device_tokens available after retry", { attempt, count: tokens.length })
      }
      return tokens
    }

    if (attempt < maxAttempts) {
      await new Promise((r) => setTimeout(r, delayMs * attempt))
    }
  }

  return []
}

export async function sendPushToUserDevices(
  userIds: string[],
  payload: PushPayload,
  options?: { waitForTokens?: boolean },
): Promise<{ sent: boolean; tokenCount: number; successCount: number; failureCount: number }> {
  const uniqueUserIds = [...new Set(userIds)].filter(Boolean)
  if (uniqueUserIds.length === 0) {
    return { sent: false, tokenCount: 0, successCount: 0, failureCount: 0 }
  }

  if (!getFirebaseAdminApp()) {
    console.warn("[notifications] Firebase Admin missing — push skipped")
    return { sent: false, tokenCount: 0, successCount: 0, failureCount: 0 }
  }

  const tokens = options?.waitForTokens
    ? await fetchActiveDeviceTokens(uniqueUserIds)
    : (
        await getSupabaseServer()
          .from("device_tokens")
          .select("token")
          .in("user_id", uniqueUserIds)
          .eq("is_active", true)
      ).data?.map((r: { token: string }) => r.token).filter(Boolean) ?? []

  if (tokens.length === 0) {
    return { sent: false, tokenCount: 0, successCount: 0, failureCount: 0 }
  }

  const pushRes = await sendPushToTokens(tokens, payload)
  console.log("[notifications] FCM multicast", {
    tokens: tokens.length,
    success: pushRes.successCount,
    failure: pushRes.failureCount,
  })

  if (pushRes.invalidTokens.length > 0) {
    await deactivateInvalidTokens(pushRes.invalidTokens)
  }

  return {
    sent: pushRes.successCount > 0,
    tokenCount: tokens.length,
    successCount: pushRes.successCount,
    failureCount: pushRes.failureCount,
  }
}

/**
 * Background retries (login, likes, payments, releases) without blocking API/UI.
 * Stops after first successful FCM delivery.
 */
export function schedulePushDeliveryWithRetry(
  userIds: string[],
  payload: PushPayload,
  options?: { delaysMs?: number[] },
) {
  const delays = options?.delaysMs ?? [1500, 4000, 8000]
  void (async () => {
    for (const delay of delays) {
      await new Promise((r) => setTimeout(r, delay))
      const result = await sendPushToUserDevices(userIds, payload, { waitForTokens: true })
      if (result.sent) {
        console.log("[notifications] push delivered on retry", {
          type: payload.data?.type,
          delayMs: delay,
          successCount: result.successCount,
        })
        return
      }
    }
    console.warn("[notifications] push retries exhausted", { type: payload.data?.type, userCount: userIds.length })
  })()
}

/** After login, token may register after inbox row is created — resend latest notification push. */
export async function resendPushForLatestUserNotification(userId: string, withinMinutes = 15) {
  const supabase = getSupabaseServer()
  const since = new Date(Date.now() - withinMinutes * 60 * 1000).toISOString()

  const { data: userRow, error } = await supabase
    .from("user_notifications")
    .select(
      `
      id,
      notification_id,
      notifications (
        title,
        message,
        type,
        deep_link
      )
    `,
    )
    .eq("user_id", userId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !userRow) return { sent: false as const, reason: "no_recent_notification" as const }

  const notif = userRow.notifications as
    | { title?: string; message?: string; type?: string; deep_link?: string | null }
    | { title?: string; message?: string; type?: string; deep_link?: string | null }[]
    | null
  const base = Array.isArray(notif) ? notif[0] : notif
  if (!base?.title) return { sent: false as const, reason: "no_notification_payload" as const }

  const title = base.title
  const body = base.message ?? ""
  const deepLink = base.deep_link ?? ""

  console.log("[notifications] resend push for latest user_notification", {
    userId,
    userNotificationId: userRow.id,
    notificationId: userRow.notification_id,
  })

  const result = await sendPushToUserDevices([userId], {
    title,
    body,
    data: {
      type: base.type ?? "account",
      deepLink,
      deep_link: deepLink,
      notificationId: String(userRow.notification_id),
      userNotificationId: String(userRow.id),
    },
  })

  return { sent: result.sent, reason: result.sent ? ("resent" as const) : ("resend_failed" as const), ...result }
}
