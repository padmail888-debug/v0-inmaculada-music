"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { getToken, onMessage } from "firebase/messaging"
import { useAuth } from "@/hooks/use-auth"
import { resolveApiUrl, shouldUseCapacitorNativePush } from "@/lib/api-base"
import { getCachedResolvedApiBase, onApiBaseReady, resolveNativeApiBase } from "@/lib/native-api-resolver"
import { ensureFirebaseWebApp } from "@/lib/init-firebase-web"
import { getFirebaseMessagingIfSupported } from "@/lib/firebase-client"
import { getPushPlatform } from "@/lib/push-platform"
import { registerDeviceToken } from "@/lib/notification-client"
import { showForegroundPushNotification } from "@/lib/foreground-push-notification"
import { getSupabase } from "@/lib/supabase/client"

const ANDROID_CHANNEL_ID = "inmaculada_default"

async function ensureNativeApiBaseReady(): Promise<string | null> {
  if (getCachedResolvedApiBase()) return getCachedResolvedApiBase()
  return resolveNativeApiBase()
}

/** Android 13+ requires POST_NOTIFICATIONS at runtime for FCM tray display. */
async function ensureAndroidNotificationPermission(): Promise<void> {
  if (getPushPlatform() !== "android") return
  try {
    const { LocalNotifications } = await import("@capacitor/local-notifications")
    const perm = await LocalNotifications.checkPermissions()
    if (perm.display !== "granted") {
      await LocalNotifications.requestPermissions()
    }
  } catch (err) {
    console.warn("[notifications] Android POST_NOTIFICATIONS request failed:", err)
  }
}

async function registerFirebaseServiceWorker(): Promise<ServiceWorkerRegistration> {
  const swPath = "/firebase-messaging-sw.js"
  const probe = await fetch(swPath, { method: "HEAD", cache: "no-store" })
  if (!probe.ok) {
    throw new Error(
      `firebase-messaging-sw.js returned ${probe.status}. Deploy with Firebase env vars on Vercel, then redeploy.`,
    )
  }

  const existing = await navigator.serviceWorker.getRegistrations()
  for (const registration of existing) {
    if (registration.active?.scriptURL?.includes("firebase-messaging-sw")) {
      await registration.update()
      return registration
    }
  }

  return navigator.serviceWorker.register(swPath, { scope: "/" })
}

function deepLinkFromNotificationData(data: Record<string, unknown> | undefined): string {
  if (!data) return ""
  const path =
    (typeof data.deepLink === "string" && data.deepLink) ||
    (typeof data.deep_link === "string" && data.deep_link) ||
    ""
  return path.startsWith("/") ? path : ""
}

export function PushNotificationRegistrar() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    /** Wait until auth init finishes — localStorage `user` can exist before Supabase session is ready for Bearer APIs. */
    if (!user?.id || isLoading) return

    const listenerHandles: Array<{ remove: () => Promise<void> }> = []
    let unsubscribeWeb: (() => void) | null = null
    let cancelled = false

    function dispatchInboxRefresh() {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:notification-created", { detail: {} }))
      }
    }

    async function setupWebPush() {
      ensureFirebaseWebApp()

      const { data } = await getSupabase().auth.getSession()
      if (!data.session?.access_token) {
        console.warn("[notifications] no Supabase session; cannot register web push token")
        return
      }

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission !== "granted") {
        const permission = await Notification.requestPermission()
        if (permission !== "granted") {
          console.warn("[notifications] Notification permission not granted")
          return
        }
      }

      if (!("serviceWorker" in navigator)) {
        console.warn("[notifications] serviceWorker not supported")
        return
      }

      const swRegistration = await registerFirebaseServiceWorker()
      await navigator.serviceWorker.ready

      const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
      if (!vapidKey) {
        console.warn("[notifications] NEXT_PUBLIC_FIREBASE_VAPID_KEY is missing")
        return
      }

      const messaging = await getFirebaseMessagingIfSupported()
      if (!messaging) {
        console.warn("[notifications] Firebase messaging not supported in this browser")
        return
      }

      const token = await getToken(messaging, { vapidKey, serviceWorkerRegistration: swRegistration })
      if (!token) {
        console.warn("[notifications] getToken returned empty token")
        return
      }

      await registerDeviceToken(token, "web")
      console.log("[notifications] FCM token registered: web")

      unsubscribeWeb = onMessage(messaging, (payload) => {
        dispatchInboxRefresh()
        const title = payload.notification?.title || "Nueva notificación"
        const body = payload.notification?.body || "Tienes una notificación nueva."
        if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
          new Notification(title, { body })
        }
      })
    }

    async function setupNativePush() {
      const apiBase = await ensureNativeApiBaseReady()
      const registerUrl = resolveApiUrl("/api/notifications/register-device")
      if (!registerUrl || !apiBase) {
        console.error(
          "[notifications] Native push aborted: no reachable API — run npm run dev:lan (local) or set NEXT_PUBLIC_APP_URL (production), then rebuild the APK.",
        )
        return
      }

      console.log("[notifications] Native push using API base:", apiBase)

      const { FirebaseMessaging } = await import("@capacitor-firebase/messaging")

      const platform = getPushPlatform()

      await ensureAndroidNotificationPermission()

      if (platform === "android") {
        try {
          await FirebaseMessaging.createChannel({
            id: ANDROID_CHANNEL_ID,
            name: "Notificaciones",
            description: "Alertas de Inmaculada Music",
            importance: 4,
            visibility: 1,
            sound: "default",
            vibration: true,
          })
        } catch (channelErr) {
          console.warn("[notifications] createChannel failed (may already exist):", channelErr)
        }
      }

      listenerHandles.push(
        await FirebaseMessaging.addListener("tokenReceived", async ({ token }) => {
          if (cancelled) return
          try {
            await registerDeviceToken(token, getPushPlatform())
            console.log("[notifications] FCM token refreshed:", getPushPlatform())
          } catch (err) {
            console.warn("[notifications] token refresh register failed:", err)
          }
        }),
      )

      listenerHandles.push(
        await FirebaseMessaging.addListener("notificationReceived", (event) => {
          dispatchInboxRefresh()
          const title = event.notification?.title ?? "Nueva notificación"
          const body = event.notification?.body ?? ""
          void showForegroundPushNotification(title, body)
        }),
      )

      listenerHandles.push(
        await FirebaseMessaging.addListener("notificationActionPerformed", (event) => {
          dispatchInboxRefresh()
          const path = deepLinkFromNotificationData(
            event.notification?.data as Record<string, unknown> | undefined,
          )
          if (path) router.push(path)
        }),
      )

      const permStatus = await FirebaseMessaging.checkPermissions()
      let receive = permStatus.receive
      if (receive === "prompt") {
        const requested = await FirebaseMessaging.requestPermissions()
        receive = requested.receive
      }
      if (receive !== "granted") {
        console.warn("[notifications] push permission not granted:", receive)
        return
      }

      const { token } = await FirebaseMessaging.getToken()
      if (!token) {
        console.warn("[notifications] FCM getToken returned empty token")
        return
      }

      await registerDeviceToken(token, platform)
      console.log("[notifications] FCM token registered:", platform)
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:fcm-token-registered", { detail: { platform } }))
      }
    }

    async function setup() {
      try {
        if (shouldUseCapacitorNativePush()) {
          await setupNativePush()
        } else {
          await setupWebPush()
        }
      } catch (e) {
        console.warn("[notifications] push registration failed:", e)
      }
    }

    void setup()

    const unsubApi = onApiBaseReady(() => {
      if (cancelled) return
      void setup()
    })
    const onApiReady = () => {
      if (cancelled) return
      void setup()
    }
    window.addEventListener("app:api-base-ready", onApiReady)

    return () => {
      cancelled = true
      unsubApi()
      window.removeEventListener("app:api-base-ready", onApiReady)
      if (unsubscribeWeb) unsubscribeWeb()
      void Promise.all(listenerHandles.map((h) => h.remove()))
    }
  }, [user?.id, isLoading, router])

  return null
}
