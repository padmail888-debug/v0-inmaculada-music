"use client"

import { useState } from "react"
import { Bell, Music, Crown, Users, AlertCircle, Check, Trash2, Settings } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"

interface Notification {
  id: string
  type: "music" | "subscription" | "social" | "system"
  title: string
  message: string
  timestamp: string
  read: boolean
  actionUrl?: string
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: "1",
      type: "music",
      title: "Nueva música disponible",
      message: "El artista Juan Pérez ha subido una nueva canción 'Midnight Vibes'",
      timestamp: "Hace 2 horas",
      read: false,
      actionUrl: "/artist/juan-perez",
    },
    {
      id: "2",
      type: "subscription",
      title: "Suscripción renovada",
      message: "Tu suscripción Premium se ha renovado exitosamente por $9.99/mes",
      timestamp: "Hace 1 día",
      read: false,
      actionUrl: "/subscription",
    },
    {
      id: "3",
      type: "social",
      title: "Nuevo seguidor",
      message: "María García ahora te sigue y le gusta tu playlist 'Chill Vibes'",
      timestamp: "Hace 2 días",
      read: true,
      actionUrl: "/profile",
    },
    {
      id: "4",
      type: "system",
      title: "Actualización disponible",
      message: "Nueva versión de la app con mejoras en el reproductor offline",
      timestamp: "Hace 3 días",
      read: true,
    },
    {
      id: "5",
      type: "music",
      title: "Playlist recomendada",
      message: "Descubre 'Electronic Dreams' - Una playlist perfecta para tu estilo musical",
      timestamp: "Hace 1 semana",
      read: false,
      actionUrl: "/playlists/electronic-dreams",
    },
  ])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "music":
        return <Music className="h-4 w-4 text-purple-400" />
      case "subscription":
        return <Crown className="h-4 w-4 text-yellow-400" />
      case "social":
        return <Users className="h-4 w-4 text-blue-400" />
      case "system":
        return <Settings className="h-4 w-4 text-green-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const markAsRead = (id: string) => {
    setNotifications((prev) => prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif)))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((notif) => ({ ...notif, read: true })))
  }

  const deleteNotification = (id: string) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <Card className="w-80 bg-slate-800 border-slate-700 shadow-xl">
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
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-slate-400 hover:text-white h-7"
              >
                <Check className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllNotifications}
              className="text-xs text-slate-400 hover:text-red-400 h-7"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpiar todo
            </Button>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-96">
          {notifications.length > 0 ? (
            <div className="space-y-1 p-4">
              {notifications.map((notification, index) => (
                <div key={notification.id}>
                  <div
                    className={`p-3 rounded-lg cursor-pointer transition-colors group ${
                      notification.read
                        ? "bg-slate-700/30 hover:bg-slate-700/50"
                        : "bg-slate-700/60 hover:bg-slate-700/80"
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {getNotificationIcon(notification.type)}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${notification.read ? "text-gray-300" : "text-white"}`}>
                          {notification.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{notification.message}</p>
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs text-gray-500">{notification.timestamp}</p>
                          {notification.actionUrl && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-purple-400 hover:text-purple-300 h-6 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Ver más
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        {!notification.read && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteNotification(notification.id)
                          }}
                          className="h-6 w-6 p-0 text-slate-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  {index < notifications.length - 1 && <Separator className="bg-slate-700/50 my-1" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4">
              <Bell className="h-12 w-12 text-slate-600 mb-4" />
              <p className="text-slate-400 text-sm text-center">No tienes notificaciones</p>
              <p className="text-slate-500 text-xs text-center mt-1">Te avisaremos cuando haya algo nuevo</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
