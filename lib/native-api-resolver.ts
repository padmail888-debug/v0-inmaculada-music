"use client"

import { Capacitor } from "@capacitor/core"

const nativeCrossOriginFetchInit = {
  mode: "cors" as const,
  credentials: "omit" as const,
}

function isNativeShell(): boolean {
  if (typeof window === "undefined") return false
  try {
    if (Capacitor.isNativePlatform()) return true
  } catch {
    /* ignore */
  }
  const host = window.location.hostname.toLowerCase()
  return host === "localhost" || host === "127.0.0.1"
}

const STORAGE_KEY = "inmaculada_resolved_api_base"
const API_READY_EVENT = "app:api-base-ready"

let memoryCache: string | null = null
let probePromise: Promise<string | null> | null = null

type NativeApiConfigFile = {
  lanApiBase?: string | null
}

function normalizeBase(url: string): string {
  return url.trim().replace(/\/$/, "")
}

function isValidHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url)
}

export function getCachedResolvedApiBase(): string | null {
  if (memoryCache && isValidHttpUrl(memoryCache)) return memoryCache
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && isValidHttpUrl(stored)) {
      memoryCache = normalizeBase(stored)
      return memoryCache
    }
  } catch {
    /* ignore */
  }
  return null
}

export function clearResolvedApiBase(): void {
  memoryCache = null
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }
}

export function setResolvedApiBase(base: string): void {
  const normalized = normalizeBase(base)
  if (!isValidHttpUrl(normalized)) return
  memoryCache = normalized
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORAGE_KEY, normalized)
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new CustomEvent(API_READY_EVENT, { detail: { apiBase: normalized } }))
  }
}

export function onApiBaseReady(listener: (apiBase: string) => void): () => void {
  if (typeof window === "undefined") return () => {}
  const cached = getCachedResolvedApiBase()
  if (cached) listener(cached)
  const handler = (event: Event) => {
    const base = (event as CustomEvent<{ apiBase?: string }>).detail?.apiBase
    if (base && isValidHttpUrl(base)) listener(normalizeBase(base))
  }
  window.addEventListener(API_READY_EVENT, handler as EventListener)
  return () => window.removeEventListener(API_READY_EVENT, handler as EventListener)
}

async function loadNativeApiConfig(): Promise<NativeApiConfigFile | null> {
  if (typeof window === "undefined") return null
  try {
    const res = await fetch("/native-api-config.json", { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as NativeApiConfigFile
  } catch {
    return null
  }
}

function bakedEnvBase(): string | null {
  const raw = (process.env.NEXT_PUBLIC_APP_URL || "").trim()
  return raw && isValidHttpUrl(raw) ? normalizeBase(raw) : null
}

const DEV_PORTS = ["3000", "3001", "3002"]

function withAlternatePorts(bases: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  const add = (url: string) => {
    if (!isValidHttpUrl(url)) return
    const n = normalizeBase(url)
    if (seen.has(n)) return
    seen.add(n)
    out.push(n)
  }
  for (const base of bases) {
    add(base)
    try {
      const u = new URL(base)
      for (const port of DEV_PORTS) {
        if (u.port !== port) {
          add(`${u.protocol}//${u.hostname}:${port}`)
        }
      }
    } catch {
      /* keep base only */
    }
  }
  return out
}

function loopbackAlternatives(base: string): string[] {
  try {
    const u = new URL(base)
    const host = u.hostname.toLowerCase()
    if (host !== "localhost" && host !== "127.0.0.1") return []
    const out: string[] = []
    for (const port of DEV_PORTS) {
      if (Capacitor.getPlatform() === "android") {
        out.push(`http://10.0.2.2:${port}`)
      }
      out.push(`http://127.0.0.1:${port}`)
      out.push(`http://localhost:${port}`)
    }
    return out
  } catch {
    return []
  }
}

async function buildCandidateBases(): Promise<string[]> {
  const seen = new Set<string>()
  const add = (url: string | null | undefined) => {
    if (!url || !isValidHttpUrl(url)) return
    const n = normalizeBase(url)
    if (!seen.has(n)) {
      seen.add(n)
      ordered.push(n)
    }
  }

  const ordered: string[] = []

  const baked = bakedEnvBase()
  // Prefer adb-reverse / emulator loopback before stale LAN cache
  if (baked) {
    add(baked)
    for (const alt of loopbackAlternatives(baked)) add(alt)
  }

  const config = await loadNativeApiConfig()
  add(config?.lanApiBase ?? null)

  add(getCachedResolvedApiBase())

  return withAlternatePorts(ordered)
}

async function probeHealth(base: string, timeoutMs = 3500): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${base}/api/health`, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
      ...nativeCrossOriginFetchInit,
    })
    if (!res.ok) return false
    const json = (await res.json().catch(() => null)) as { ok?: boolean } | null
    return json?.ok === true
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}

/**
 * On native, find a reachable Next.js API host (LAN IP, emulator 10.0.2.2, or adb reverse localhost).
 * Result is cached in memory + localStorage for subsequent API calls.
 */
export async function resolveNativeApiBase(): Promise<string | null> {
  if (!isNativeShell()) return null

  const cached = getCachedResolvedApiBase()
  if (cached) {
    const stillOk = await probeHealth(cached, 2000)
    if (stillOk) return cached
    memoryCache = null
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        /* ignore */
      }
    }
  }

  if (probePromise) return probePromise

  probePromise = (async () => {
    const candidates = await buildCandidateBases()
    if (candidates.length === 0) return null

    // Try loopback hosts first (adb reverse / emulator), then LAN — stops a dead LAN cache from blocking USB dev
    const priority = (base: string) => {
      try {
        const h = new URL(base).hostname.toLowerCase()
        if (h === "localhost" || h === "127.0.0.1" || h === "10.0.2.2") return 0
        return 1
      } catch {
        return 2
      }
    }
    const sorted = [...candidates].sort((a, b) => priority(a) - priority(b))

    let winner: { base: string; ok: boolean } | undefined
    for (const base of sorted) {
      if (await probeHealth(base)) {
        winner = { base, ok: true }
        break
      }
    }
    if (winner) {
      setResolvedApiBase(winner.base)
      if (typeof console !== "undefined") {
        console.log("[api] Native API base resolved:", winner.base)
      }
      return winner.base
    }

    if (typeof console !== "undefined") {
      console.warn(
        "[api] Could not reach Next.js API. Tried:",
        candidates.join(", "),
        "— run npm run dev:lan on your PC and rebuild, or use production NEXT_PUBLIC_APP_URL.",
      )
    }
    return null
  })().finally(() => {
    probePromise = null
  })

  return probePromise
}
