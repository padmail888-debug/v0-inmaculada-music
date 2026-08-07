"use client"

import { useEffect, useState } from "react"
import { resolveApiUrl, shouldUseRemoteApiBase } from "@/lib/api-base"
import { resolveNativeApiBase } from "@/lib/native-api-resolver"

/** Shown when the app must call a remote Next API but no reachable host was found after auto-discovery. */
export function NativeApiMisconfigBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!shouldUseRemoteApiBase()) return
    let cancelled = false
    void resolveNativeApiBase().then((base) => {
      if (cancelled) return
      if (!base && !resolveApiUrl("/api/notifications")) setShow(true)
    })
    return () => {
      cancelled = true
    }
  }, [])

  if (!show) return null

  return (
    <div
      role="alert"
      className="fixed bottom-0 left-0 right-0 z-[100] bg-amber-600 px-4 py-3 text-center text-sm font-medium text-amber-950 shadow-lg"
    >
      La app nativa no encuentra el servidor API. Local: ejecuta{" "}
      <code className="rounded bg-amber-800/30 px-1">npm run dev:lan</code> en tu PC y{" "}
      <code className="rounded bg-amber-800/30 px-1">npm run cap:build:android:dev</code>. Producción:
      verifica <code className="rounded bg-amber-800/30 px-1">NEXT_PUBLIC_APP_URL</code> y ejecuta{" "}
      <code className="rounded bg-amber-800/30 px-1">npm run cap:build:android:prod</code>.
    </div>
  )
}
