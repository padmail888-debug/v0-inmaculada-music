"use client"

export const revalidate = 0


import type React from "react"
import { FeaturedBanner } from "@/components/featured-content/featured-banner"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { useLikes } from "@/hooks/use-likes"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { getSupabase } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Camera, Lock, User, Music, Crown, Heart, Play } from "lucide-react"
import { AppShell } from "@/components/layout/app-shell"

type ProfileLikedTrack = {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  audioUrl: string
  coverUrl: string
  isPremium: boolean
  likedAt: string
}

export default function ProfilePage() {
  const { user, login } = useAuth()
  const { likedTracks } = useLikes()
  const { playTrack } = useMusicPlayer()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    bio: user?.bio || "",
    artistName: user?.artistName || "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })
  const [securityLoading, setSecurityLoading] = useState(false)
  const [securityError, setSecurityError] = useState<string | null>(null)
  const [securitySuccess, setSecuritySuccess] = useState(false)

  const [likedTracksOrdered, setLikedTracksOrdered] = useState<ProfileLikedTrack[]>([])
  const [likedLoading, setLikedLoading] = useState(false)
  const [likedError, setLikedError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const loadLikedForProfile = async () => {
      if (!user?.id) {
        setLikedTracksOrdered([])
        return
      }
      setLikedLoading(true)
      setLikedError(null)
      try {
        const supabase = getSupabase()
        const { data: favRows, error: favErr } = await supabase
          .from("favorite_songs")
          .select("song_id, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (favErr) {
          if (!cancelled) {
            setLikedError("No se pudieron cargar tus me gusta.")
            setLikedTracksOrdered([])
          }
          return
        }
        if (!favRows?.length) {
          if (!cancelled) setLikedTracksOrdered([])
          return
        }

        const orderedIds = favRows.map((r: { song_id: string }) => r.song_id)
        const { data: songsData, error: songsErr } = await supabase
          .from("songs")
          .select("id, title, duration, cover_image, audio_file_url, artist_id")
          .in("id", orderedIds)

        if (songsErr || !songsData) {
          if (!cancelled) {
            setLikedError("No se pudieron cargar los detalles de las canciones.")
            setLikedTracksOrdered([])
          }
          return
        }

        const artistIds = [
          ...new Set(
            (songsData as { artist_id?: string | null }[])
              .map((s) => s.artist_id)
              .filter((id): id is string => typeof id === "string" && id.length > 0),
          ),
        ]
        const artistNameById = new Map<string, string>()
        if (artistIds.length > 0) {
          const { data: artistRows } = await supabase.from("artists").select("id, artist_name").in("id", artistIds)
          for (const a of artistRows || []) {
            const row = a as { id: string; artist_name?: string | null }
            artistNameById.set(row.id, row.artist_name?.trim() || "Artista")
          }
        }

        const songById = new Map(
          (songsData as {
            id: string
            title?: string
            duration?: number
            cover_image?: string | null
            audio_file_url?: string | null
            artist_id?: string | null
          }[]).map((s) => [s.id, s]),
        )

        const createdAtBySongId = new Map(favRows.map((r: { song_id: string; created_at: string }) => [r.song_id, r.created_at]))

        const list: ProfileLikedTrack[] = []
        for (const id of orderedIds) {
          const s = songById.get(id)
          const url = s?.audio_file_url
          if (!s || !url) continue
          const aid = s.artist_id
          list.push({
            id: s.id,
            title: s.title || "Sin título",
            artist: (aid && artistNameById.get(aid)) || "Artista",
            album: "",
            duration: typeof s.duration === "number" ? s.duration : 0,
            audioUrl: url,
            coverUrl: s.cover_image || "/abstract-soundscape.png",
            isPremium: false,
            likedAt: createdAtBySongId.get(id) || "",
          })
        }

        if (!cancelled) setLikedTracksOrdered(list)
      } catch {
        if (!cancelled) {
          setLikedError("Error al cargar tus me gusta.")
          setLikedTracksOrdered([])
        }
      } finally {
        if (!cancelled) setLikedLoading(false)
      }
    }

    void loadLikedForProfile()
    return () => {
      cancelled = true
    }
  }, [user?.id, likedTracks])

  const likedPreview = useMemo(() => likedTracksOrdered.slice(0, 8), [likedTracksOrdered])

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  if (!user) return null

  const handleSave = () => {
    // Update user data
    const updatedUser = {
      ...user,
      name: formData.name,
      email: formData.email,
      bio: formData.bio,
      artistName: formData.artistName,
    }
    login(updatedUser)
    setIsEditing(false)
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // In a real app, upload to server and get URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const updatedUser = { ...user, avatar: e.target?.result as string }
        login(updatedUser)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setSecurityError(null)
    setSecuritySuccess(false)
    const { currentPassword, newPassword, confirmPassword } = formData
    if (!currentPassword.trim()) {
      setSecurityError("Introduce tu contraseña actual.")
      return
    }
    if (newPassword.length < 6) {
      setSecurityError("La nueva contraseña debe tener al menos 6 caracteres.")
      return
    }
    if (newPassword !== confirmPassword) {
      setSecurityError("La nueva contraseña y la confirmación no coinciden.")
      return
    }
    setSecurityLoading(true)
    try {
      const supabase = getSupabase()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      })
      if (signInError) {
        setSecurityError("Contraseña actual incorrecta.")
        setSecurityLoading(false)
        return
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: newPassword })
      if (updateError) {
        setSecurityError(updateError.message || "No se pudo cambiar la contraseña.")
        setSecurityLoading(false)
        return
      }
      setSecuritySuccess(true)
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }))
    } catch (err) {
      setSecurityError("Ha ocurrido un error. Inténtalo de nuevo.")
    } finally {
      setSecurityLoading(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "artist":
        return <Music className="h-4 w-4" />
      case "premium":
        return <Crown className="h-4 w-4" />
      case "superadmin":
        return <Crown className="h-4 w-4 text-yellow-500" />
      default:
        return <User className="h-4 w-4" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "artist":
        return "bg-purple-500"
      case "premium":
        return "bg-blue-500"
      case "superadmin":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <AppShell>
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl min-w-0">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Mi Perfil</h1>
        <p className="text-gray-400 text-sm sm:text-base">Gestiona tu información personal y configuración de cuenta</p>
      </div>

      <FeaturedBanner showInProfile={true} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 bg-slate-800 border-slate-700">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="h-20 w-20 sm:h-24 sm:w-24">
                  <AvatarImage src={user.avatar || "/placeholder.svg"} />
                  <AvatarFallback className="bg-slate-700 text-white text-xl">
                    {user.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <label className="absolute bottom-0 right-0 bg-blue-600 rounded-full p-2 cursor-pointer hover:bg-blue-700 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation">
                  <Camera className="h-4 w-4 text-white" />
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>

              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">{user.name}</h3>
                <p className="text-gray-400">{user.email}</p>
                <Badge className={`mt-2 ${getRoleColor(user.role)} text-white`}>
                  {getRoleIcon(user.role)}
                  <span className="ml-1 capitalize">{user.role}</span>
                </Badge>
              </div>

              {user.subscription && (
                <div className="w-full p-3 bg-slate-700 rounded-lg">
                  <p className="text-sm text-gray-300">Suscripción</p>
                  <p className="font-semibold text-white capitalize">{user.subscription.plan}</p>
                  <p className="text-xs text-gray-400">Estado: {user.subscription.status}</p>
                </div>
              )}

              <div className="w-full p-3 bg-slate-700/80 rounded-lg border border-slate-600/60">
                <div className="flex items-center gap-2 text-white font-medium">
                  <Heart className="h-4 w-4 text-pink-400 shrink-0" aria-hidden />
                  <span>Me gusta</span>
                </div>
                {likedLoading ? (
                  <p className="text-sm text-gray-400 mt-1">Cargando…</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-white mt-1">{likedTracksOrdered.length}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      Guardados en tu perfil; sirven de apoyo a artistas y base para recomendaciones.
                    </p>
                    <Link
                      href="/liked"
                      className="inline-block mt-2 text-sm text-pink-400 hover:text-pink-300 underline"
                    >
                      Ver biblioteca de me gusta
                    </Link>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Details */}
        <Card className="lg:col-span-2 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Información del Perfil</CardTitle>
            <CardDescription>Actualiza tu información personal y configuración de cuenta</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="general" className="w-full min-w-0">
              <TabsList className="inline-flex w-full sm:w-auto flex-wrap h-auto gap-1 p-1 bg-slate-700">
                <TabsTrigger value="general" className="flex-1 min-w-0 sm:flex-initial">General</TabsTrigger>
                <TabsTrigger value="likes" className="flex-1 min-w-0 sm:flex-initial gap-1">
                  <Heart className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Me gusta
                </TabsTrigger>
                <TabsTrigger value="security" className="flex-1 min-w-0 sm:flex-initial">Seguridad</TabsTrigger>
                {user.role === "artist" && (
                  <TabsTrigger value="artist" className="flex-1 min-w-0 sm:flex-initial">Artista</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="general" className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white">
                      Nombre
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      disabled={!isEditing}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      disabled={!isEditing}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-white">
                    Biografía
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    placeholder="Cuéntanos sobre ti..."
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div className="flex flex-wrap gap-2">
                  {!isEditing ? (
                    <Button type="button" onClick={() => setIsEditing(true)} className="bg-blue-600 hover:bg-blue-700">
                      <User className="h-4 w-4 mr-2" />
                      Editar Perfil
                    </Button>
                  ) : (
                    <>
                      <Button type="button" onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        Guardar Cambios
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="border-slate-600 text-white hover:bg-slate-700"
                      >
                        Cancelar
                      </Button>
                    </>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="likes" className="space-y-4 mt-4">
                <p className="text-sm text-gray-400">
                  Cada me gusta queda vinculado a tu cuenta. Desde aquí ves un resumen; la lista completa y la
                  reproducción están en{" "}
                  <Link href="/liked" className="text-pink-400 hover:text-pink-300 underline">
                    Me gusta
                  </Link>
                  .
                </p>
                {likedError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">{likedError}</p>
                )}
                {likedLoading && <p className="text-gray-400 text-sm">Cargando tus canciones…</p>}
                {!likedLoading && !likedError && likedTracksOrdered.length === 0 && (
                  <p className="text-gray-400 text-sm">
                    Aún no tienes me gusta. Explora el catálogo y pulsa el corazón en una canción para guardarla aquí.
                  </p>
                )}
                {!likedLoading && likedTracksOrdered.length > 0 && (
                  <>
                    <p className="text-sm text-gray-300">
                      Mostrando {likedPreview.length} de {likedTracksOrdered.length} (orden: más recientes primero).
                    </p>
                    <ul className="space-y-2">
                      {likedPreview.map((track) => (
                        <li
                          key={track.id}
                          className="flex items-center gap-3 p-2 rounded-lg bg-slate-700/60 border border-slate-600/50 min-w-0"
                        >
                          <div
                            className="h-10 w-10 rounded bg-slate-600 shrink-0 bg-cover bg-center"
                            style={{ backgroundImage: `url(${track.coverUrl})` }}
                            role="img"
                            aria-label=""
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-medium truncate">{track.title}</p>
                            <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                          </div>
                          <span className="text-xs text-gray-500 shrink-0 tabular-nums">{formatDuration(track.duration)}</span>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="shrink-0 text-white hover:bg-slate-600 min-h-[44px] min-w-[44px]"
                            aria-label={`Reproducir ${track.title}`}
                            onClick={() => playTrack(track, likedTracksOrdered)}
                          >
                            <Play className="h-5 w-5" />
                          </Button>
                        </li>
                      ))}
                    </ul>
                    {likedTracksOrdered.length > likedPreview.length && (
                      <Button asChild variant="outline" className="border-slate-600 text-white hover:bg-slate-700">
                        <Link href="/liked">Ver todas ({likedTracksOrdered.length})</Link>
                      </Button>
                    )}
                    {likedTracksOrdered.length > 0 && likedTracksOrdered.length <= likedPreview.length && (
                      <Link
                        href="/liked"
                        className="inline-flex text-sm text-pink-400 hover:text-pink-300 underline"
                      >
                        Abrir página de me gusta
                      </Link>
                    )}
                  </>
                )}
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                {securitySuccess && (
                  <p className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    Contraseña actualizada correctamente.
                  </p>
                )}
                {securityError && (
                  <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    {securityError}
                  </p>
                )}
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <Label htmlFor="currentPassword" className="text-white">
                      Contraseña Actual
                    </Label>
                    <Input
                      id="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                      className="bg-slate-700 border-slate-600 text-white"
                      autoComplete="current-password"
                      disabled={securityLoading}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="newPassword" className="text-white">
                        Nueva Contraseña
                      </Label>
                      <Input
                        id="newPassword"
                        type="password"
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        autoComplete="new-password"
                        disabled={securityLoading}
                      />
                    </div>
                    <div>
                      <Label htmlFor="confirmPassword" className="text-white">
                        Confirmar Contraseña
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white"
                        autoComplete="new-password"
                        disabled={securityLoading}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="submit"
                      className="bg-red-600 hover:bg-red-700 min-h-[44px]"
                      disabled={securityLoading}
                    >
                      <Lock className="h-4 w-4 mr-2" />
                      {securityLoading ? "Guardando..." : "Cambiar Contraseña"}
                    </Button>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-purple-400 hover:text-purple-300 underline"
                    >
                      Enviar enlace para restablecer contraseña
                    </Link>
                  </div>
                </form>
              </TabsContent>

              {user.role === "artist" && (
                <TabsContent value="artist" className="space-y-4">
                  <div>
                    <Label htmlFor="artistName" className="text-white">
                      Nombre Artístico
                    </Label>
                    <Input
                      id="artistName"
                      value={formData.artistName}
                      onChange={(e) => setFormData({ ...formData, artistName: e.target.value })}
                      disabled={!isEditing}
                      placeholder="Tu nombre como artista"
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div className="p-4 bg-slate-700 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Estadísticas del Artista</h4>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-blue-400">12</p>
                        <p className="text-sm text-gray-400">Canciones</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-400">1.2K</p>
                        <p className="text-sm text-gray-400">Reproducciones</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-400">89</p>
                        <p className="text-sm text-gray-400">Seguidores</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
    </AppShell>
  )
}
