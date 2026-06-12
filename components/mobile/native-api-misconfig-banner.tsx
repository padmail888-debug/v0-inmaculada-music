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
      La app nativa necesita NEXT_PUBLIC_APP_URL (URL del servidor donde corre Next.js con /api). Añádela en
      .env.local, ejecuta <code className="rounded bg-amber-800/30 px-1">npm run build</code>,{" "}
      <code className="rounded bg-amber-800/30 px-1">npx cap sync android</code>, y vuelve a instalar el APK.
    </div>
  )
}
