"use client"
export const dynamic = 'force-dynamic'

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { ArrowLeft, Lock, CheckCircle, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase/client"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const router = useRouter()

  const validatePassword = (pwd: string) => {
    const validationErrors: string[] = []

    if (pwd.length < 8) {
      validationErrors.push("Mínimo 8 caracteres")
    }
    if (!/[A-Z]/.test(pwd)) {
      validationErrors.push("Al menos una mayúscula")
    }
    if (!/[a-z]/.test(pwd)) {
      validationErrors.push("Al menos una minúscula")
    }
    if (!/\d/.test(pwd)) {
      validationErrors.push("Al menos un número")
    }

    return validationErrors
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors([])

    const passwordErrors = validatePassword(password)

    if (passwordErrors.length > 0) {
      setErrors(passwordErrors)
      return
    }

    if (password !== confirmPassword) {
      setErrors(["Las contraseñas no coinciden"])
      return
    }

    setIsLoading(true)

    try {
      const supabase = getSupabase()
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setErrors([
          updateError.message === "New password should be different from the old password."
            ? "La nueva contraseña debe ser distinta a la anterior."
            : updateError.message || "El enlace ha caducado o no es válido. Solicita uno nuevo desde ¿Olvidaste tu contraseña?",
        ])
        return
      }
      setIsSuccess(true)
      setTimeout(() => {
        router.push("/login")
      }, 3000)
    } catch (err) {
      console.error("Error resetting password:", err)
      setErrors(["Error al restablecer la contraseña. Inténtalo de nuevo."])
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-black/40 border-white/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-white text-xl">¡Contraseña Restablecida!</CardTitle>
            <CardDescription className="text-slate-200">
              Tu contraseña ha sido restablecida exitosamente. Serás redirigido al inicio de sesión en unos segundos.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/login">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Ir al inicio de sesión</Button>
            </Link>
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
            <Lock className="w-8 h-8 text-purple-400" />
          </div>
          <CardTitle className="text-white text-xl">Restablecer Contraseña</CardTitle>
          <CardDescription className="text-slate-200">
            Introduce tu nueva contraseña. Asegúrate de que sea segura y fácil de recordar.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Nueva contraseña
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-black/30 border-white/20 text-white placeholder:text-gray-400 pr-10"
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white">
                Confirmar contraseña
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="bg-black/30 border-white/20 text-white placeholder:text-gray-400 pr-10"
                  placeholder="••••••••"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            {errors.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                <p className="text-red-400 text-sm font-medium mb-1">Requisitos de contraseña:</p>
                <ul className="text-red-300 text-xs space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-xs text-slate-300 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
              <p className="font-medium mb-1">Requisitos de contraseña:</p>
              <ul className="space-y-1">
                <li>• Mínimo 8 caracteres</li>
                <li>• Al menos una letra mayúscula</li>
                <li>• Al menos una letra minúscula</li>
                <li>• Al menos un número</li>
              </ul>
            </div>

            <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white" disabled={isLoading}>
              {isLoading ? "Restableciendo..." : "Restablecer contraseña"}
            </Button>
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
