"use client"

import { shouldUseCapacitorNativePush } from "@/lib/api-base"

const ANDROID_CHANNEL_ID = "inmaculada_default"

/**
 * Android does not show FCM notification payloads in the system tray while the app is
 * in the foreground — only the JS listener fires. Post a local notification so users
 * see the same alert as when the app is backgrounded.
 */
export async function showForegroundPushNotification(title: string, body: string) {
  if (!shouldUseCapacitorNativePush()) return
  const trimmedBody = body.trim()
  if (!trimmedBody) return

  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications")
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== "granted") {
      await LocalNotifications.requestPermissions()
    }
    await LocalNotifications.schedule({
      notifications: [
        {
          id: Math.floor(Date.now() % 2_000_000_000),
          title: title.trim() || "Nueva notificación",
          body: trimmedBody,
          channelId: ANDROID_CHANNEL_ID,
        },
      ],
    })
  } catch (err) {
    console.warn("[notifications] foreground system notification failed:", err)
  }
}
