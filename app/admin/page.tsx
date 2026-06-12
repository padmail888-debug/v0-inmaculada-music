"use client"

import { useAuth } from "@/hooks/use-auth"
import { useAdminSettings } from "@/hooks/use-admin-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, Music, DollarSign, UserCheck, UserX, Crown, Play, TrendingUp, AlertCircle, Star } from "lucide-react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import { AppShell } from "@/components/layout/app-shell"

export default function AdminPage() {
  const { user } = useAuth()
  const { settings, updateSettings } = useAdminSettings()
  const [isUpdating, setIsUpdating] = useState(false)

  if (!user || user.role !== "superadmin") {
    redirect("/dashboard")
  }

  const mockUserStats = {
    totalUsers: 28450,
    freeUsers: 18280,
    premiumUsers: 8920,
    artists: 1250,
    unpaidAccounts: 2340,
    activeToday: 15670,
    newThisMonth: 1890,
  }

  const mockPlaybackStats = {
    totalPlays: 5678900,
    topSongs: [
      { id: "1", title: "Midnight Dreams", artist: "DJ Electronic", plays: 234567, revenue: 1172.84 },
      { id: "2", title: "Acoustic Soul", artist: "Sarah Johnson", plays: 198432, revenue: 992.16 },
      { id: "3", title: "Coffee Shop Jazz", artist: "Jazz Collective", plays: 176543, revenue: 882.72 },
      { id: "4", title: "Digital Horizons", artist: "Synth Wave", plays: 145678, revenue: 728.39 },
      { id: "5", title: "Urban Beats", artist: "MC Flow", plays: 134567, revenue: 672.84 },
    ],
    topArtists: [
      { id: "1", name: "DJ Electronic", totalPlays: 456789, songs: 12, revenue: 2283.95 },
      { id: "2", name: "Sarah Johnson", totalPlays: 398432, songs: 8, revenue: 1992.16 },
      { id: "3", name: "Jazz Collective", totalPlays: 345678, songs: 15, revenue: 1728.39 },
      { id: "4", name: "Synth Wave", totalPlays: 298765, songs: 10, revenue: 1493.83 },
      { id: "5", name: "MC Flow", totalPlays: 267890, songs: 6, revenue: 1339.45 },
    ],
  }

  const mockUsers = [
    { id: "1", name: "Juan Pérez", email: "juan@example.com", role: "premium", status: "active" },
    { id: "2", name: "María García", email: "maria@example.com", role: "artist", status: "active" },
    { id: "3", name: "Carlos López", email: "carlos@example.com", role: "free", status: "suspended" },
  ]

  const mockStats = {
    totalUsers: 28450,
    premiumUsers: 8920,
    artists: 1250,
    totalSongs: 45600,
    monthlyRevenue: 125000,
    growth: 12.5,
  }

  const toggleMaintenanceMode = () => {
    updateSettings({
      ...settings,
      maintenanceMode: !settings.maintenanceMode,
    })
  }

  const handleUpdateSettings = async () => {
    setIsUpdating(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsUpdating(false)
    alert("Configuración actualizada correctamente")
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto min-w-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Panel de Administración</h1>
        <p className="text-gray-400">Gestión completa de la plataforma musical</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link href="/admin/users?filter=free">
          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Usuarios Gratuitos</p>
                  <p className="text-2xl font-bold text-white">{mockUserStats.freeUsers.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">64% del total</p>
                </div>
                <Users className="h-8 w-8 text-gray-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users?filter=premium">
          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Usuarios Premium</p>
                  <p className="text-2xl font-bold text-white">{mockUserStats.premiumUsers.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">31% del total</p>
                </div>
                <Crown className="h-8 w-8 text-yellow-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users?filter=artist">
          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Artistas</p>
                  <p className="text-2xl font-bold text-white">{mockUserStats.artists.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">4% del total</p>
                </div>
                <Music className="h-8 w-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/users?filter=unpaid">
          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Cuentas Sin Pagar</p>
                  <p className="text-2xl font-bold text-white">{mockUserStats.unpaidAccounts.toLocaleString()}</p>
                  <p className="text-xs text-red-400">Suscripciones vencidas</p>
                </div>
                <AlertCircle className="h-8 w-8 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="flex w-full overflow-x-auto bg-slate-700 p-1 gap-1 [&>button]:flex-shrink-0 [&>button]:min-h-[40px] sm:grid sm:grid-cols-6 sm:overflow-visible sm:[&>button]:min-h-0">
          <TabsTrigger value="users">Usuarios</TabsTrigger>
          <TabsTrigger value="content">Contenido</TabsTrigger>
          <TabsTrigger value="analytics">Analíticas</TabsTrigger>
          <TabsTrigger value="playback">Reproducciones</TabsTrigger>
          <TabsTrigger value="featured">
            <Star className="h-4 w-4 mr-1" />
            Destacados
          </TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Activos Hoy</p>
                    <p className="text-xl font-bold text-green-400">{mockUserStats.activeToday.toLocaleString()}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Nuevos Este Mes</p>
                    <p className="text-xl font-bold text-blue-400">{mockUserStats.newThisMonth.toLocaleString()}</p>
                  </div>
                  <Users className="h-6 w-6 text-blue-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Tasa Conversión</p>
                    <p className="text-xl font-bold text-purple-400">31.4%</p>
                  </div>
                  <DollarSign className="h-6 w-6 text-purple-400" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Gestión de Usuarios
                <Link href="/admin/users">
                  <Button variant="outline" className="border-slate-600 text-white bg-transparent">
                    Ver Todos
                  </Button>
                </Link>
              </CardTitle>
              <CardDescription>Administra todos los usuarios de la plataforma</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div>
                        <p className="font-semibold text-white">{user.name}</p>
                        <p className="text-sm text-gray-400">{user.email}</p>
                      </div>
                      <Badge
                        className={`${
                          user.role === "premium"
                            ? "bg-blue-500"
                            : user.role === "artist"
                              ? "bg-purple-500"
                              : "bg-gray-500"
                        } text-white`}
                      >
                        {user.role}
                      </Badge>
                      <Badge
                        variant={user.status === "active" ? "default" : "destructive"}
                        className={user.status === "active" ? "bg-green-600" : ""}
                      >
                        {user.status}
                      </Badge>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-slate-600 text-white hover:bg-slate-600 bg-transparent"
                      >
                        <UserCheck className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white bg-transparent"
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Moderación de Contenido</CardTitle>
              <CardDescription>Revisa y modera el contenido subido por artistas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img src="/abstract-music-album-cover.png" alt="Album" className="w-12 h-12 rounded" />
                    <div>
                      <p className="font-semibold text-white">Nueva Canción - "Midnight Dreams"</p>
                      <p className="text-sm text-gray-400">Por: DJ Electronic • Pendiente de revisión</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Aprobar
                    </Button>
                    <Button size="sm" variant="destructive">
                      Rechazar
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <img src="/electronic-music-album.png" alt="Album" className="w-12 h-12 rounded" />
                    <div>
                      <p className="font-semibold text-white">Álbum - "Digital Horizons"</p>
                      <p className="text-sm text-gray-400">Por: Synth Wave • Reportado por contenido</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="border-slate-600 text-white bg-transparent">
                      Revisar
                    </Button>
                    <Button size="sm" variant="destructive">
                      Suspender
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Reproducciones por Día</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Hoy</span>
                    <span className="text-white font-semibold">1,245,678</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Ayer</span>
                    <span className="text-white font-semibold">1,189,432</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Promedio 7 días</span>
                    <span className="text-white font-semibold">1,156,789</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: "78%" }}></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Géneros Más Populares</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Pop</span>
                    <span className="text-white">32%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Rock</span>
                    <span className="text-white">28%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Electronic</span>
                    <span className="text-white">18%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Jazz</span>
                    <span className="text-white">12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Otros</span>
                    <span className="text-white">10%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Métricas de Crecimiento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">+{mockStats.growth}%</p>
                  <p className="text-gray-400">Crecimiento mensual</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-400">89.2%</p>
                  <p className="text-gray-400">Retención de usuarios</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-400">4.7</p>
                  <p className="text-gray-400">Rating promedio</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="playback" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Play className="h-5 w-5" />
                  Top Canciones por Reproducciones
                </CardTitle>
                <CardDescription>Las canciones más reproducidas de la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPlaybackStats.topSongs.map((song, index) => (
                    <div key={song.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
                        <div>
                          <p className="font-semibold text-white">{song.title}</p>
                          <p className="text-sm text-gray-400">{song.artist}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{song.plays.toLocaleString()}</p>
                        <p className="text-xs text-green-400">${song.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Artistas por Reproducciones
                </CardTitle>
                <CardDescription>Los artistas más escuchados de la plataforma</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockPlaybackStats.topArtists.map((artist, index) => (
                    <div key={artist.id} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-400 font-bold text-lg">#{index + 1}</span>
                        <div>
                          <p className="font-semibold text-white">{artist.name}</p>
                          <p className="text-sm text-gray-400">{artist.songs} canciones</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{artist.totalPlays.toLocaleString()}</p>
                        <p className="text-xs text-green-400">${artist.revenue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Estadísticas Generales de Reproducciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-400">{mockPlaybackStats.totalPlays.toLocaleString()}</p>
                  <p className="text-gray-400">Total Reproducciones</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">1,234,567</p>
                  <p className="text-gray-400">Reproducciones Hoy</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-purple-400">4.2</p>
                  <p className="text-gray-400">Promedio por Usuario</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-yellow-400">89%</p>
                  <p className="text-gray-400">Tasa Finalización</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="featured" className="space-y-4">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400" />
                Gestión de Contenido Destacado
              </CardTitle>
              <CardDescription>
                Administra los anuncios y promociones que aparecen en los perfiles de usuarios
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Star className="h-12 w-12 text-yellow-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Panel de Contenido Destacado</h3>
                <p className="text-gray-400 mb-4">
                  Gestiona anuncios, promociones y eventos que aparecen en todos los perfiles
                </p>
                <Link href="/admin/featured">
                  <Button className="bg-yellow-600 hover:bg-yellow-700">
                    <Star className="h-4 w-4 mr-2" />
                    Ir a Gestión Completa
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Configuración de Plataforma</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Registro de nuevos usuarios</p>
                    <p className="text-sm text-gray-400">Permitir que nuevos usuarios se registren</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      settings.allowRegistration
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-slate-600 text-gray-400 bg-transparent"
                    }
                    onClick={() => updateSettings({ ...settings, allowRegistration: !settings.allowRegistration })}
                  >
                    {settings.allowRegistration ? "Activado" : "Desactivado"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Modo mantenimiento</p>
                    <p className="text-sm text-gray-400">Activar página de mantenimiento</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      settings.maintenanceMode
                        ? "bg-red-600 border-red-600 text-white"
                        : "border-slate-600 text-gray-400 bg-transparent"
                    }
                    onClick={toggleMaintenanceMode}
                  >
                    {settings.maintenanceMode ? "Activado" : "Desactivado"}
                  </Button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Subida de contenido</p>
                    <p className="text-sm text-gray-400">Permitir que artistas suban música</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className={
                      settings.allowUploads
                        ? "bg-green-600 border-green-600 text-white"
                        : "border-slate-600 text-gray-400 bg-transparent"
                    }
                    onClick={() => updateSettings({ ...settings, allowUploads: !settings.allowUploads })}
                  >
                    {settings.allowUploads ? "Activado" : "Desactivado"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Configuración de Pagos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Precio Premium (mensual)</p>
                    <p className="text-sm text-gray-400">Precio de suscripción premium</p>
                  </div>
                  <span className="text-white font-semibold">$9.99</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">Comisión de artistas</p>
                    <p className="text-sm text-gray-400">Porcentaje que reciben los artistas</p>
                  </div>
                  <span className="text-white font-semibold">70%</span>
                </div>

                <Button
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  onClick={handleUpdateSettings}
                  disabled={isUpdating}
                >
                  {isUpdating ? "Actualizando..." : "Actualizar Configuración"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AppShell>
  )
}
