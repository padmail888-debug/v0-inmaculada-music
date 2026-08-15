"use client"

import type { FormEvent } from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { getSupabase } from "@/lib/supabase/client"
import { nativeCrossOriginFetchInit, resolveApiUrl } from "@/lib/api-base"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { isDeleteAccountConfirm } from "@/lib/account-delete"

export function DeleteAccountForm() {
  const router = useRouter()
  const { user, logout, isLoading } = useAuth()
  const [confirmText, setConfirmText] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  if (isLoading) {
    return <p className="text-slate-300 text-center py-6">Cargando…</p>
  }

  if (done) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-white font-medium">Tu cuenta se eliminó correctamente.</p>
        <p className="text-slate-300 text-sm">Ya no podrás iniciar sesión con esos datos.</p>
        <Button type="button" className="bg-purple-600 hover:bg-purple-700" onClick={() => router.replace("/")}>
          Volver al inicio
        </Button>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="space-y-4">
        <p className="text-slate-200">
          Para eliminar tu cuenta, inicia sesión. Esta misma página funciona en la web y en la app.
        </p>
        <Button asChild className="w-full min-h-[44px] bg-purple-600 hover:bg-purple-700">
          <Link href="/login?redirect=/delete-account">Iniciar sesión para continuar</Link>
        </Button>
      </div>
    )
  }

  if (user.role === "superadmin") {
    return (
      <p className="text-sm text-amber-300">
        Un Super Admin no puede eliminar su propia cuenta. Pide a otro administrador que la gestione.
      </p>
    )
  }

  const isArtist = user.role === "artist" || user.role === "artist-pro"

  const handleDelete = async (e: FormEvent) => {
    e.preventDefault()
    if (!isDeleteAccountConfirm(confirmText) || loading) return
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabase()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error("Sesión no disponible. Vuelve a iniciar sesión.")

      const url = resolveApiUrl("/api/account/delete")
      if (!url) throw new Error("API no configurada")

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ confirm: confirmText.trim() }),
        ...nativeCrossOriginFetchInit,
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(typeof body?.error === "string" ? body.error : "No se pudo eliminar la cuenta")
      }

      await logout()
      setDone(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo eliminar la cuenta")
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleDelete} className="space-y-4">
      <p className="text-sm text-slate-300">
        Sesión: <span className="text-white font-medium">{user.email}</span>
      </p>
      {isArtist && (
        <p className="text-sm text-amber-200">
          Eres artista: también se eliminarán tus canciones, álbumes y conciertos.
        </p>
      )}
      <div className="space-y-2">
        <Label htmlFor="delete-account-confirm" className="text-white">
          Escribe ELIMINAR o DELETE para confirmar
        </Label>
        <Input
          id="delete-account-confirm"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          className="bg-slate-800 border-slate-600 text-white min-h-[44px]"
          autoComplete="off"
          disabled={loading}
        />
      </div>
      {error && (
        <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{error}</p>
      )}
      <Button
        type="submit"
        className="w-full min-h-[44px] bg-red-700 hover:bg-red-800 text-white"
        disabled={loading || !isDeleteAccountConfirm(confirmText)}
      >
        {loading ? "Eliminando…" : "Eliminar mi cuenta definitivamente"}
      </Button>
    </form>
  )
}
