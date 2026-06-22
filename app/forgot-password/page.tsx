"use client"
export const dynamic = 'force-dynamic'

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Mail, CheckCircle } from "lucide-react"
import { getSupabase } from "@/lib/supabase/client"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const supabase = getSupabase()
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
      })
      if (err) {
        setError(err.message || "No se pudo enviar el correo. Inténtalo de nuevo.")
        return
      }
      setIsSubmitted(true)
    } catch (err) {
      console.error("Error sending reset email:", err)
      setError("Ha ocurrido un error. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/40 border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-white text-xl">Correo Enviado</CardTitle>
            <CardDescription className="text-slate-200">
              Si existe una cuenta asociada con <strong>{email}</strong>, recibirás un correo electrónico con las
              instrucciones para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-slate-300 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="font-medium mb-1">¿No recibiste el correo?</p>
              <ul className="text-xs space-y-1">
                <li>• Revisa tu carpeta de spam o correo no deseado</li>
                <li>• Verifica que el correo esté escrito correctamente</li>
                <li>• El correo puede tardar unos minutos en llegar</li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                Intentar con otro correo
              </Button>

              <Link href="/login">
                <Button variant="ghost" className="w-full text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver al inicio de sesión
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/40 border-white/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-purple-400" />
          </div>
          <CardTitle className="text-white text-xl">¿Olvidaste tu contraseña?</CardTitle>
          <CardDescription className="text-slate-200">
            Introduce tu correo electrónico y te enviaremos las instrucciones para restablecer tu contraseña.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-black/30 border-white/20 text-white placeholder:text-gray-400"
                placeholder="tu@email.com"
              />
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar instrucciones"}
            </Button>
            {error && (
              <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </p>
            )}
          </form>

          <div className="mt-6 text-center">
            <Link href="/login">
              <Button variant="ghost" className="text-purple-400 hover:text-purple-300 hover:bg-purple-500/10">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver al inicio de sesión
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
