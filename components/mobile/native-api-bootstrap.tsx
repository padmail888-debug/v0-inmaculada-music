"use client"

import { useEffect } from "react"
import { shouldUseRemoteApiBase } from "@/lib/api-base"
import { resolveNativeApiBase } from "@/lib/native-api-resolver"

/**
 * On Capacitor startup, probes LAN / emulator / adb-reverse hosts so notifications
 * and /api/* work without manually running `adb reverse`.
 */
export function NativeApiBootstrap() {
  useEffect(() => {
    if (!shouldUseRemoteApiBase()) return

    let cancelled = false

    void resolveNativeApiBase()

    return () => {
      cancelled = true
    }
  }, [])

  return null
}
