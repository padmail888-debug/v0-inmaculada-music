"use client"

import type React from "react"

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
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

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null
  try {
    const stored = localStorage.getItem("user")
    if (!stored) return null
    const parsed = JSON.parse(stored) as User
    if (!parsed?.id || typeof parsed.role !== "string") return null
    if (new URLSearchParams(window.location.search).get("success") === "true") {
      const plan = new URLSearchParams(window.location.search).get("plan")
      parsed.role = plan === "artist-pro" ? "artist-pro" : "premium"
    } else {
      parsed.role = mapSupabaseRoleToUserRole(parsed.role)
    }
    return parsed
  } catch {
    try {
      localStorage.removeItem("user")
    } catch {
      /* ignore */
    }
    return null
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshInFlight = useRef<Promise<User | null> | null>(null)

  const refreshUserFromSupabase = useCallback(async (): Promise<User | null> => {
    if (refreshInFlight.current) {
      return refreshInFlight.current
    }

    const task = (async (): Promise<User | null> => {
      try {
        const supabase = getSupabase()
        const { data: initialSession } = await supabase.auth.getSession()
        if (!initialSession?.session?.access_token) return null

        let accessToken = initialSession.session.access_token
        const expiresAt = initialSession.session.expires_at
        const now = Math.floor(Date.now() / 1000)
        const shouldRefresh = !expiresAt || expiresAt - now < 120

        if (shouldRefresh) {
          try {
            const { data } = await supabase.auth.refreshSession()
            if (data?.session?.access_token) {
              accessToken = data.session.access_token
            }
          } catch {
            /* keep existing session */
          }
        }

        let serverRole: string | undefined
        if (accessToken) {
          try {
            const url = resolveApiUrl("/api/auth/sync-role")
            if (url) {
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
            }
          } catch (e) {
            if (typeof window !== "undefined") console.warn("[auth] sync-role failed:", e)
          }
        }

        let supaUser: {
          id: string
          email?: string
          user_metadata?: object
          app_metadata?: object
          role?: string
        } | null = initialSession.session.user ?? null

        if (!supaUser) {
          const { data } = await supabase.auth.getUser()
          supaUser = data?.user ?? null
        }
        if (!supaUser) return null

        const meta = (supaUser.user_metadata ?? {}) as Record<string, unknown>
        const appMeta = (supaUser.app_metadata ?? {}) as Record<string, unknown>

        const storedRole = readStoredUser()?.role
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
      } finally {
        refreshInFlight.current = null
      }
    })()

    refreshInFlight.current = task
    return task
  }, [])

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const stored = readStoredUser()
        if (stored && !cancelled) {
          setUser(stored)
          try {
            localStorage.setItem("user", JSON.stringify(stored))
          } catch {
            /* ignore */
          }
        }

        const supabase = getSupabase()
        const { data } = await supabase.auth.getSession()
        if (!cancelled && data?.session?.access_token) {
          await refreshUserFromSupabase()
        } else if (!cancelled && !stored) {
          setUser(null)
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [refreshUserFromSupabase])

  useEffect(() => {
    const supabase = getSupabase()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") {
        setUser(null)
        try {
          localStorage.removeItem("user")
        } catch {
          /* ignore */
        }
        return
      }

      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") && session?.user) {
        const stored = readStoredUser()
        if (stored?.id === session.user.id) {
          setUser(stored)
        }
        void refreshUserFromSupabase()
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [refreshUserFromSupabase])

  // Recover user from localStorage if context was reset without a full remount.
  useEffect(() => {
    if (isLoading || user) return
    const stored = readStoredUser()
    if (stored) setUser(stored)
  }, [isLoading, user])

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
