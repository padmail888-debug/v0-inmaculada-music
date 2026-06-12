"use client"

import type React from "react"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase/client"
import { nativeCrossOriginFetchInit, resolveApiUrl } from "@/lib/api-base"
import type { User, UserRole } from "@/lib/auth-types"
import {
  mapSupabaseRoleToUserRole,
  pickBestUserRole,
  roleFromAccessToken,
} from "@/lib/user-role"

export type { User, UserRole } from "@/lib/auth-types"

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => void
  isLoading: boolean
  refreshUserFromSupabase: () => Promise<User | null>
  /** Set current user's role only (e.g. after subscription success so UI updates immediately). */
  setUserRole: (role: UserRole) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshUserFromSupabase = useCallback(async (): Promise<User | null> => {
    try {
      const supabase = getSupabase()
      const { data: initialSession } = await supabase.auth.getSession()
      if (!initialSession?.session?.access_token) return null
      // Get current session first and sync role from server (source of truth) before any refresh
      let serverRole: string | undefined
      const accessToken = initialSession.session.access_token
      if (accessToken) {
        try {
          const url = resolveApiUrl("/api/auth/sync-role")
          if (!url) {
            if (typeof window !== "undefined") {
              console.warn("[auth] sync-role skipped: invalid NEXT_PUBLIC_APP_URL on native")
            }
          } else {
            const res = await fetch(url, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken }),
              ...nativeCrossOriginFetchInit,
            })
            const text = await res.text()
            let json: { role?: string } | null = null
            try {
              json = text ? (JSON.parse(text) as { role?: string }) : null
            } catch {
              /* ignore */
            }
            if (json && typeof json.role === "string") {
              serverRole = json.role
            }
            if (typeof window !== "undefined") {
              console.log("[auth] sync-role response:", res.status, json ?? text)
            }
          }
        } catch (e) {
          if (typeof window !== "undefined") console.warn("[auth] sync-role failed:", e)
        }
      }

      let supaUser: { id: string; email?: string; user_metadata?: object; app_metadata?: object; role?: string } | null = null
      try {
        const { data } = await supabase.auth.refreshSession()
        supaUser = data?.user ?? null
      } catch {
        /* refresh failed; use current session */
      }
      if (!supaUser) {
        const { data } = await supabase.auth.getUser()
        supaUser = data?.user ?? null
      }
      if (!supaUser) return null

      const meta = (supaUser.user_metadata ?? {}) as Record<string, unknown>
      const appMeta = (supaUser.app_metadata ?? {}) as Record<string, unknown>

      let storedRole: string | undefined
      if (typeof localStorage !== "undefined") {
        try {
          const stored = localStorage.getItem("user")
          if (stored) storedRole = (JSON.parse(stored) as User).role
        } catch {
          /* ignore */
        }
      }

      const jwtRole = roleFromAccessToken(accessToken)
      let role = pickBestUserRole(
        serverRole,
        appMeta.role as string | undefined,
        meta.role as string | undefined,
        supaUser.role,
        jwtRole ?? undefined,
        storedRole,
      )

      let subscription: User["subscription"] = null

      if (role === "free" && accessToken) {
        try {
          const subUrl = resolveApiUrl("/api/auth/subscription-status")
          if (subUrl) {
            const subRes = await fetch(subUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accessToken }),
              ...nativeCrossOriginFetchInit,
            })
            if (subRes.ok) {
              const subJson = (await subRes.json()) as {
                active?: boolean
                plan?: string
                role?: string
                status?: string
                currentPeriodEnd?: string | null
              }
              if (subJson.active && subJson.plan) {
                role = pickBestUserRole(subJson.role, subJson.plan, role)
                subscription = {
                  plan: subJson.plan,
                  status: "active",
                  expiresAt: subJson.currentPeriodEnd ?? "",
                }
              }
            }
          }
        } catch (e) {
          if (typeof window !== "undefined") console.warn("[auth] subscription-status failed:", e)
        }
      }

      if (typeof window !== "undefined") {
        console.log("[auth] role update:", { serverRole, jwtRole, storedRole, mappedRole: role, subscription })
      }
      const name =
        (meta.name as string | undefined) ??
        (meta.full_name as string | undefined) ??
        supaUser.email?.split("@")[0] ??
        ""
      const updated: User = {
        id: supaUser.id,
        email: supaUser.email ?? "",
        name,
        role,
        avatar: (meta.avatar as string) ?? undefined,
        subscription,
      }
      const { data: stillSignedIn } = await supabase.auth.getSession()
      if (!stillSignedIn?.session?.access_token) return null

      setUser(updated)
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("user", JSON.stringify(updated))
      }
      return updated
    } catch {
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const storedUser =
          typeof window !== "undefined" ? localStorage.getItem("user") : null
        if (storedUser && !cancelled) {
          try {
            const parsed = JSON.parse(storedUser) as User
            if (parsed?.id && typeof parsed.role === "string") {
              if (
                typeof window !== "undefined" &&
                new URLSearchParams(window.location.search).get("success") === "true"
              ) {
                const plan = new URLSearchParams(window.location.search).get("plan")
                parsed.role = plan === "artist-pro" ? "artist-pro" : "premium"
              } else {
                parsed.role = mapSupabaseRoleToUserRole(parsed.role)
              }
              try {
                localStorage.setItem("user", JSON.stringify(parsed))
              } catch {
                /* ignore */
              }
              setUser(parsed)
            }
          } catch {
            try {
              localStorage.removeItem("user")
            } catch {
              /* ignore */
            }
          }
        }
        // Sync role from server when app loads (e.g. after re-login or refresh) so Artist Pro / Premium are correct
        if (!cancelled) {
          const supabase = getSupabase()
          const { data } = await supabase.auth.getSession()
          if (data?.session?.access_token) {
            await refreshUserFromSupabase()
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    init()
    return () => {
      cancelled = true
    }
  }, [refreshUserFromSupabase])

  // Safety: never leave loading true forever (e.g. if effect never runs or state gets stuck)
  useEffect(() => {
    const t = setTimeout(() => {
      setIsLoading((prev) => (prev ? false : prev))
    }, 1500)
    return () => clearTimeout(t)
  }, [])

  const login = (userData: User) => {
    setUser(userData)
    localStorage.setItem("user", JSON.stringify(userData))
  }

  const setUserRole = useCallback((role: UserRole) => {
    setUser((prev) => {
      if (!prev) return prev
      const updated = { ...prev, role }
      if (typeof localStorage !== "undefined") {
        localStorage.setItem("user", JSON.stringify(updated))
      }
      return updated
    })
  }, [])

  const logout = () => {
    // Best-effort sign out from Supabase; ignore errors for now
    try {
      const supabase = getSupabase()
      void supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out from Supabase:", error)
    }

    setUser(null)
    localStorage.removeItem("user")
    if (typeof sessionStorage !== "undefined") {
      try {
        sessionStorage.removeItem("pending_notification")
      } catch {
        /* ignore */
      }
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, refreshUserFromSupabase, setUserRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
