"use client"

import { getSupabase } from "@/lib/supabase/client"
import {
  nativeCrossOriginFetchInit,
  resolveApiUrl,
  getNativeBackendFetchFailureHint,
  shouldUseCapacitorNativePush,
  shouldUseRemoteApiBase,
} from "@/lib/api-base"
import { getCachedResolvedApiBase, resolveNativeApiBase } from "@/lib/native-api-resolver"

const FCM_TOKEN_READY_EVENT = "app:fcm-token-registered"

/**
 * On Android/iOS, login push should run after FCM token is saved (PushNotificationRegistrar).
 */
export function waitForFcmTokenRegistered(timeoutMs = 12_000): Promise<boolean> {
  if (typeof window === "undefined" || !shouldUseCapacitorNativePush()) {
    return Promise.resolve(true)
  }
  return new Promise((resolve) => {
    let settled = false
    const finish = (ok: boolean) => {
      if (settled) return
      settled = true
      window.removeEventListener(FCM_TOKEN_READY_EVENT, onReady as EventListener)
      resolve(ok)
    }
    const onReady = () => finish(true)
    window.addEventListener(FCM_TOKEN_READY_EVENT, onReady as EventListener)
    setTimeout(() => finish(false), timeoutMs)
  })
}

function decodeJwtSub(token: string): string | null {
  try {
    const parts = token.trim().split(".")
    if (parts.length !== 3) return null
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4))
    const json = atob(b64 + pad)
    const payload = JSON.parse(json) as { sub?: string }
    return typeof payload.sub === "string" ? payload.sub : null
  } catch {
    return null
  }
}

/**
 * Auth context can set `user` from localStorage before Supabase finishes hydrating
 * the browser session. A single getSession() then has no access_token → API 401.
 * Retry like login-form, then try refreshSession once.
 */
async function resolveAccessTokenForApi(): Promise<string | null> {
  const supabase = getSupabase()
  for (let attempt = 0; attempt < 6; attempt++) {
    const { data } = await supabase.auth.getSession()
    const token = data.session?.access_token
    if (token) return token
    await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
  }
  try {
    const { data, error } = await supabase.auth.refreshSession()
    if (!error && data.session?.access_token) return data.session.access_token
  } catch {
    /* ignore */
  }
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await resolveAccessTokenForApi()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

function withAuthHeader(accessToken?: string): Record<string, string> {
  if (!accessToken) return {}
  return { Authorization: `Bearer ${accessToken}` }
}

type NotificationFetchPayload = { notifications: any[]; unreadCount: number; totalCount?: number }

const PENDING_MAX_AGE_MS = 2 * 60 * 1000

function getPendingNotification(sessionUserId: string | null): any | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem("pending_notification")
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== "object") return null
    if (typeof parsed.user_notification_id !== "string") return null
    const pendingUserId = typeof parsed.user_id === "string" ? parsed.user_id : null
    if (sessionUserId && pendingUserId && pendingUserId !== sessionUserId) {
      sessionStorage.removeItem("pending_notification")
      return null
    }
    const storedAt =
      typeof parsed.pending_at === "string" ? Date.parse(parsed.pending_at) : Number.NaN
    if (Number.isFinite(storedAt) && Date.now() - storedAt > PENDING_MAX_AGE_MS) {
      sessionStorage.removeItem("pending_notification")
      return null
    }
    return parsed
  } catch {
    return null
  }
}

async function ensureNativeApiBase(): Promise<void> {
  if (!shouldUseRemoteApiBase()) return
  if (getCachedResolvedApiBase()) return
  await resolveNativeApiBase()
}

export async function fetchMyNotifications() {
  await ensureNativeApiBase()
  const token = await resolveAccessTokenForApi()
  const sessionUserId = token ? decodeJwtSub(token) : null
  if (!token) {
    return { notifications: [], unreadCount: 0, totalCount: 0 }
  }
  const headers: Record<string, string> = {
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    Authorization: `Bearer ${token}`,
  }
  const listUrl = resolveApiUrl(`/api/notifications?t=${Date.now()}`)
  if (!listUrl) {
    console.warn("[notifications] missing NEXT_PUBLIC_APP_URL on native; cannot load inbox")
    return { notifications: [], unreadCount: 0, totalCount: 0 }
  }
  let res: Response
  try {
    res = await fetch(listUrl, {
      headers,
      cache: "no-store",
      ...nativeCrossOriginFetchInit,
    })
  } catch (err) {
    const hint = getNativeBackendFetchFailureHint()
    console.warn(
      "[notifications] GET fetch failed (network / connectivity).",
      hint || "Native mixed-content: capacitor.config.ts has android.allowMixedContent.",
      err,
    )
    return { notifications: [], unreadCount: 0, totalCount: 0 }
  }
  if (res.status === 401) {
    try {
      const { data, error } = await getSupabase().auth.refreshSession()
      const next = data.session?.access_token
      if (!error && next) {
        const retryHeaders = { ...headers, Authorization: `Bearer ${next}` }
        const retryUrl = resolveApiUrl(`/api/notifications?t=${Date.now()}`)
        if (retryUrl) {
          res = await fetch(retryUrl, {
            headers: retryHeaders,
            cache: "no-store",
            ...nativeCrossOriginFetchInit,
          })
        }
      }
    } catch {
      /* ignore */
    }
  }
  if (!res.ok) {
    const snippet = await res.text().catch(() => "")
    console.warn("[notifications] GET /api/notifications:", res.status, snippet.slice(0, 280))
    if (res.status === 401) {
      console.warn(
        "[notifications] Unauthorized (check SUPABASE_SERVICE_ROLE_KEY on the machine running next dev, or sign in again).",
      )
    }
    return { notifications: [], unreadCount: 0, totalCount: 0 }
  }
  const payload = (await res.json()) as NotificationFetchPayload
  const pending = getPendingNotification(sessionUserId)
  if (!pending) return payload

  const alreadyOnServer = payload.notifications.some((n) => n.user_notification_id === pending.user_notification_id)
  if (alreadyOnServer) {
    if (typeof window !== "undefined") sessionStorage.removeItem("pending_notification")
    return payload
  }

  const mergedNotifications = [pending, ...payload.notifications]
  const mergedUnread = payload.unreadCount + (pending.is_read ? 0 : 1)
  const mergedTotal = (payload.totalCount ?? payload.notifications.length) + 1
  return { notifications: mergedNotifications, unreadCount: mergedUnread, totalCount: mergedTotal }
}

export async function markNotificationRead(userNotificationId: string) {
  const headers = await getAuthHeader()
  const url = resolveApiUrl("/api/notifications/mark-read")
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL is not configured for native app")
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify({ userNotificationId }),
    ...nativeCrossOriginFetchInit,
  })
  if (!res.ok) {
    const errorText = await res.text().catch(() => "")
    throw new Error(`markNotificationRead failed (${res.status}): ${errorText || "unknown error"}`)
  }
}

export async function markAllNotificationsRead() {
  const headers = await getAuthHeader()
  const url = resolveApiUrl("/api/notifications/mark-all-read")
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL is not configured for native app")
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    cache: "no-store",
    ...nativeCrossOriginFetchInit,
  })
  if (!res.ok) {
    const errorText = await res.text().catch(() => "")
    throw new Error(`markAllNotificationsRead failed (${res.status}): ${errorText || "unknown error"}`)
  }

  const payload = (await res.json().catch(() => null)) as { ok?: boolean } | null
  if (!payload?.ok) {
    throw new Error("markAllNotificationsRead failed: invalid success response")
  }
}

export async function registerDeviceToken(token: string, platform: "android" | "ios" | "web") {
  await ensureNativeApiBase()
  const url = resolveApiUrl("/api/notifications/register-device")
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL is not configured for native app")

  let lastError = ""
  for (let attempt = 1; attempt <= 8; attempt++) {
    const accessToken = await resolveAccessTokenForApi()
    if (!accessToken) {
      lastError = "no Supabase access token (session not ready?)"
      await new Promise((r) => setTimeout(r, 300 * attempt))
      continue
    }

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ token, platform }),
      ...nativeCrossOriginFetchInit,
    })

    if (res.ok) return

    const errorText = await res.text().catch(() => "")
    lastError = `registerDeviceToken failed (${res.status}): ${errorText || "unknown error"}`

    if (res.status === 401 && attempt < 8) {
      try {
        await getSupabase().auth.refreshSession()
      } catch {
        /* ignore */
      }
      await new Promise((r) => setTimeout(r, 350 * attempt))
      continue
    }

    if (attempt < 8 && (res.status === 503 || res.status === 502 || res.status === 429)) {
      await new Promise((r) => setTimeout(r, 500 * attempt))
      continue
    }

    throw new Error(lastError)
  }

  throw new Error(lastError || "registerDeviceToken failed")
}

export async function sendLoginSuccessNotification(accessToken: string) {
  const headers = withAuthHeader(accessToken)
  let lastError = ""
  for (let attempt = 1; attempt <= 3; attempt++) {
    const url = resolveApiUrl("/api/notifications/login-success")
    if (!url) {
      throw new Error("NEXT_PUBLIC_APP_URL is not configured for native app")
    }
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      cache: "no-store",
      keepalive: true,
      body: JSON.stringify({
        source: "login_form",
        loginAt: new Date().toISOString(),
        accessToken,
      }),
      ...nativeCrossOriginFetchInit,
    })
    if (res.ok) {
      const payload = (await res.json().catch(() => null)) as
        | { ok?: boolean; notification?: Record<string, unknown> }
        | null
      if (!payload?.ok) {
        throw new Error("sendLoginSuccessNotification failed: invalid success response")
      }
      return payload.notification ?? null
    }
    const errorText = await res.text().catch(() => "")
    lastError = `sendLoginSuccessNotification failed (${res.status}): ${errorText || "unknown error"}`
    await new Promise((resolve) => setTimeout(resolve, 300 * attempt))
  }
  throw new Error(lastError || "sendLoginSuccessNotification failed")
}

export async function emitNotificationEvent(
  type:
    | "song_liked"
    | "new_follower"
    | "new_song_release"
    | "new_album_release"
    | "artist_pro_feature_used"
    | "account"
    | "security_alert"
    | "payment_success"
    | "payment_failed",
  metadata: Record<string, unknown>,
  extra?: { title?: string; message?: string; accessToken?: string }
) {
  const maxAttempts = 3
  let lastError = ""

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const tokenForBody =
      extra?.accessToken?.trim() || (await resolveAccessTokenForApi())
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(extra?.accessToken
        ? withAuthHeader(extra.accessToken)
        : tokenForBody
          ? { Authorization: `Bearer ${tokenForBody}` }
          : {}),
    }

    const emitUrl = resolveApiUrl("/api/notifications/emit")
    if (!emitUrl) {
      lastError = "emitNotificationEvent: NEXT_PUBLIC_APP_URL is not configured for native app"
      break
    }

    const res = await fetch(emitUrl, {
      method: "POST",
      headers,
      keepalive: true,
      cache: "no-store",
      ...nativeCrossOriginFetchInit,
      body: JSON.stringify({
        type,
        metadata,
        title: extra?.title,
        message: extra?.message,
        accessToken: tokenForBody || undefined,
      }),
    })
    if (res.ok) {
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("app:notification-created", { detail: {} }))
      }
      return
    }

    const errorText = await res.text().catch(() => "")
    lastError = `emitNotificationEvent failed (${res.status}): ${errorText || "unknown error"}`
    if (res.status === 401 && !extra?.accessToken && attempt < maxAttempts) {
      try {
        await getSupabase().auth.refreshSession()
      } catch {
        /* ignore */
      }
    }
    if (attempt < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 400 * attempt))
    }
  }
  throw new Error(lastError || "emitNotificationEvent failed")
}
