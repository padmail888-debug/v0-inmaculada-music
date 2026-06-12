import { Capacitor } from "@capacitor/core"
import { getCachedResolvedApiBase } from "@/lib/native-api-resolver"

/**
 * True when the bundle runs inside Capacitor iOS/Android. Prefer `@capacitor/core`
 * and native bridge probes — `window.Capacitor` can be missing briefly on startup.
 */
function isCapacitorNativeRuntime(): boolean {
  if (typeof window === "undefined") return false
  const w = window as Window &
    Partial<{ androidBridge: unknown; webkit?: { messageHandlers?: Record<string, unknown> } }>
  if (w.androidBridge != null) return true
  if (w.webkit?.messageHandlers?.bridge != null) return true
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * Static export in the APK is served from http(s)://localhost (Capacitor). Relative `/api`
 * would hit the WebView only. When NEXT_PUBLIC_APP_URL is set, use the remote Next server.
 */
function isCapacitorLocalhostShell(): boolean {
  if (typeof window === "undefined") return false
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "").trim()
  if (!/^https?:\/\//i.test(raw)) return false
  const host = window.location.hostname.toLowerCase()
  return host === "localhost" || host === "127.0.0.1"
}

/** Use remote API base instead of relative /api paths. */
export function shouldUseRemoteApiBase(): boolean {
  return isCapacitorNativeRuntime() || isCapacitorLocalhostShell()
}

/** Capacitor APK/WebView shell (not mobile Safari in the browser). */
export function isNativeAppShell(): boolean {
  return shouldUseRemoteApiBase()
}

/**
 * Prefer `@capacitor-firebase/messaging` (Android/iOS) instead of the Web FCM SDK.
 * Matches APK WebView shells when `window.Capacitor` is flaky.
 */
export function shouldUseCapacitorNativePush(): boolean {
  if (typeof window === "undefined") return false
  if (isCapacitorNativeRuntime()) return true
  return isCapacitorLocalhostShell()
}

/**
 * Base URL for API requests. In Capacitor/native app there is no Next.js server
 * bundled in the APK, so callers must reach a running backend (e.g. `next dev`,
 * `next start`, or a deployed host).
 */
export function getApiBase(): string {
  if (typeof window === "undefined") return ""
  if (!shouldUseRemoteApiBase()) return ""
  const cached = getCachedResolvedApiBase()
  if (cached) return cached
  const url = process.env.NEXT_PUBLIC_APP_URL || ""
  return url.replace(/\/$/, "")
}

let warnedMissingNativeBackend = false

/** Full URL for a path beginning with "/" (native) or relative path string (browser). Null = misconfigured native app. */
export function resolveApiUrl(pathStartingWithSlash: string): string | null {
  if (typeof window === "undefined") return pathStartingWithSlash

  const isRemote = shouldUseRemoteApiBase()
  if (!isRemote) {
    return pathStartingWithSlash.startsWith("/") ? pathStartingWithSlash : null
  }

  const base = getApiBase()
  if (!base || !/^https?:\/\//i.test(base)) {
    if (!warnedMissingNativeBackend) {
      warnedMissingNativeBackend = true
      const raw = (process.env.NEXT_PUBLIC_APP_URL || "").trim()
      console.error(
        "[api] Android/iOS builds need a reachable API URL (set NEXT_PUBLIC_APP_URL at build, or let auto-discovery find dev:lan).",
        "Current:",
        raw || "(empty)",
        "\nNotifications, Stripe checkout, sync-role API and push registration will fail until this is fixed.",
      )
    }
    return null
  }
  const path = pathStartingWithSlash.startsWith("/") ? pathStartingWithSlash : `/${pathStartingWithSlash}`
  return `${base}${path}`
}

/** fetch() defaults for cross-origin Capacitor → Next API (Bearer auth does not require cookies). */
export const nativeCrossOriginFetchInit = {
  mode: "cors" as const,
  credentials: "omit" as const,
}

/**
 * Explain common Android dev mistakes when `/api/*` fetch throws (e.g. TypeError: Failed to fetch).
 * `localhost` in NEXT_PUBLIC_APP_URL points at the phone/emulator itself, not your PC.
 */
export function getNativeBackendFetchFailureHint(): string {
  if (typeof window === "undefined") return ""
  if (!shouldUseRemoteApiBase()) return ""
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "").trim()
  if (!raw) {
    return "Set NEXT_PUBLIC_APP_URL at build time, then npm run build && npx cap sync android."
  }
  try {
    const u = new URL(raw)
    const host = u.hostname.toLowerCase()
    const protocol = u.protocol.toLowerCase()
    const port = u.port ? parseInt(u.port, 10) : protocol === "https:" ? 443 : 80
    const loopback =
      host === "localhost" || host === "127.0.0.1" || host === "::1" || host === "[::1]"

    const shellHttpsApiHttp =
      typeof window !== "undefined" &&
      window.location.protocol === "https:" &&
      protocol === "http:"

    if (protocol === "http:" && Number.isFinite(port)) {
      if (shellHttpsApiHttp) {
        return (
          "WebView is https://localhost but API is HTTP — blocked as mixed content. " +
          "Run npm run build && npx cap sync android (capacitor.config uses server.androidScheme http), reinstall the app."
        )
      }
      if (loopback) {
        return (
          "Could not reach the API. On the same Wi‑Fi run: npm run dev:lan, then npm run cap:build:android:dev " +
          "and reinstall. Emulator: use Android emulator (10.0.2.2). USB fallback: npm run adb:reverse."
        )
      }
      return (
        "HTTP to a non-loopback host: ensure npm run dev:lan (listen on LAN), PC firewall allows the port, " +
        `and NEXT_PUBLIC_APP_URL matches (e.g. http://YOUR_PC_IP:${port}).`
      )
    }

    return "If using HTTPS locally, mismatch or cert trust can cause Failed to fetch; try HTTP + dev:lan for native testing."
  } catch {
    return "NEXT_PUBLIC_APP_URL is not a valid URL."
  }
}
