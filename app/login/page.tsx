import { Suspense } from "react"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
            <BrandLogo className="h-8 w-8" />
            <span className="text-2xl font-bold">Inmaculada Music</span>
          </Link>
        </div>

        <Card className="bg-slate-800/90 border-slate-600 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Iniciar Sesión</CardTitle>
            <CardDescription className="text-slate-200">Accede a tu cuenta para continuar</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-slate-400 text-center py-6">Cargando...</div>}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="text-center text-slate-200 mt-6">
          ¿No tienes cuenta?{" "}
          <Link href="/register" className="text-purple-400 hover:text-purple-300 font-medium">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
