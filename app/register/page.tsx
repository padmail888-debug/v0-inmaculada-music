import { Suspense } from "react"
import { RegisterForm } from "@/components/auth/register-form"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { BrandLogo } from "@/components/brand-logo"

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 text-white hover:text-purple-300 transition-colors">
            <BrandLogo className="h-8 w-8" />
            <span className="text-2xl font-bold">Inmaculada Music</span>
          </Link>
        </div>

        <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-white">Crear Cuenta</CardTitle>
            <CardDescription className="text-slate-200">Únete a Inmaculada Music y descubre nueva música</CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="text-center text-slate-400 py-4">Cargando...</div>}>
              <RegisterForm />
            </Suspense>
          </CardContent>
        </Card>

        <p className="text-center text-gray-300 mt-6">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  )
}
