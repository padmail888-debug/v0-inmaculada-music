"use client"

import { useCallback, useEffect, useState } from "react"
import { Bell, Music, Crown, Users, AlertCircle, Check, Settings, ShieldAlert, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAppForeground } from "@/hooks/use-app-foreground"
import { fetchMyNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/notification-client"
import { getSupabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import type { AppNotification } from "@/lib/notifications"
import { NotificationInboxItem } from "@/components/notifications/notification-inbox-item"

type NotificationsInboxProps = {
  channelSuffix?: string
}

export function NotificationsInbox({ channelSuffix = "page" }: NotificationsInboxProps) {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [serverTotalCount, setServerTotalCount] = useState(0)

  useEffect(() => {
    if (authLoading) return
    if (!user?.id) {
      router.replace("/login")
      setNotifications([])
      setServerTotalCount(0)
      setIsLoading(false)
      return
    }
    setIsLoading(true)
  }, [authLoading, user?.id, router])

  const loadNotifications = useCallback(async (aliveRef?: { current: boolean }) => {
    const data = await fetchMyNotifications()
    if (aliveRef && !aliveRef.current) return
    setNotifications(data.notifications)
    setServerTotalCount(data.totalCount ?? data.notifications.length)
  }, [])

  useEffect(() => {
    if (authLoading || !user?.id) return
    const aliveRef = { current: true }
    async function load() {
      try {
        await loadNotifications(aliveRef)
      } finally {
        if (aliveRef.current) setIsLoading(false)
      }
    }
    void load()
    return () => {
      aliveRef.current = false
    }
  }, [authLoading, user?.id, loadNotifications])

  useEffect(() => {
    if (authLoading || !user?.id) return
    const t = setInterval(() => {
      void loadNotifications()
    }, 5000)
    const onFocus = () => void loadNotifications()
    const onVisible = () => {
      if (document.visibilityState === "visible") void loadNotifications()
    }
    const onAppNotificationCreated = (event: Event) => {
      const custom = event as CustomEvent
      const parsed = custom.detail?.notification as AppNotification | undefined
      if (parsed) {
        setNotifications((prev) => {
          if (prev.some((n) => n.user_notification_id === parsed.user_notification_id)) return prev
          return [parsed, ...prev]
        })
      }
      void loadNotifications()
    }
    window.addEventListener("focus", onFocus)
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("app:notification-created", onAppNotificationCreated as EventListener)
    return () => {
      clearInterval(t)
      window.removeEventListener("focus", onFocus)
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("app:notification-created", onAppNotificationCreated as EventListener)
    }
  }, [authLoading, user?.id, loadNotifications])

  useEffect(() => {
    if (!user?.id) return
    const supabase = getSupabase()
    const channel = supabase
      .channel(`page-user-notifications-${channelSuffix}-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_notifications",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadNotifications()
        },
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, loadNotifications, channelSuffix])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_song_release":
      case "new_album_release":
        return <Music className="h-4 w-4 text-purple-400" />
      case "payment_success":
      case "payment_failed":
        return <Crown className="h-4 w-4 text-yellow-400" />
      case "new_follower":
      case "song_liked":
        return <Users className="h-4 w-4 text-blue-400" />
      case "security_alert":
        return <ShieldAlert className="h-4 w-4 text-red-400" />
      case "account":
        return <Settings className="h-4 w-4 text-green-400" />
      case "artist_pro_feature_used":
      case "admin_alert":
        return <CreditCard className="h-4 w-4 text-orange-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const markAsRead = async (userNotificationId: string) => {
    try {
      await markNotificationRead(userNotificationId)
      await loadNotifications()
    } catch (e) {
      console.error("Failed to mark notification read:", e)
    }
  }

  const markAllAsRead = async () => {
    try {
      await markAllNotificationsRead()
      await loadNotifications()
    } catch (e) {
      console.error("Failed to mark all notifications read:", e)
    }
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useAppForeground(
    useCallback(() => {
      if (authLoading || !user?.id) return
      void loadNotifications()
    }, [authLoading, user?.id, loadNotifications]),
  )

  return (
    <div className="mx-auto max-w-4xl min-w-0">
      <h1 className="mb-4 min-w-0 truncate text-2xl font-bold text-white sm:mb-6 sm:text-3xl">
        Centro de Notificaciones
      </h1>

      <Card className="bg-slate-800/30 border-slate-700 shadow-xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Notificaciones
              {unreadCount > 0 && <Badge className="ml-2 bg-red-500 text-white text-xs">{unreadCount}</Badge>}
            </CardTitle>
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2 mt-2">
              <p className="text-xs text-slate-400 self-center">
                Mostrando {notifications.length} de {serverTotalCount}
              </p>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="h-auto min-h-11 touch-manipulation py-2 text-left text-xs text-slate-400 hover:text-white sm:min-h-9"
                >
                  <Check className="mr-1 inline h-3 w-3" />
                  Marcar todas como leídas
                </Button>
              )}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                <p className="text-slate-400 text-sm text-center">Cargando notificaciones...</p>
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-1 p-4">
                {notifications.map((notification, index) => (
                  <NotificationInboxItem
                    key={notification.user_notification_id}
                    notification={notification}
                    icon={getNotificationIcon(notification.type)}
                    showSeparator={index < notifications.length - 1}
                    onMarkRead={(id) => void markAsRead(id)}
                    onOpenDeepLink={(path) => router.push(path)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 px-4">
                <Bell className="h-12 w-12 text-slate-600 mb-4" />
                <p className="text-slate-400 text-sm text-center">No tienes notificaciones</p>
                <p className="text-slate-500 text-xs text-center mt-1">Te avisaremos cuando haya algo nuevo</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
