"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { sendLoginSuccessNotification } from "@/lib/notification-client"
import { getSupabase } from "@/lib/supabase/client"
import type { UserRole } from "@/hooks/use-auth"
import { mapSupabaseRoleToUserRole, resolveRawRoleFromAuthUser } from "@/lib/user-role"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get("redirect")
  const { login, refreshUserFromSupabase } = useAuth()

  async function getFreshAccessTokenWithRetry() {
    const supabase = getSupabase()
    for (let attempt = 0; attempt < 4; attempt++) {
      const { data } = await supabase.auth.getSession()
      const token = data.session?.access_token
      if (token) return token
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
    }
    return null
  }

  const handleSocialLogin = async (provider: "google" | "apple" | "facebook") => {
    setIsLoading(true)
    try {
      // Simulate social login process
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Mock social login success
      const userData = {
        id: Date.now().toString(),
        email: `user@${provider}.com`,
        name: `Usuario de ${provider.charAt(0).toUpperCase() + provider.slice(1)}`,
        role: "free" as const,
        subscription: null,
      }

      login(userData)
      router.push("/dashboard")
    } catch (error) {
      console.error(`${provider} login error:`, error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const supabase = getSupabase()
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error || !data.user) {
        console.error("Supabase login error:", error)
        alert("No se pudo iniciar sesión. Verifica tu email y contraseña.")
        return
      }

      const supaUser = data.user
      const meta = (supaUser.user_metadata ?? {}) as Record<string, unknown>
      const appMeta = (supaUser.app_metadata ?? {}) as Record<string, unknown>

      const rawRole = resolveRawRoleFromAuthUser(appMeta, meta, undefined, supaUser.role)
      const userRole: UserRole = mapSupabaseRoleToUserRole(rawRole)
      const userName =
        (meta.name as string | undefined) ??
        (meta.full_name as string | undefined) ??
        supaUser.email?.split("@")[0] ??
        email

      const userData = {
        id: supaUser.id,
        email: supaUser.email ?? email,
        name: userName,
        role: userRole,
        subscription: null,
      }

      login(userData)

      // Sync role from server (app_metadata) so Artist Pro / Premium show correctly after re-login
      const updatedUser = await refreshUserFromSupabase()
      const roleForRedirect = updatedUser?.role ?? userRole

      const safeRedirect = redirectTo?.startsWith("/") ? redirectTo : null
      if (safeRedirect) {
        router.push(safeRedirect)
      } else if (roleForRedirect === "superadmin") {
        router.push("/admin")
      } else if (roleForRedirect === "artist-pro" || roleForRedirect === "artist") {
        router.push("/artist/profile")
      } else {
        router.push("/dashboard")
      }

      // Inbox + push after redirect — do not block login (FCM token may register a moment later).
      const loginAccessToken = data.session?.access_token || (await getFreshAccessTokenWithRetry())
      if (loginAccessToken) {
        void sendLoginSuccessNotification(loginAccessToken)
          .then((createdNotification) => {
            if (typeof window === "undefined" || !createdNotification) return
            sessionStorage.setItem(
              "pending_notification",
              JSON.stringify({ ...createdNotification, pending_at: new Date().toISOString() }),
            )
            window.dispatchEvent(
              new CustomEvent("app:notification-created", {
                detail: { notification: createdNotification },
              }),
            )
          })
          .catch((emitErr) => {
            console.error("Login notification emit failed:", emitErr)
          })
      }
    } catch (error) {
      console.error("Login error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Button
          type="button"
          variant="outline"
          className="w-full bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
          onClick={() => handleSocialLogin("google")}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 2.43-4.53 4.12-4.53z"
            />
          </svg>
          Continuar con Google
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full bg-black hover:bg-gray-900 text-white border-gray-600"
          onClick={() => handleSocialLogin("apple")}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
          </svg>
          Continuar con Apple
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full bg-[#1877F2] hover:bg-[#166FE5] text-white border-[#1877F2]"
          onClick={() => handleSocialLogin("facebook")}
          disabled={isLoading}
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          Continuar con Facebook
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/20" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-900 px-2 text-gray-400">O continúa con email</span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email" className="text-white">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            placeholder="tu@email.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-white">
            Contraseña
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
          {isLoading ? "Iniciando sesión..." : "Iniciar Sesión"}
        </Button>

        <div className="text-center">
          <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300 underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

      </form>
    </div>
  )
}
