"use client"

import { useEffect } from "react"
import { isNativeAppShell } from "@/lib/api-base"

/**
 * Android/iOS WebViews often report env(safe-area-inset-top) as 0 while drawing
 * edge-to-edge under the status bar. Sets a CSS fallback and disables status-bar overlay.
 */
export function NativeSafeArea() {
  useEffect(() => {
    if (!isNativeAppShell()) return

    const root = document.documentElement
    root.classList.add("native-app")

    void (async () => {
      try {
        const { StatusBar } = await import("@capacitor/status-bar")
        await StatusBar.setOverlaysWebView({ overlay: false })
      } catch {
        // CSS fallback (--app-safe-area-top) still applies
      }
    })()

    return () => root.classList.remove("native-app")
  }, [])

  return null
}
