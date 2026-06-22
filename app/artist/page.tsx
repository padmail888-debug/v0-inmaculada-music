"use client"
export const dynamic = 'force-dynamic'



import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Music, Upload, BarChart3, Settings, Crown } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"
import { ArtistShell } from "@/components/layout/artist-shell"

export default function ArtistPage() {
  const { user } = useAuth()

  if (!user) {
    redirect("/login")
  }

  if (user.role !== "artist" && user.role !== "artist-pro" && user.role !== "superadmin") {
    return (
      <ArtistShell>
        <div className="flex items-center justify-center min-h-[50vh] px-4">
        <Card className="bg-slate-800/50 border-slate-700 max-w-md w-full">
          <CardHeader className="text-center">
            <Crown className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <CardTitle className="text-white">Acceso de Artista</CardTitle>
            <CardDescription className="text-slate-400">
              Necesitas una cuenta de artista para acceder a esta sección
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/login">
              <Button className="bg-purple-600 hover:bg-purple-700">Iniciar sesión</Button>
            </Link>
          </CardContent>
        </Card>
        </div>
      </ArtistShell>
    )
  }

  return (
    <ArtistShell>
      <div className="max-w-6xl mx-auto min-w-0">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Panel de Artista</h1>
          <p className="text-slate-300">Gestiona tu música y conecta con tus fans</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/artist/profile">
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg group-hover:bg-purple-600/30 transition-colors">
                    <Music className="w-6 h-6 text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Mi Perfil</CardTitle>
                    <CardDescription className="text-slate-400">Gestiona tu perfil de artista</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">
                  Actualiza tu información, estadísticas y configuración de artista
                </p>
              </CardContent>
            </Card>
          </Link>

          <Link href="/artist/upload">
            <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer group">
              <CardHeader>
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-600/20 rounded-lg group-hover:bg-green-600/30 transition-colors">
                    <Upload className="w-6 h-6 text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">Subir Música</CardTitle>
                    <CardDescription className="text-slate-400">Comparte tu música con el mundo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-sm">Sube nuevas canciones, álbumes y gestiona tu catálogo musical</p>
              </CardContent>
            </Card>
          </Link>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer group">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-600/20 rounded-lg group-hover:bg-blue-600/30 transition-colors">
                  <BarChart3 className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Analíticas</CardTitle>
                  <CardDescription className="text-slate-400">Próximamente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">Estadísticas detalladas de reproducciones y audiencia</p>
            </CardContent>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 hover:bg-slate-800/70 transition-colors cursor-pointer group">
            <CardHeader>
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-600/20 rounded-lg group-hover:bg-orange-600/30 transition-colors">
                  <Settings className="w-6 h-6 text-orange-400" />
                </div>
                <div>
                  <CardTitle className="text-white">Configuración</CardTitle>
                  <CardDescription className="text-slate-400">Próximamente</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">Ajustes de distribución, regalías y preferencias</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-white mb-6">Resumen Rápido</h2>
          <div className="grid md:grid-cols-4 gap-4">
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">12</p>
                <p className="text-slate-400 text-sm">Canciones</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">1,234</p>
                <p className="text-slate-400 text-sm">Reproducciones</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">89</p>
                <p className="text-slate-400 text-sm">Seguidores</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-800/30 border-slate-700">
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-white">$45.67</p>
                <p className="text-slate-400 text-sm">Ganancias</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </ArtistShell>
  )
}
