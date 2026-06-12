import { PRIORITY_ORDER, type NotificationType } from "@/lib/notifications"
import {
  fetchActiveDeviceTokens,
  schedulePushDeliveryWithRetry,
  sendPushToUserDevices,
} from "@/lib/push-dispatch"
import { getFirebaseAdminApp } from "@/lib/firebase-admin"
import { getSupabaseServer } from "@/lib/supabase/server"

interface CreateNotificationInput {
  type: NotificationType
  title: string
  message: string
  deepLink?: string | null
  metadata?: Record<string, unknown>
  recipientUserIds: string[]
}

export async function createAndDispatchNotification(input: CreateNotificationInput) {
  const recipientUserIds = [...new Set(input.recipientUserIds)].filter(Boolean)
  if (recipientUserIds.length === 0) return { ok: true as const, reason: "no_recipients" as const }

  const supabase = getSupabaseServer()
  const priority = PRIORITY_ORDER[input.type]

  const { data: notificationRow, error: notifErr } = await supabase
    .from("notifications")
    .insert({
      type: input.type,
      priority,
      title: input.title,
      message: input.message,
      deep_link: input.deepLink ?? null,
      metadata: input.metadata ?? {},
    })
    .select("id")
    .single()

  if (notifErr || !notificationRow?.id) {
    console.error("[notifications] failed to create notification:", notifErr?.message)
    return { ok: false as const, error: notifErr?.message || "Failed to create notification" }
  }

  const userRows = recipientUserIds.map((userId) => ({
    user_id: userId,
    notification_id: notificationRow.id,
    is_read: false,
  }))
  const { data: insertedUserNotifs, error: userInsertErr } = await supabase
    .from("user_notifications")
    .insert(userRows)
    .select("id, user_id, created_at, notification_id, is_read")
  if (userInsertErr) {
    console.error("[notifications] failed to create user_notifications:", userInsertErr.message)
    return { ok: false as const, error: userInsertErr.message }
  }

  const pushPayload = {
    title: input.title,
    body: input.message,
    data: {
      type: input.type,
      deepLink: input.deepLink ?? "",
      deep_link: input.deepLink ?? "",
      notificationId: String(notificationRow.id),
    },
  }

  if (!getFirebaseAdminApp()) {
    console.warn(
      "[notifications] Firebase Admin not configured — in-app saved, push skipped",
      { type: input.type },
    )
    return {
      ok: true as const,
      reason: "db_saved_push_admin_missing" as const,
      notificationId: notificationRow.id,
      userNotifications: insertedUserNotifs ?? [],
    }
  }

  // Logged-in users usually already have tokens; brief wait only (login may resend via register-device).
  await fetchActiveDeviceTokens(recipientUserIds, { maxAttempts: 2, delayMs: 250 })

  const pushResult = await sendPushToUserDevices(recipientUserIds, pushPayload)
  console.log("[notifications] dispatch", {
    type: input.type,
    recipients: recipientUserIds.length,
    pushSent: pushResult.sent,
    tokens: pushResult.tokenCount,
    success: pushResult.successCount,
    failure: pushResult.failureCount,
  })

  if (!pushResult.sent) {
    schedulePushDeliveryWithRetry(recipientUserIds, pushPayload)
  }

  return {
    ok: true as const,
    reason: pushResult.sent ? ("db_saved_push_sent" as const) : ("db_saved_push_retry_scheduled" as const),
    notificationId: notificationRow.id,
    userNotifications: insertedUserNotifs ?? [],
    push: pushResult,
  }
}

export { resendPushForLatestUserNotification } from "@/lib/push-dispatch"
