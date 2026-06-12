"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useAppForeground } from "@/hooks/use-app-foreground"
import { useAuth } from "@/hooks/use-auth"
import { fetchMyNotifications } from "@/lib/notification-client"
import { onApiBaseReady } from "@/lib/native-api-resolver"
import { getSupabase } from "@/lib/supabase/client"
import type { AppNotification } from "@/lib/notifications"

export interface LiveBannerState {
  title: string
  message: string
}

type FetchPayload = Awaited<ReturnType<typeof fetchMyNotifications>>

/**
 * Poll + realtime + custom events for unread count and optional toast banner.
 * `channelSuffix` must be unique per mounted instance (e.g. "topbar" vs "artist-profile").
 */
export function useNotificationInboxPreview(userId: string | undefined, channelSuffix: string) {
  const { isLoading: authLoading } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [liveBanner, setLiveBanner] = useState<LiveBannerState | null>(null)
  const latestNotificationIdRef = useRef<string | null>(null)
  const bannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const applyFetchedData = useCallback((data: FetchPayload) => {
    const latest = data.notifications[0]
    const latestId = latest?.user_notification_id ?? null
    if (latestNotificationIdRef.current && latestId && latestNotificationIdRef.current !== latestId) {
      setLiveBanner({
        title: latest.title ?? "Nueva notificación",
        message: latest.message ?? "Tienes una nueva actualización.",
      })
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current)
      bannerTimeoutRef.current = setTimeout(() => setLiveBanner(null), 4000)
    }
    latestNotificationIdRef.current = latestId
    setUnreadCount(data.unreadCount)
  }, [])

  const syncFromServer = useCallback(() => {
    void fetchMyNotifications()
      .then(applyFetchedData)
      .catch(() => {
        /* ignore */
      })
  }, [applyFetchedData])

  useAppForeground(
    useCallback(() => {
      if (!userId || authLoading) return
      syncFromServer()
    }, [userId, authLoading, syncFromServer])
  )

  useEffect(() => {
    if (!userId || authLoading) return
    let alive = true
    async function load() {
      try {
        const data = await fetchMyNotifications()
        if (!alive) return
        applyFetchedData(data)
      } catch {
        // no-op
      }
    }
    void load()
    const t = setInterval(() => void load(), 5000)
    const onFocus = () => void load()
    const onVisible = () => {
      if (document.visibilityState === "visible") void load()
    }
    const onAppNotificationCreated = (event: Event) => {
      const custom = event as CustomEvent
      const parsed = custom.detail?.notification as AppNotification | undefined
      if (parsed) {
        latestNotificationIdRef.current = parsed.user_notification_id
        setLiveBanner({ title: parsed.title, message: parsed.message })
        if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current)
        bannerTimeoutRef.current = setTimeout(() => setLiveBanner(null), 4000)
      }
      void load()
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("app:notification-created", onAppNotificationCreated as EventListener)
    const unsubApi = onApiBaseReady(() => {
      if (!alive) return
      void load()
    })
    const onApiReady = () => {
      if (!alive) return
      void load()
    }
    window.addEventListener("app:api-base-ready", onApiReady)
    return () => {
      alive = false
      unsubApi()
      window.removeEventListener("app:api-base-ready", onApiReady)
      clearInterval(t)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("app:notification-created", onAppNotificationCreated as EventListener)
      if (bannerTimeoutRef.current) clearTimeout(bannerTimeoutRef.current)
    }
  }, [userId, authLoading, applyFetchedData])

  useEffect(() => {
    if (!userId || authLoading) return
    const supabase = getSupabase()
    const channel = supabase
      .channel(`inbox-preview-${channelSuffix}-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void fetchMyNotifications().then(applyFetchedData)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [userId, authLoading, channelSuffix, applyFetchedData])

  return { unreadCount, liveBanner, setLiveBanner }
}
