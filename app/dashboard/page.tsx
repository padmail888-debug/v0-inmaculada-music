 "use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function DashboardPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; email?: string; role?: string } | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    try {
      // Get user from localStorage (set by auth context)
      const storedUser = localStorage.getItem("user")
      if (storedUser) {
        setUser(JSON.parse(storedUser))
      }
    } catch (err) {
      console.log("No user found")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login")
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-white/30 border-t-white mx-auto mb-4" />
          <p className="text-slate-300">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">Bienvenido, {user.name || "Usuario"}</h1>
        <p className="text-slate-300 mb-8 text-lg">
          Disfruta de tu música sin límites
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-2">Tu Perfil</h3>
            <p className="text-slate-300">{user.email}</p>
            <p className="text-slate-300 capitalize">Plan: {user.role}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-2">Estadísticas</h3>
            <p className="text-2xl font-bold text-purple-400">0</p>
            <p className="text-slate-300">Canciones reproducidas</p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 border border-white/20">
            <h3 className="text-xl font-semibold mb-2">Recomendación</h3>
            <p className="text-slate-300">Descubre nueva música cada día</p>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          className="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
        >
          Volver al Inicio
        </button>
      </div>
    </div>
  )
}
