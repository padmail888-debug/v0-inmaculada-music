"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { ArtistShell } from "@/components/layout/artist-shell"
import { NotificationsInbox } from "@/components/notifications/notifications-inbox"

export default function ArtistNotificationsPage() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login")
      return
    }
    if (user.role !== "artist" && user.role !== "artist-pro" && user.role !== "superadmin") {
      router.replace("/notifications")
    }
  }, [user, authLoading, router])

  return (
    <ArtistShell>
      <NotificationsInbox channelSuffix="artist" />
    </ArtistShell>
  )
}
