"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

/**
 * Listens for app open via deep link (e.g. inmaculada://dashboard after Stripe success).
 * Navigates to /dashboard when the app is opened with that URL (Capacitor Android/iOS).
 */
export function DeepLinkHandler() {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === "undefined") return

    const handleUrl = (url: string) => {
      try {
        if (url.startsWith("inmaculada://dashboard") || url.startsWith("inmaculada://dashboard-success")) {
          router.replace("/dashboard?success=true")
        }
      } catch {
        // ignore
      }
    }

    let remove: (() => void) | undefined

    const init = async () => {
      try {
        const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
        if (!cap?.isNativePlatform?.()) return

        const { App } = await import("@capacitor/app")
        const handle = await App.addListener("appUrlOpen", (event: { url: string }) => handleUrl(event.url))
        remove = handle.remove.bind(handle)
        const launch = await App.getLaunchUrl()
        if (launch?.url) handleUrl(launch.url)
      } catch {
        // Capacitor or App plugin not available (e.g. web browser)
      }
    }

    void init()
    return () => {
      remove?.()
    }
  }, [router])

  return null
}
