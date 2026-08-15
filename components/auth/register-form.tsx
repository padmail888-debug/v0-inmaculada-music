"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { useAdminSettings } from "@/hooks/use-admin-settings"
import { getSupabase } from "@/lib/supabase/client"
import { getPostLoginPath, resolveUserRoleFromAuthUser } from "@/lib/user-role"

export function RegisterForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "free" as "free" | "premium" | "artist",
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()
  const { settings, loading: settingsLoading } = useAdminSettings()

  const registrationClosed = !settingsLoading && !settings.userRegistration

  const preselectedPlan = searchParams.get("plan")
  useEffect(() => {
    if (preselectedPlan === "premium") {
      setFormData((prev) => (prev.role === "free" ? { ...prev, role: "premium" } : prev))
    }
  }, [preselectedPlan])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!settings.userRegistration) {
      alert("El registro de nuevos usuarios está temporalmente cerrado.")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      alert("Las contraseñas no coinciden")
      return
    }

    setIsLoading(true)

    try {
      const supabase = getSupabase()
      const wantsPremium = formData.role === "premium"

      // Premium is granted only after Stripe payment — register as free (or artist) first.
      let metaRole = "Free User"
      if (formData.role === "artist") metaRole = "Artist"

      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
            role: metaRole,
            intended_plan: wantsPremium ? "premium" : formData.role,
          },
        },
      })

      if (error || !data.user) {
        console.error("Supabase registration error:", error)
        alert("No se pudo crear la cuenta. Revisa los datos o inténtalo de nuevo.")
        return
      }

      const supaUser = data.user
      const meta = (supaUser.user_metadata ?? {}) as Record<string, unknown>
      const appMeta = (supaUser.app_metadata ?? {}) as Record<string, unknown>

      const userRole = resolveUserRoleFromAuthUser(appMeta, meta, data.session?.access_token)

      const userData = {
        id: supaUser.id,
        email: supaUser.email ?? formData.email,
        name: formData.name,
        role: userRole,
        subscription: null,
      }

      // If Supabase email confirmations are disabled, we may already have a session.
      // In that case, log the user in locally; otherwise send them to login.
      if (data.session) {
        login(userData)

        if (wantsPremium) {
          router.push("/subscription")
        } else {
          router.push(getPostLoginPath(userRole))
        }
      } else {
        alert(
          wantsPremium
            ? "Cuenta creada. Confirma tu email, inicia sesión y completa el pago Premium."
            : "Cuenta creada. Revisa tu email para confirmar la cuenta antes de iniciar sesión.",
        )
        router.push(wantsPremium ? "/login?redirect=/subscription" : "/login")
      }
    } catch (error) {
      console.error("Registration error:", error)
      alert("Ocurrió un error al crear la cuenta.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {registrationClosed && (
        <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-100">
          El registro de nuevas cuentas está cerrado por el administrador.
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name" className="text-white">
          Nombre completo
        </Label>
        <Input
          id="name"
          type="text"
          value={formData.name}
          onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
          required
          disabled={registrationClosed}
          className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
          placeholder="Tu nombre"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email" className="text-white">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
          required
          disabled={registrationClosed}
          className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
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
          value={formData.password}
          onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
          required
          disabled={registrationClosed}
          className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-white">
          Confirmar contraseña
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
          required
          disabled={registrationClosed}
          className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
          placeholder="••••••••"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role" className="text-white">
          Tipo de cuenta
        </Label>
        <select
          id="role"
          value={formData.role}
          disabled={registrationClosed}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              role: e.target.value as "free" | "premium" | "artist",
            }))
          }
          className="w-full rounded-md bg-black/30 border border-white/20 text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="free">Usuario Gratuito</option>
          <option value="premium">
            Usuario Premium (${settings.premiumPrice.toFixed(2)}/mes — pago tras registrarte)
          </option>
          <option value="artist">Artista</option>
        </select>
      </div>

      <Button
        type="submit"
        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
        disabled={isLoading || registrationClosed || settingsLoading}
      >
        {isLoading
          ? "Creando cuenta..."
          : registrationClosed
            ? "Registro cerrado"
            : "Crear Cuenta"}
      </Button>
    </form>
  )
}
