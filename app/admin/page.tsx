"use client"

import { useAuth } from "@/hooks/use-auth"
import { useAdminSettings } from "@/hooks/use-admin-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  Music,
  DollarSign,
  Crown,
  Play,
  TrendingUp,
  AlertCircle,
  Star,
  RefreshCw,
  Search,
  EyeOff,
} from "lucide-react"
import Link from "next/link"
import { useCallback, useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AppShell } from "@/components/layout/app-shell"
import { Input } from "@/components/ui/input"
import { FeaturedContentManager } from "@/components/featured-content/featured-content-manager"
import {
  fetchAdminDashboard,
  fetchAdminSongs,
  fetchAdminAnalytics,
  fetchAdminPlayback,
  moderateAdminSong,
  type AdminDashboardData,
  type AdminSongRow,
  type AdminSongsData,
  type AdminAnalyticsData,
  type AdminPlaybackData,
} from "@/lib/admin-api"

const ADMIN_TABS = new Set([
  "users",
  "content",
  "analytics",
  "playback",
  "featured",
  "settings",
])

function pct(part: number, total: number) {
  if (!total) return "0%"
  return `${Math.round((part / total) * 100)}%`
}

function roleBadgeClass(role: string) {
  if (role === "premium") return "bg-blue-500"
  if (role === "artist" || role === "artist-pro") return "bg-purple-500"
  if (role === "superadmin") return "bg-amber-600"
  return "bg-gray-500"
}

function formatDuration(seconds: number) {
  if (!seconds || seconds <= 0) return "—"
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function formatShortDate(value: string) {
  try {
    return new Date(value).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return "—"
  }
}

function formatDateTime(value: string) {
  try {
    return new Date(value).toLocaleString("es-ES", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "—"
  }
}

export function AdminPageInner() {
  const { user, isLoading: authLoading } = useAuth()
  const {
    settings,
    updateSettings,
    saveSettings,
    loadSettings,
    loading: settingsLoading,
    saving: settingsSaving,
    error: settingsError,
  } = useAdminSettings()
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabFromUrl = searchParams.get("tab")
  const initialTab =
    tabFromUrl && ADMIN_TABS.has(tabFromUrl) ? tabFromUrl : "users"
  const [data, setData] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busySongId, setBusySongId] = useState<string | null>(null)
  const [settingsSavedMsg, setSettingsSavedMsg] = useState<string | null>(null)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState(initialTab)
  const [featuredReloadKey, setFeaturedReloadKey] = useState(0)
  const [contentStatus, setContentStatus] = useState<"pending" | "published" | "all">("pending")
  const [contentSearch, setContentSearch] = useState("")
  const [contentData, setContentData] = useState<AdminSongsData | null>(null)
  const [contentLoading, setContentLoading] = useState(false)
  const [analyticsData, setAnalyticsData] = useState<AdminAnalyticsData | null>(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [analyticsError, setAnalyticsError] = useState<string | null>(null)
  const [playbackData, setPlaybackData] = useState<AdminPlaybackData | null>(null)
  const [playbackLoading, setPlaybackLoading] = useState(false)
  const [playbackError, setPlaybackError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const dashboard = await fetchAdminDashboard()
      setData(dashboard)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar el panel")
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const loadContent = useCallback(async () => {
    setContentLoading(true)
    try {
      const songs = await fetchAdminSongs(contentStatus, contentSearch)
      setContentData(songs)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar contenido")
      setContentData(null)
    } finally {
      setContentLoading(false)
    }
  }, [contentStatus, contentSearch])

  const loadAnalytics = useCallback(async () => {
    setAnalyticsLoading(true)
    setAnalyticsError(null)
    try {
      const analytics = await fetchAdminAnalytics()
      setAnalyticsData(analytics)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar analíticas"
      setAnalyticsError(message)
      setError(message)
      setAnalyticsData(null)
    } finally {
      setAnalyticsLoading(false)
    }
  }, [])

  const loadPlayback = useCallback(async () => {
    setPlaybackLoading(true)
    setPlaybackError(null)
    try {
      const playback = await fetchAdminPlayback()
      setPlaybackData(playback)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al cargar reproducciones"
      setPlaybackError(message)
      setError(message)
      setPlaybackData(null)
    } finally {
      setPlaybackLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login?redirect=/admin")
      return
    }
    if (user.role !== "superadmin") {
      router.replace("/dashboard")
      return
    }
    void load()
  }, [authLoading, user, router, load])

  useEffect(() => {
    if (activeTab !== "content" || user?.role !== "superadmin") return
    const timer = window.setTimeout(() => {
      void loadContent()
    }, contentSearch ? 300 : 0)
    return () => window.clearTimeout(timer)
  }, [activeTab, contentStatus, contentSearch, user?.role, loadContent])

  useEffect(() => {
    if (activeTab !== "analytics" || user?.role !== "superadmin") return
    void loadAnalytics()
  }, [activeTab, user?.role, loadAnalytics])

  useEffect(() => {
    if (activeTab !== "playback" || user?.role !== "superadmin") return
    void loadPlayback()
  }, [activeTab, user?.role, loadPlayback])

  useEffect(() => {
    if (activeTab !== "featured" || user?.role !== "superadmin") return
    setFeaturedReloadKey((k) => k + 1)
  }, [activeTab, user?.role])

  useEffect(() => {
    if (activeTab !== "settings" || user?.role !== "superadmin") return
    void loadSettings({ asAdmin: true })
  }, [activeTab, user?.role, loadSettings])

  useEffect(() => {
    const fromUrl = searchParams.get("tab")
    if (fromUrl && ADMIN_TABS.has(fromUrl) && fromUrl !== activeTab) {
      setActiveTab(fromUrl)
    }
  }, [searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const onTabChange = (value: string) => {
    setActiveTab(value)
    const params = new URLSearchParams(searchParams.toString())
    params.set("tab", value)
    router.replace(`/admin?${params.toString()}`, { scroll: false })
  }

  const onToggleSetting = async (
    key: "userRegistration" | "maintenanceMode" | "contentUpload",
  ) => {
    const next = !settings[key]
    setTogglingKey(key)
    setSettingsSavedMsg(null)
    updateSettings({ [key]: next })
    try {
      await saveSettings({ [key]: next })
      setSettingsSavedMsg("Configuración guardada")
    } catch (err) {
      updateSettings({ [key]: !next })
      setError(err instanceof Error ? err.message : "No se pudo guardar")
    } finally {
      setTogglingKey(null)
    }
  }

  const handleSavePaymentSettings = async () => {
    setSettingsSavedMsg(null)
    try {
      await saveSettings({
        premiumPrice: settings.premiumPrice,
        artistCommission: settings.artistCommission,
      })
      setSettingsSavedMsg("Precios guardados en la base de datos")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar")
    }
  }

  const onModerate = async (
    songId: string,
    action: "approve" | "reject" | "unpublish",
  ) => {
    setBusySongId(songId)
    setError(null)
    try {
      await moderateAdminSong(songId, action)
      await Promise.all([load(), loadContent()])
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo moderar la canción")
    } finally {
      setBusySongId(null)
    }
  }

  if (authLoading || !user || user.role !== "superadmin") {
    return (
      <AppShell>
        <div className="py-16 text-center text-slate-300">Cargando panel…</div>
      </AppShell>
    )
  }

  const stats = data?.userStats
  const content = data?.contentStats
  const plays = data?.playStats

  return (
    <AppShell>
      <div className="mx-auto min-w-0 max-w-7xl pb-28">
        <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="mb-2 text-2xl font-bold text-white sm:text-3xl">
              Panel de Administración
            </h1>
            <p className="text-gray-400">Datos en vivo desde Supabase</p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] border-slate-600 bg-transparent text-white"
            disabled={loading}
            onClick={() => void load()}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
        </div>

        {error && (
          <div className="mb-4 rounded-md border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="py-16 text-center text-slate-400">Cargando estadísticas…</div>
        ) : (
          <>
            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
              <Link href="/admin/users?filter=free">
                <Card className="cursor-pointer border-slate-700 bg-slate-800 transition-colors hover:bg-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Usuarios Gratuitos</p>
                        <p className="text-2xl font-bold text-white">
                          {(stats?.freeUsers ?? 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pct(stats?.freeUsers ?? 0, stats?.totalUsers ?? 0)} del total
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/users?filter=premium">
                <Card className="cursor-pointer border-slate-700 bg-slate-800 transition-colors hover:bg-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Usuarios Premium</p>
                        <p className="text-2xl font-bold text-white">
                          {(stats?.premiumUsers ?? 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {pct(stats?.premiumUsers ?? 0, stats?.totalUsers ?? 0)} del total
                        </p>
                      </div>
                      <Crown className="h-8 w-8 text-yellow-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/users?filter=artist">
                <Card className="cursor-pointer border-slate-700 bg-slate-800 transition-colors hover:bg-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Artistas</p>
                        <p className="text-2xl font-bold text-white">
                          {(stats?.artists ?? 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {stats?.artistPro ?? 0} Artist Pro ·{" "}
                          {pct(stats?.artists ?? 0, stats?.totalUsers ?? 0)} del total
                        </p>
                      </div>
                      <Music className="h-8 w-8 text-purple-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/admin/users?filter=unpaid">
                <Card className="cursor-pointer border-slate-700 bg-slate-800 transition-colors hover:bg-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Cuentas Sin Pagar</p>
                        <p className="text-2xl font-bold text-white">
                          {(stats?.unpaidAccounts ?? 0).toLocaleString()}
                        </p>
                        <p className="text-xs text-red-400">Suscripciones vencidas/canceladas</p>
                      </div>
                      <AlertCircle className="h-8 w-8 text-red-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>

            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Card className="border-slate-700 bg-slate-800">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-400">Total usuarios</p>
                  <p className="text-2xl font-bold text-white">
                    {(stats?.totalUsers ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-800">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-400">Canciones publicadas / pendientes</p>
                  <p className="text-2xl font-bold text-white">
                    {(content?.publishedSongs ?? 0).toLocaleString()}
                    <span className="text-base font-normal text-slate-400">
                      {" "}
                      / {(content?.pendingSongs ?? 0).toLocaleString()}
                    </span>
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-700 bg-slate-800">
                <CardContent className="p-5">
                  <p className="text-sm text-gray-400">Reproducciones totales</p>
                  <p className="text-2xl font-bold text-white">
                    {(plays?.totalPlays ?? 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Tabs
              value={activeTab}
              onValueChange={onTabChange}
              className="w-full"
            >
              <TabsList className="flex w-full gap-1 overflow-x-auto bg-slate-700 p-1 [&>button]:min-h-[40px] [&>button]:flex-shrink-0 sm:grid sm:grid-cols-6 sm:overflow-visible sm:[&>button]:min-h-0">
                <TabsTrigger value="users">Usuarios</TabsTrigger>
                <TabsTrigger value="content">Contenido</TabsTrigger>
                <TabsTrigger value="analytics">Analíticas</TabsTrigger>
                <TabsTrigger value="playback">Reproducciones</TabsTrigger>
                <TabsTrigger value="featured">
                  <Star className="mr-1 h-4 w-4" />
                  Destacados
                </TabsTrigger>
                <TabsTrigger value="settings">Configuración</TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="space-y-4">
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
                  <Card className="border-slate-700 bg-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Activos Hoy</p>
                          <p className="text-xl font-bold text-green-400">
                            {(stats?.activeToday ?? 0).toLocaleString()}
                          </p>
                        </div>
                        <TrendingUp className="h-6 w-6 text-green-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-700 bg-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Nuevos Este Mes</p>
                          <p className="text-xl font-bold text-blue-400">
                            {(stats?.newThisMonth ?? 0).toLocaleString()}
                          </p>
                        </div>
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-slate-700 bg-slate-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-400">Tasa Conversión</p>
                          <p className="text-xl font-bold text-purple-400">
                            {stats?.conversionRate ?? 0}%
                          </p>
                        </div>
                        <DollarSign className="h-6 w-6 text-purple-400" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between text-white">
                      Usuarios recientes
                      <Link href="/admin/users">
                        <Button
                          variant="outline"
                          className="min-h-[40px] border-slate-600 bg-transparent text-white"
                        >
                          Ver Todos
                        </Button>
                      </Link>
                    </CardTitle>
                    <CardDescription>Últimos registros en Auth</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {(data?.recentUsers || []).length === 0 && (
                        <p className="text-sm text-slate-400">No hay usuarios todavía.</p>
                      )}
                      {(data?.recentUsers || []).map((row) => (
                        <div
                          key={row.id}
                          className="flex flex-col gap-3 rounded-lg bg-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-white">{row.name}</p>
                            <p className="truncate text-sm text-gray-400">{row.email}</p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge className={`${roleBadgeClass(row.role)} text-white`}>
                              {row.role}
                            </Badge>
                            <Badge
                              variant={row.status === "active" ? "default" : "destructive"}
                              className={row.status === "active" ? "bg-green-600" : ""}
                            >
                              {row.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="content" className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Card
                    className={`cursor-pointer border-slate-700 bg-slate-800 hover:bg-slate-700 ${
                      contentStatus === "pending" ? "ring-2 ring-amber-500/60" : ""
                    }`}
                    onClick={() => setContentStatus("pending")}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-400">Pendientes</p>
                      <p className="text-2xl font-bold text-amber-300">
                        {(contentData?.stats.pendingSongs ?? content?.pendingSongs ?? 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer border-slate-700 bg-slate-800 hover:bg-slate-700 ${
                      contentStatus === "published" ? "ring-2 ring-green-500/60" : ""
                    }`}
                    onClick={() => setContentStatus("published")}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-400">Publicadas</p>
                      <p className="text-2xl font-bold text-green-300">
                        {(
                          contentData?.stats.publishedSongs ?? content?.publishedSongs ?? 0
                        ).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                  <Card
                    className={`cursor-pointer border-slate-700 bg-slate-800 hover:bg-slate-700 ${
                      contentStatus === "all" ? "ring-2 ring-blue-500/60" : ""
                    }`}
                    onClick={() => setContentStatus("all")}
                  >
                    <CardContent className="p-4">
                      <p className="text-sm text-gray-400">Total</p>
                      <p className="text-2xl font-bold text-white">
                        {(contentData?.stats.totalSongs ?? content?.totalSongs ?? 0).toLocaleString()}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <CardTitle className="text-white">Moderación de Contenido</CardTitle>
                    <CardDescription>
                      Aprueba, rechaza o despublica canciones de artistas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          value={contentSearch}
                          onChange={(e) => setContentSearch(e.target.value)}
                          placeholder="Buscar por título o artista…"
                          className="min-h-[48px] border-slate-600 bg-slate-700 pl-10 text-base text-white"
                        />
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(
                          [
                            ["pending", "Pendientes"],
                            ["published", "Publicadas"],
                            ["all", "Todas"],
                          ] as const
                        ).map(([key, label]) => (
                          <Button
                            key={key}
                            type="button"
                            variant={contentStatus === key ? "default" : "outline"}
                            className={
                              contentStatus === key
                                ? "min-h-[44px] bg-blue-600"
                                : "min-h-[44px] border-slate-600 bg-transparent text-gray-300"
                            }
                            onClick={() => setContentStatus(key)}
                          >
                            {label}
                          </Button>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          className="min-h-[44px] border-slate-600 bg-transparent text-white"
                          disabled={contentLoading}
                          onClick={() => void loadContent()}
                        >
                          <RefreshCw
                            className={`mr-2 h-4 w-4 ${contentLoading ? "animate-spin" : ""}`}
                          />
                          Actualizar
                        </Button>
                      </div>
                    </div>

                    {contentLoading && !contentData ? (
                      <p className="py-8 text-center text-slate-400">Cargando canciones…</p>
                    ) : (contentData?.songs || []).length === 0 ? (
                      <p className="py-8 text-center text-slate-400">
                        No hay canciones en este filtro.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {(contentData?.songs || []).map((song: AdminSongRow) => (
                          <div
                            key={song.id}
                            className="flex flex-col gap-3 rounded-lg bg-slate-700 p-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div className="flex min-w-0 items-center gap-4">
                              <img
                                src={song.coverUrl || "/placeholder.svg"}
                                alt=""
                                className="h-14 w-14 shrink-0 rounded object-cover"
                                onError={(e) => {
                                  ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                                }}
                              />
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-white">{song.title}</p>
                                <p className="truncate text-sm text-gray-400">
                                  Por: {song.artist}
                                  {" · "}
                                  {formatDuration(song.duration)}
                                  {" · "}
                                  {formatShortDate(song.createdAt)}
                                </p>
                                <div className="mt-1 flex flex-wrap gap-2">
                                  <Badge
                                    className={
                                      song.isPublished
                                        ? "bg-green-600 text-white"
                                        : "bg-amber-600 text-white"
                                    }
                                  >
                                    {song.isPublished ? "Publicada" : "Pendiente"}
                                  </Badge>
                                  {!song.hasAudio && (
                                    <Badge className="bg-red-700 text-white">Sin audio</Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {!song.isPublished && (
                                <>
                                  <Button
                                    size="sm"
                                    className="min-h-[44px] flex-1 bg-green-600 hover:bg-green-700 sm:flex-none"
                                    disabled={busySongId === song.id}
                                    onClick={() => void onModerate(song.id, "approve")}
                                  >
                                    Aprobar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="min-h-[44px] flex-1 sm:flex-none"
                                    disabled={busySongId === song.id}
                                    onClick={() => {
                                      if (
                                        window.confirm(
                                          `¿Rechazar y ocultar “${song.title}”?`,
                                        )
                                      ) {
                                        void onModerate(song.id, "reject")
                                      }
                                    }}
                                  >
                                    Rechazar
                                  </Button>
                                </>
                              )}
                              {song.isPublished && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="min-h-[44px] flex-1 border-slate-500 bg-transparent text-white sm:flex-none"
                                  disabled={busySongId === song.id}
                                  onClick={() => void onModerate(song.id, "unpublish")}
                                >
                                  <EyeOff className="mr-1 h-4 w-4" />
                                  Despublicar
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px] border-slate-600 bg-transparent text-white"
                    disabled={analyticsLoading}
                    onClick={() => void loadAnalytics()}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${analyticsLoading ? "animate-spin" : ""}`}
                    />
                    Actualizar analíticas
                  </Button>
                </div>

                {analyticsError && (
                  <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {analyticsError}
                  </p>
                )}

                {analyticsLoading && !analyticsData ? (
                  <p className="py-10 text-center text-slate-400">Cargando analíticas…</p>
                ) : !analyticsData && analyticsError ? (
                  <p className="py-10 text-center text-slate-400">
                    No se pudieron cargar las analíticas. Pulsa Actualizar para reintentar.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Card className="border-slate-700 bg-slate-800">
                        <CardContent className="p-4">
                          <p className="text-xs text-gray-400">Plays hoy</p>
                          <p className="text-2xl font-bold text-green-400">
                            {(analyticsData?.summary.playsToday ?? 0).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-700 bg-slate-800">
                        <CardContent className="p-4">
                          <p className="text-xs text-gray-400">Plays esta semana</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {(analyticsData?.summary.playsThisWeek ?? 0).toLocaleString()}
                          </p>
                          <p
                            className={`text-xs ${
                              (analyticsData?.summary.playsWeekGrowth ?? 0) >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {(analyticsData?.summary.playsWeekGrowth ?? 0) >= 0 ? "+" : ""}
                            {analyticsData?.summary.playsWeekGrowth ?? 0}% vs sem. anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-700 bg-slate-800">
                        <CardContent className="p-4">
                          <p className="text-xs text-gray-400">Activos (7 días)</p>
                          <p className="text-2xl font-bold text-purple-400">
                            {(analyticsData?.summary.activeLast7Days ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Hoy: {(analyticsData?.summary.activeToday ?? 0).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-700 bg-slate-800">
                        <CardContent className="p-4">
                          <p className="text-xs text-gray-400">Nuevos este mes</p>
                          <p className="text-2xl font-bold text-amber-300">
                            {(analyticsData?.summary.newThisMonth ?? 0).toLocaleString()}
                          </p>
                          <p
                            className={`text-xs ${
                              (analyticsData?.summary.monthGrowth ?? 0) >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {(analyticsData?.summary.monthGrowth ?? 0) >= 0 ? "+" : ""}
                            {analyticsData?.summary.monthGrowth ?? 0}% vs mes anterior
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <Card className="border-slate-700 bg-slate-800">
                        <CardHeader>
                          <CardTitle className="text-white">Reproducciones (7 días)</CardTitle>
                          <CardDescription>
                            Plays reales registrados al escuchar canciones
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const series = analyticsData?.playsByDay || []
                            const total = series.reduce((sum, s) => sum + s.value, 0)
                            const max = Math.max(1, ...series.map((s) => s.value))
                            if (series.length === 0) {
                              return (
                                <p className="text-sm text-slate-400">Sin datos de plays aún.</p>
                              )
                            }
                            return (
                              <div className="space-y-3">
                                {total === 0 && (
                                  <p className="text-xs text-slate-500">
                                    Sin reproducciones en los últimos 7 días. Se registran
                                    automáticamente al reproducir canciones del catálogo.
                                  </p>
                                )}
                                {series.map((day) => (
                                  <div key={day.date} className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-400">
                                      <span>{day.label}</span>
                                      <span className="text-white">{day.value.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                                      <div
                                        className="h-full rounded-full bg-green-500"
                                        style={{
                                          width: `${day.value > 0 ? Math.max(4, (day.value / max) * 100) : 0}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between border-t border-slate-600 pt-3 text-sm">
                                  <span className="text-gray-400">Ayer</span>
                                  <span className="text-white">
                                    {(analyticsData?.summary.playsYesterday ?? 0).toLocaleString()}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-400">Total histórico</span>
                                  <span className="text-white">
                                    {(analyticsData?.summary.totalPlays ?? 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )
                          })()}
                        </CardContent>
                      </Card>

                      <Card className="border-slate-700 bg-slate-800">
                        <CardHeader>
                          <CardTitle className="text-white">Altas de usuarios (7 días)</CardTitle>
                          <CardDescription>Registros nuevos por día (Auth)</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {(() => {
                            const series = analyticsData?.signupsByDay || []
                            const total = series.reduce((sum, s) => sum + s.value, 0)
                            const max = Math.max(1, ...series.map((s) => s.value))
                            if (series.length === 0) {
                              return (
                                <p className="text-sm text-slate-400">Sin datos de altas aún.</p>
                              )
                            }
                            return (
                              <div className="space-y-3">
                                {total === 0 && (
                                  <p className="text-xs text-slate-500">
                                    No hubo registros nuevos en los últimos 7 días.
                                  </p>
                                )}
                                {series.map((day) => (
                                  <div key={day.date} className="space-y-1">
                                    <div className="flex justify-between text-xs text-slate-400">
                                      <span>{day.label}</span>
                                      <span className="text-white">{day.value.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                                      <div
                                        className="h-full rounded-full bg-blue-500"
                                        style={{
                                          width: `${day.value > 0 ? Math.max(4, (day.value / max) * 100) : 0}%`,
                                        }}
                                      />
                                    </div>
                                  </div>
                                ))}
                                <div className="flex justify-between border-t border-slate-600 pt-3 text-sm">
                                  <span className="text-gray-400">Total usuarios</span>
                                  <span className="text-white">
                                    {(analyticsData?.summary.totalUsers ?? 0).toLocaleString()}
                                  </span>
                                </div>
                              </div>
                            )
                          })()}
                        </CardContent>
                      </Card>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <Card className="border-slate-700 bg-slate-800">
                        <CardHeader>
                          <CardTitle className="text-white">Distribución por rol</CardTitle>
                          <CardDescription>
                            {(analyticsData?.summary.totalUsers ?? 0).toLocaleString()} usuarios
                            totales
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          {(analyticsData?.roleDistribution || []).length === 0 ? (
                            <p className="text-sm text-slate-400">Sin usuarios para mostrar.</p>
                          ) : (
                            <div className="space-y-3">
                              {(analyticsData?.roleDistribution || []).map((row) => (
                                <div key={row.key} className="space-y-1">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">{row.label}</span>
                                    <span className="text-white">
                                      {row.count} · {row.percent}%
                                    </span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                                    <div
                                      className={`h-full rounded-full ${row.color}`}
                                      style={{
                                        width: `${row.percent > 0 ? Math.max(4, Math.min(100, row.percent)) : 0}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      <Card className="border-slate-700 bg-slate-800">
                        <CardHeader>
                          <CardTitle className="text-white">Salud del catálogo</CardTitle>
                          <CardDescription>Estado de canciones en la base de datos</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Canciones totales</span>
                              <span className="text-white">
                                {analyticsData?.summary.totalSongs ?? 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Publicadas</span>
                              <span className="text-green-300">
                                {analyticsData?.summary.publishedSongs ?? 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Pendientes</span>
                              <span className="text-amber-300">
                                {analyticsData?.summary.pendingSongs ?? 0}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-400">Subidas (7 días)</span>
                              <span className="text-white">
                                {analyticsData?.summary.songsThisWeek ?? 0}
                              </span>
                            </div>
                            <div className="pt-2">
                              <div className="mb-1 flex justify-between text-xs text-slate-400">
                                <span>% publicadas</span>
                                <span>{analyticsData?.summary.publishedRate ?? 0}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                                <div
                                  className="h-full rounded-full bg-emerald-500"
                                  style={{
                                    width: `${Math.max(
                                      0,
                                      Math.min(100, analyticsData?.summary.publishedRate ?? 0),
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-slate-700 bg-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white">Métricas clave</CardTitle>
                        <CardDescription>
                          Calculadas en vivo a partir de usuarios, roles y plays
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-400">
                              {(analyticsData?.summary.monthGrowth ?? 0) >= 0 ? "+" : ""}
                              {analyticsData?.summary.monthGrowth ?? 0}%
                            </p>
                            <p className="text-gray-400">Crecimiento mensual de usuarios</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {analyticsData?.summary.newThisMonth ?? 0} altas este mes
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-400">
                              {analyticsData?.summary.conversionRate ?? 0}%
                            </p>
                            <p className="text-gray-400">Conversión (premium + artistas)</p>
                            <p className="mt-1 text-xs text-slate-500">
                              Sobre {(analyticsData?.summary.totalUsers ?? 0).toLocaleString()}{" "}
                              usuarios
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-400">
                              {analyticsData?.summary.avgPlaysPerUser ?? 0}
                            </p>
                            <p className="text-gray-400">Plays promedio / usuario</p>
                            <p className="mt-1 text-xs text-slate-500">
                              {(analyticsData?.summary.totalPlays ?? 0).toLocaleString()} plays
                              totales
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="playback" className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px] border-slate-600 bg-transparent text-white"
                    disabled={playbackLoading}
                    onClick={() => void loadPlayback()}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${playbackLoading ? "animate-spin" : ""}`}
                    />
                    Actualizar reproducciones
                  </Button>
                </div>

                {playbackError && (
                  <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                    {playbackError}
                  </p>
                )}

                {playbackLoading && !playbackData ? (
                  <p className="py-10 text-center text-slate-400">Cargando reproducciones…</p>
                ) : !playbackData && playbackError ? (
                  <p className="py-10 text-center text-slate-400">
                    No se pudieron cargar las reproducciones. Pulsa Actualizar para reintentar.
                  </p>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      <Card className="border-slate-700 bg-slate-800">
                        <CardContent className="p-4">
                          <p className="text-xs text-gray-400">Total plays</p>
                          <p className="text-2xl font-bold text-blue-400">
                            {(playbackData?.summary.totalPlays ?? 0).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-700 bg-slate-800">
                        <CardContent className="p-4">
                          <p className="text-xs text-gray-400">Hoy</p>
                          <p className="text-2xl font-bold text-green-400">
                            {(playbackData?.summary.playsToday ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Ayer: {(playbackData?.summary.playsYesterday ?? 0).toLocaleString()}
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-700 bg-slate-800">
                        <CardContent className="p-4">
                          <p className="text-xs text-gray-400">Esta semana</p>
                          <p className="text-2xl font-bold text-purple-400">
                            {(playbackData?.summary.playsThisWeek ?? 0).toLocaleString()}
                          </p>
                          <p
                            className={`text-xs ${
                              (playbackData?.summary.playsWeekGrowth ?? 0) >= 0
                                ? "text-green-400"
                                : "text-red-400"
                            }`}
                          >
                            {(playbackData?.summary.playsWeekGrowth ?? 0) >= 0 ? "+" : ""}
                            {playbackData?.summary.playsWeekGrowth ?? 0}% vs sem. anterior
                          </p>
                        </CardContent>
                      </Card>
                      <Card className="border-slate-700 bg-slate-800">
                        <CardContent className="p-4">
                          <p className="text-xs text-gray-400">Canciones únicas</p>
                          <p className="text-2xl font-bold text-amber-300">
                            {(playbackData?.summary.uniqueSongsPlayed ?? 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Promedio: {playbackData?.summary.avgPlaysPerUser ?? 0} / usuario
                          </p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-slate-700 bg-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white">Reproducciones (7 días)</CardTitle>
                        <CardDescription>Volumen diario de plays registrados</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {(() => {
                          const series = playbackData?.playsByDay || []
                          const total = series.reduce((sum, s) => sum + s.value, 0)
                          const max = Math.max(1, ...series.map((s) => s.value))
                          return (
                            <div className="space-y-3">
                              {total === 0 && (
                                <p className="text-xs text-slate-500">
                                  Sin plays en los últimos 7 días. Se registran al escuchar
                                  canciones del catálogo (~5 s).
                                </p>
                              )}
                              {series.map((day) => (
                                <div key={day.date} className="space-y-1">
                                  <div className="flex justify-between text-xs text-slate-400">
                                    <span>{day.label}</span>
                                    <span className="text-white">{day.value.toLocaleString()}</span>
                                  </div>
                                  <div className="h-2 overflow-hidden rounded-full bg-slate-700">
                                    <div
                                      className="h-full rounded-full bg-green-500"
                                      style={{
                                        width: `${day.value > 0 ? Math.max(4, (day.value / max) * 100) : 0}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                      <Card className="border-slate-700 bg-slate-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-white">
                            <Play className="h-5 w-5" />
                            Top Canciones
                          </CardTitle>
                          <CardDescription>Por reproducciones registradas</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {(playbackData?.topSongs || []).length === 0 && (
                              <p className="text-sm text-slate-400">
                                Aún no hay plays registrados.
                              </p>
                            )}
                            {(playbackData?.topSongs || []).map((song, index) => (
                              <div
                                key={song.id}
                                className="flex items-center justify-between gap-3 rounded-lg bg-slate-700 p-3"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="w-7 shrink-0 text-lg font-bold text-gray-400">
                                    #{index + 1}
                                  </span>
                                  <img
                                    src={
                                      song.coverUrl && song.coverUrl.trim() !== ""
                                        ? song.coverUrl
                                        : "/placeholder.svg"
                                    }
                                    alt=""
                                    className="h-10 w-10 shrink-0 rounded object-cover"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate font-semibold text-white">
                                      {song.title}
                                    </p>
                                    <p className="truncate text-sm text-gray-400">{song.artist}</p>
                                  </div>
                                </div>
                                <p className="shrink-0 font-semibold text-white">
                                  {song.plays.toLocaleString()}
                                </p>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-slate-700 bg-slate-800">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-white">
                            <Users className="h-5 w-5" />
                            Top Artistas
                          </CardTitle>
                          <CardDescription>Por reproducciones de sus canciones</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {(playbackData?.topArtists || []).length === 0 && (
                              <p className="text-sm text-slate-400">
                                Aún no hay datos de artistas.
                              </p>
                            )}
                            {(playbackData?.topArtists || []).map((artist, index) => {
                              const maxPlays = Math.max(
                                1,
                                ...(playbackData?.topArtists || []).map((a) => a.totalPlays),
                              )
                              return (
                                <div key={artist.id} className="space-y-2 rounded-lg bg-slate-700 p-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                      <span className="w-7 shrink-0 text-lg font-bold text-gray-400">
                                        #{index + 1}
                                      </span>
                                      <div className="min-w-0">
                                        <p className="truncate font-semibold text-white">
                                          {artist.name}
                                        </p>
                                        <p className="text-sm text-gray-400">
                                          {artist.songs} canciones con plays
                                        </p>
                                      </div>
                                    </div>
                                    <p className="shrink-0 font-semibold text-white">
                                      {artist.totalPlays.toLocaleString()}
                                    </p>
                                  </div>
                                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-600">
                                    <div
                                      className="h-full rounded-full bg-purple-500"
                                      style={{
                                        width: `${Math.max(
                                          4,
                                          (artist.totalPlays / maxPlays) * 100,
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-slate-700 bg-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white">Actividad reciente</CardTitle>
                        <CardDescription>Últimas reproducciones registradas</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {(playbackData?.recentPlays || []).length === 0 && (
                            <p className="text-sm text-slate-400">
                              Todavía no hay actividad de reproducción.
                            </p>
                          )}
                          {(playbackData?.recentPlays || []).map((play) => (
                            <div
                              key={play.id}
                              className="flex items-center justify-between gap-3 rounded-lg bg-slate-700/80 p-3"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <img
                                  src={
                                    play.coverUrl && play.coverUrl.trim() !== ""
                                      ? play.coverUrl
                                      : "/placeholder.svg"
                                  }
                                  alt=""
                                  className="h-10 w-10 shrink-0 rounded object-cover"
                                />
                                <div className="min-w-0">
                                  <p className="truncate font-medium text-white">{play.title}</p>
                                  <p className="truncate text-sm text-gray-400">
                                    {play.artist} · {play.userLabel}
                                  </p>
                                </div>
                              </div>
                              <p className="shrink-0 text-xs text-slate-400">
                                {formatDateTime(play.playedAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-slate-700 bg-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white">Estadísticas de Reproducciones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-blue-400">
                              {(playbackData?.summary.totalPlays ?? 0).toLocaleString()}
                            </p>
                            <p className="text-gray-400">Total</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-green-400">
                              {(playbackData?.summary.playsToday ?? 0).toLocaleString()}
                            </p>
                            <p className="text-gray-400">Hoy</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-bold text-purple-400">
                              {playbackData?.summary.avgPlaysPerUser ?? 0}
                            </p>
                            <p className="text-gray-400">Promedio / usuario</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>

              <TabsContent value="featured" className="space-y-4">
                <Card className="border-slate-700 bg-slate-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Star className="h-5 w-5 text-yellow-400" />
                      Contenido Destacado
                    </CardTitle>
                    <CardDescription>
                      Crea, activa, reordena y elimina anuncios visibles para artistas y
                      usuarios
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FeaturedContentManager
                      autoLoad={false}
                      reloadKey={featuredReloadKey}
                      compact
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-4">
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[44px] border-slate-600 bg-transparent text-white"
                    disabled={settingsLoading || settingsSaving}
                    onClick={() => void loadSettings({ asAdmin: true })}
                  >
                    <RefreshCw
                      className={`mr-2 h-4 w-4 ${settingsLoading ? "animate-spin" : ""}`}
                    />
                    Actualizar
                  </Button>
                </div>

                {(settingsError || settingsSavedMsg) && (
                  <p
                    className={`rounded-md px-3 py-2 text-sm ${
                      settingsError
                        ? "border border-red-500/40 bg-red-500/10 text-red-300"
                        : "border border-green-500/40 bg-green-500/10 text-green-300"
                    }`}
                  >
                    {settingsError || settingsSavedMsg}
                  </p>
                )}

                {settingsLoading ? (
                  <p className="py-10 text-center text-slate-400">Cargando configuración…</p>
                ) : (
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <Card className="border-slate-700 bg-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white">Configuración de Plataforma</CardTitle>
                        <CardDescription>
                          Persistido en Supabase. Afecta registro, subidas y modo
                          mantenimiento.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">Registro de nuevos usuarios</p>
                            <p className="text-sm text-gray-400">
                              Bloquea el formulario de registro si está desactivado
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={togglingKey === "userRegistration" || settingsSaving}
                            className={
                              settings.userRegistration
                                ? "border-green-600 bg-green-600 text-white"
                                : "border-slate-600 bg-transparent text-gray-400"
                            }
                            onClick={() => void onToggleSetting("userRegistration")}
                          >
                            {settings.userRegistration ? "Activado" : "Desactivado"}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">Modo mantenimiento</p>
                            <p className="text-sm text-gray-400">
                              Muestra un aviso global a todos los usuarios
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={togglingKey === "maintenanceMode" || settingsSaving}
                            className={
                              settings.maintenanceMode
                                ? "border-red-600 bg-red-600 text-white"
                                : "border-slate-600 bg-transparent text-gray-400"
                            }
                            onClick={() => void onToggleSetting("maintenanceMode")}
                          >
                            {settings.maintenanceMode ? "Activado" : "Desactivado"}
                          </Button>
                        </div>

                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">Subida de contenido</p>
                            <p className="text-sm text-gray-400">
                              Permite uploads de artistas en /artist/upload
                            </p>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={togglingKey === "contentUpload" || settingsSaving}
                            className={
                              settings.contentUpload
                                ? "border-green-600 bg-green-600 text-white"
                                : "border-slate-600 bg-transparent text-gray-400"
                            }
                            onClick={() => void onToggleSetting("contentUpload")}
                          >
                            {settings.contentUpload ? "Activado" : "Desactivado"}
                          </Button>
                        </div>

                        {settings.updatedAt && (
                          <p className="pt-2 text-xs text-slate-500">
                            Última actualización:{" "}
                            {formatDateTime(settings.updatedAt)}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    <Card className="border-slate-700 bg-slate-800">
                      <CardHeader>
                        <CardTitle className="text-white">Pagos y comisiones</CardTitle>
                        <CardDescription>
                          Valores de referencia en la app. Los cobros reales siguen
                          configurados en Stripe.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <label className="mb-1 block text-sm text-gray-400">
                            Precio Premium (mensual, €)
                          </label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={settings.premiumPrice}
                            onChange={(e) =>
                              updateSettings({
                                premiumPrice: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                            className="min-h-[44px] border-slate-600 bg-slate-900 text-white"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-gray-400">
                            Comisión artista (%)
                          </label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            step={0.1}
                            value={settings.artistCommission}
                            onChange={(e) =>
                              updateSettings({
                                artistCommission: Number.parseFloat(e.target.value) || 0,
                              })
                            }
                            className="min-h-[44px] border-slate-600 bg-slate-900 text-white"
                          />
                        </div>
                        <div className="rounded-md border border-slate-600 bg-slate-900/50 p-3 text-xs text-slate-400">
                          <p>
                            Premium Stripe:{" "}
                            <span className="text-slate-300">env NEXT_PUBLIC_STRIPE_PRICE_PREMIUM</span>
                          </p>
                          <p className="mt-1">
                            Artist Pro Stripe:{" "}
                            <span className="text-slate-300">
                              env NEXT_PUBLIC_STRIPE_PRICE_ARTIST_PRO
                            </span>
                          </p>
                        </div>
                        <Button
                          className="min-h-[44px] w-full bg-blue-600 hover:bg-blue-700"
                          onClick={() => void handleSavePaymentSettings()}
                          disabled={settingsSaving}
                        >
                          {settingsSaving ? "Guardando…" : "Guardar precios"}
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </>
        )}
      </div>
    </AppShell>
  )
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-16 text-center text-slate-300">Cargando panel…</div>
        </AppShell>
      }
    >
      <AdminPageInner />
    </Suspense>
  )
}
