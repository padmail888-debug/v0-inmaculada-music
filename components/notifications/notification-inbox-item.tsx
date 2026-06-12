"use client"

import { useCallback, useLayoutEffect, useRef, useState, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { AppNotification } from "@/lib/notifications"

/** Login success rows must not offer navigation (even legacy rows that still have /profile). */
export function shouldOfferDeepLink(n: AppNotification): boolean {
  if (!n.deep_link?.trim()) return false
  if (n.type === "account") {
    const ev =
      n.metadata && typeof n.metadata === "object" && "event" in n.metadata
        ? String((n.metadata as { event?: unknown }).event)
        : ""
    if (ev === "login") return false
  }
  return true
}

export function NotificationInboxItem({
  notification,
  icon,
  showSeparator,
  onMarkRead,
  onOpenDeepLink,
}: {
  notification: AppNotification
  icon: ReactNode
  showSeparator: boolean
  onMarkRead: (userNotificationId: string) => void
  onOpenDeepLink: (path: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [overflowDetected, setOverflowDetected] = useState(false)
  const titleRef = useRef<HTMLParagraphElement>(null)
  const messageRef = useRef<HTMLParagraphElement>(null)
  const measureRootRef = useRef<HTMLDivElement>(null)

  const measureOverflow = useCallback(() => {
    if (expanded) return
    const t = titleRef.current
    const m = messageRef.current
    if (t) t.classList.toggle("line-clamp-2", true)
    if (m) m.classList.toggle("line-clamp-3", true)
    let need = false
    if (t) need = need || t.scrollHeight > t.clientHeight + 1
    if (m) need = need || m.scrollHeight > m.clientHeight + 1
    setOverflowDetected(need)
  }, [expanded, notification.title, notification.message])

  useLayoutEffect(() => {
    const t = titleRef.current
    const m = messageRef.current
    if (t) t.classList.toggle("line-clamp-2", !expanded)
    if (m) m.classList.toggle("line-clamp-3", !expanded)

    if (expanded) return

    const id = requestAnimationFrame(measureOverflow)
    return () => cancelAnimationFrame(id)
  }, [notification.title, notification.message, expanded, measureOverflow])

  useLayoutEffect(() => {
    const root = measureRootRef.current
    if (!root || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(() => {
      if (!expanded) requestAnimationFrame(measureOverflow)
    })
    ro.observe(root)
    return () => ro.disconnect()
  }, [expanded, measureOverflow])

  const openLink = shouldOfferDeepLink(notification)
  const showActions = overflowDetected || openLink

  return (
    <div>
      <div
        className={`overflow-hidden rounded-lg transition-colors ${
          notification.is_read ? "bg-slate-700/30" : "bg-slate-700/60"
        }`}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={() => onMarkRead(notification.user_notification_id)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              onMarkRead(notification.user_notification_id)
            }
          }}
          className={`cursor-pointer p-3 outline-none ring-offset-slate-900 focus-visible:ring-2 focus-visible:ring-purple-500 active:bg-slate-700/90 ${
            notification.is_read ? "hover:bg-slate-700/50" : "hover:bg-slate-700/80"
          }`}
        >
          <div className="flex items-start space-x-3">
            {icon}
            <div ref={measureRootRef} className="min-w-0 flex-1">
              <p
                ref={titleRef}
                className={`text-sm font-medium break-words ${notification.is_read ? "text-gray-300" : "text-white"}`}
              >
                {notification.title}
              </p>
              <p ref={messageRef} className="mt-1 break-words text-xs leading-relaxed text-gray-400">
                {notification.message}
              </p>
              <p className="mt-2 text-xs text-gray-500">
                {new Date(notification.created_at).toLocaleString("es-ES", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </p>
            </div>
            <div className="flex flex-col items-center gap-1 pt-0.5">
              {!notification.is_read && <div className="h-2 w-2 shrink-0 rounded-full bg-red-500" />}
            </div>
          </div>
        </div>
        {showActions && (
          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-600/40 px-2 py-2 sm:px-3">
            {overflowDetected && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 touch-manipulation px-3 text-xs text-purple-400 hover:text-purple-300 sm:min-h-9"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Ver menos" : "Ver más"}
              </Button>
            )}
            {openLink && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="min-h-11 touch-manipulation px-3 text-xs text-purple-400 hover:text-purple-300 sm:min-h-9"
                onClick={() => {
                  onMarkRead(notification.user_notification_id)
                  if (notification.deep_link) onOpenDeepLink(notification.deep_link)
                }}
              >
                Abrir
              </Button>
            )}
          </div>
        )}
      </div>
      {showSeparator && <Separator className="my-1 bg-slate-700/50" />}
    </div>
  )
}
