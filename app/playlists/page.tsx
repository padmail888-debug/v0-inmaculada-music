"use client"

import { Suspense, useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Music, Clock, Users, Search, Lock } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { getSupabase } from "@/lib/supabase/client"
import { createPlaylist, playlistDetailHref } from "@/lib/playlists"
import { PlaylistDetailView } from "@/components/playlists/playlist-detail-view"

interface Playlist {
  id: string
  name: string
  description: string
  trackCount: number
  duration: number
  coverUrl: string
  isPublic: boolean
  createdBy: string
  createdAt: string
}

function PlaylistsList() {
  const { user } = useAuth()
  const router = useRouter()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")

  const loadPlaylists = useCallback(async () => {
    if (!user?.id) {
      setPlaylists([])
      return
    }

    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabase()

      const { data, error: loadError } = await supabase
        .from("playlists")
        .select("id, user_id, name, description, cover_image, is_public, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      if (loadError) {
        setError("Error al cargar playlists: " + loadError.message)
        setPlaylists([])
        return
      }

      const rows = data || []
      const playlistIds = rows.map((p) => p.id) as string[]

      const countsMap: Record<string, number> = {}
      if (playlistIds.length > 0) {
        const { data: psData, error: psError } = await supabase
          .from("playlist_songs")
          .select("playlist_id")
          .in("playlist_id", playlistIds)

        if (!psError && psData) {
          psData.forEach((row: { playlist_id: string }) => {
            countsMap[row.playlist_id] = (countsMap[row.playlist_id] || 0) + 1
          })
        }
      }

      const mapped: Playlist[] = rows.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description || "",
        trackCount: countsMap[p.id] || 0,
        duration: 0,
        coverUrl: p.cover_image || "/abstract-soundscape.png",
        isPublic: !!p.is_public,
        createdBy: user.name || "Tú",
        createdAt: (p.created_at as string)?.slice(0, 10) || "",
      }))

      setPlaylists(mapped)
    } catch (err) {
      console.error("Error loading playlists:", err)
      setError("Error al cargar playlists.")
      setPlaylists([])
    } finally {
      setLoading(false)
    }
  }, [user?.id, user?.name])

  useEffect(() => {
    void loadPlaylists()
  }, [loadPlaylists])

  const handleCreatePlaylist = async () => {
    if (!user?.id) return
    const name = newName.trim()
    const description = newDescription.trim()
    if (!name) return

    setIsSaving(true)
    setError(null)
    try {
      const data = await createPlaylist({
        userId: user.id,
        name,
        description: description || null,
        isPublic: false,
      })

      setNewName("")
      setNewDescription("")
      setIsCreateOpen(false)
      router.push(playlistDetailHref(data.id))
    } catch (err) {
      console.error("Error creating playlist:", err)
      setError(err instanceof Error ? err.message : "Error al crear playlist.")
    } finally {
      setIsSaving(false)
    }
  }

  const filteredPlaylists = playlists.filter(
    (playlist) =>
      playlist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      playlist.description.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`
  }

  const openPlaylist = (id: string) => {
    router.push(playlistDetailHref(id))
  }

  return (
    <div className="mx-auto min-w-0 max-w-6xl pb-28">
      <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-white sm:text-4xl">Mis Playlists</h1>
          <p className="text-sm text-slate-300 sm:text-base">
            Organiza tus canciones favoritas y vuelve a ellas cuando quieras
          </p>
        </div>
        <Button
          className="min-h-[44px] bg-purple-600 hover:bg-purple-700"
          disabled={!user}
          onClick={() => setIsCreateOpen((prev) => !prev)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nueva Playlist
        </Button>
      </div>

      {!user && (
        <div className="mb-6 rounded border border-slate-600 bg-slate-800/50 p-4 text-sm text-slate-300">
          Inicia sesión para crear y guardar tus playlists personales.
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {isCreateOpen && (
        <Card className="mb-8 border-slate-700 bg-slate-800/50">
          <CardContent className="space-y-3 p-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Nombre de la playlist
              </label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej: Mis Favoritas"
                autoCapitalize="sentences"
                enterKeyHint="next"
                className="min-h-[48px] touch-manipulation border-slate-700 bg-slate-900/50 text-base text-white"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-200">
                Descripción (opcional)
              </label>
              <Input
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Describe tu playlist"
                enterKeyHint="done"
                className="min-h-[48px] touch-manipulation border-slate-700 bg-slate-900/50 text-base text-white"
              />
            </div>
            <p className="text-xs text-slate-400">
              Las playlists son privadas por defecto. Solo tú puedes verlas y editarlas.
              Después de crearla podrás añadir una imagen desde Editar.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                className="min-h-[48px] touch-manipulation bg-purple-600 hover:bg-purple-700"
                disabled={isSaving || !newName.trim()}
                onClick={() => void handleCreatePlaylist()}
              >
                {isSaving ? "Creando..." : "Crear"}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-[48px] touch-manipulation border-slate-600 text-slate-200 hover:bg-slate-800"
                onClick={() => {
                  setIsCreateOpen(false)
                  setNewName("")
                  setNewDescription("")
                }}
              >
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="relative mb-8">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder="Buscar en tus playlists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="min-h-[44px] border-slate-700 bg-slate-800/50 pl-10 text-white placeholder-slate-400"
        />
      </div>

      {loading ? (
        <div className="py-12 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500" />
          <p className="mt-4 text-slate-400">Cargando playlists...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPlaylists.map((playlist) => (
            <Card
              key={playlist.id}
              className="group cursor-pointer touch-manipulation border-slate-700 bg-slate-800/50 backdrop-blur-sm transition-colors active:bg-slate-800/80 hover:bg-slate-800/70"
              onClick={() => openPlaylist(playlist.id)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden rounded-t-lg">
                  <img
                    src={playlist.coverUrl || "/placeholder.svg"}
                    alt={playlist.name}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                    <Button
                      size="lg"
                      className="min-h-[48px] min-w-[48px] rounded-full bg-purple-600 hover:bg-purple-700"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        openPlaylist(playlist.id)
                      }}
                    >
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                  {playlist.isPublic ? (
                    <Badge className="absolute right-2 top-2 bg-green-600">
                      <Users className="mr-1 h-3 w-3" />
                      Pública
                    </Badge>
                  ) : (
                    <Badge className="absolute right-2 top-2 bg-slate-700">
                      <Lock className="mr-1 h-3 w-3" />
                      Privada
                    </Badge>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="mb-1 font-semibold text-white">{playlist.name}</h3>
                  <p className="mb-3 line-clamp-2 text-sm text-slate-400">{playlist.description}</p>

                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Music className="h-3 w-3" />
                        {playlist.trackCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(playlist.duration)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {filteredPlaylists.length === 0 && searchTerm && (
        <div className="py-12 text-center">
          <Music className="mx-auto mb-4 h-16 w-16 text-slate-600" />
          <h3 className="mb-2 text-xl font-semibold text-slate-400">No se encontraron playlists</h3>
          <p className="text-slate-500">Intenta con otros términos de búsqueda</p>
        </div>
      )}

      {playlists.length === 0 && !searchTerm && !loading && user && (
        <div className="py-12 text-center">
          <Music className="mx-auto mb-4 h-16 w-16 text-slate-600" />
          <h3 className="mb-2 text-xl font-semibold text-slate-400">Aún no tienes playlists</h3>
          <p className="mb-4 px-4 text-slate-500">
            Crea tu primera playlist y añade canciones desde Buscar
          </p>
          <Button
            className="min-h-[44px] bg-purple-600 hover:bg-purple-700"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear Primera Playlist
          </Button>
        </div>
      )}
    </div>
  )
}

function PlaylistsRouter() {
  const searchParams = useSearchParams()
  const playlistId = searchParams.get("id")?.trim() || ""

  if (playlistId) {
    return <PlaylistDetailView playlistId={playlistId} />
  }

  return <PlaylistsList />
}

export default function PlaylistsPage() {
  return (
    <AppShell>
      <Suspense
        fallback={
          <div className="py-16 text-center text-slate-400">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500" />
            <p className="mt-4">Cargando…</p>
          </div>
        }
      >
        <PlaylistsRouter />
      </Suspense>
    </AppShell>
  )
}
