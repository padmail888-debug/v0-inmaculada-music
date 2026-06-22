"use client"

export const revalidate = 0


import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { NotificationsInbox } from "@/components/notifications/notifications-inbox"

export default function NotificationsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!user) return
    if (user.role === "artist" || user.role === "artist-pro") {
      router.replace("/artist/notifications")
    }
  }, [user, authLoading, router])

  return (
    <AppShell>
      <NotificationsInbox channelSuffix="listener" />
    </AppShell>
  )
}
