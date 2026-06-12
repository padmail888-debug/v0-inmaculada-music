"use client"

import { useEffect, useRef } from "react"

/**
 * Runs when the user returns to the app: visibility, bfcache restore, and Capacitor resume.
 * Use to refetch notifications and other session-sensitive data on mobile.
 */
export function useAppForeground(onForeground: () => void) {
  const cbRef = useRef(onForeground)
  cbRef.current = onForeground

  useEffect(() => {
    const invoke = () => cbRef.current()

    const onVisibility = () => {
      if (document.visibilityState === "visible") invoke()
    }

    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) invoke()
    }

    document.addEventListener("visibilitychange", onVisibility)
    window.addEventListener("pageshow", onPageShow as EventListener)

    let removeCap: (() => void) | undefined

    void (async () => {
      try {
        if (typeof window === "undefined") return
        const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
        if (!cap?.isNativePlatform?.()) return
        const { App } = await import("@capacitor/app")
        const handle = await App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) invoke()
        })
        removeCap = () => {
          void handle.remove()
        }
      } catch {
        // not in Capacitor
      }
    })()

    return () => {
      document.removeEventListener("visibilitychange", onVisibility)
      window.removeEventListener("pageshow", onPageShow as EventListener)
      removeCap?.()
    }
  }, [])
}
