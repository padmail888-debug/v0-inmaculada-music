 "use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Play, Music, Clock, Users, Search } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { getSupabase } from "@/lib/supabase/client"

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

export default function PlaylistsPage() {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")

  useEffect(() => {
    const loadPlaylists = async () => {
      setLoading(true)
      setError(null)
      try {
        const supabase = getSupabase()

        // Fetch playlists the user can see (public or their own) – RLS handles visibility.
        const { data, error } = await supabase
          .from("playlists")
          .select("id, user_id, name, description, cover_image, is_public, created_at")
          .order("created_at", { ascending: false })

        if (error) {
          setError("Error al cargar playlists: " + error.message)
          setPlaylists([])
          return
        }

        const rows = data || []
        const playlistIds = rows.map((p: any) => p.id) as string[]

        // Fetch track counts from playlist_songs
        let countsMap: Record<string, number> = {}
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

        const mapped: Playlist[] = rows.map((p: any) => ({
          id: p.id,
          name: p.name,
          description: p.description || "",
          trackCount: countsMap[p.id] || 0,
          // Duration requires joining songs; for now we show 0m if unknown.
          duration: 0,
          coverUrl: p.cover_image || "/abstract-soundscape.png",
          isPublic: !!p.is_public,
          createdBy: user && p.user_id === user.id ? user.name || "Tú" : "Usuario",
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
    }

    void loadPlaylists()
  }, [user?.id, user?.name])

  const handleCreatePlaylist = async () => {
    if (!user?.id) return
    const name = newName.trim()
    const description = newDescription.trim()
    if (!name) return

    setIsSaving(true)
    setError(null)
    try {
      const supabase = getSupabase()
      const { data, error } = await supabase
        .from("playlists")
        .insert({
          user_id: user.id,
          name,
          description: description || null,
        })
        .select("id, user_id, name, description, cover_image, is_public, created_at")
        .single()

      if (error) {
        setError("Error al crear playlist: " + error.message)
        return
      }

      if (data) {
        const playlist: Playlist = {
          id: data.id,
          name: data.name,
          description: data.description || "",
          trackCount: 0,
          duration: 0,
          coverUrl: data.cover_image || "/abstract-soundscape.png",
          isPublic: !!data.is_public,
          createdBy: user.name || "Tú",
          createdAt: (data.created_at as string)?.slice(0, 10) || "",
        }
        setPlaylists((prev) => [playlist, ...prev])
        setNewName("")
        setNewDescription("")
        setIsCreateOpen(false)
      }
    } catch (err) {
      console.error("Error creating playlist:", err)
      setError("Error al crear playlist.")
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

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Mis Playlists</h1>
          <p className="text-slate-300 text-sm sm:text-base">Organiza tu música como más te guste</p>
        </div>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            disabled={!user}
            onClick={() => setIsCreateOpen((prev) => !prev)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nueva Playlist
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-700 text-red-200 text-sm rounded">
            {error}
          </div>
        )}

        {isCreateOpen && (
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardContent className="p-4 space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-200 mb-1 block">Nombre de la playlist</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Ej: Mis Favoritas"
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-200 mb-1 block">Descripción (opcional)</label>
                <Input
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Describe tu playlist"
                  className="bg-slate-900/50 border-slate-700 text-white"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={isSaving || !newName.trim()}
                  onClick={handleCreatePlaylist}
                >
                  {isSaving ? "Creando..." : "Crear"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="border-slate-600 text-slate-200 hover:bg-slate-800"
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

        {/* Search bar */}
        <div className="relative mb-8">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
          <Input
            placeholder="Buscar en tus playlists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder-slate-400"
          />
        </div>

        {/* Playlists grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-slate-400 mt-4">Cargando playlists...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlaylists.map((playlist) => (
              <Card
                key={playlist.id}
                className="bg-slate-800/50 border-slate-700 backdrop-blur-sm hover:bg-slate-800/70 transition-colors group"
              >
                <CardContent className="p-0">
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <img
                      src={playlist.coverUrl || "/placeholder.svg"}
                      alt={playlist.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button
                        size="lg"
                        className="rounded-full bg-purple-600 hover:bg-purple-700"
                        type="button"
                        // TODO: navigate to playlist detail page when implemented
                        onClick={() => undefined}
                      >
                        <Play className="w-6 h-6" />
                      </Button>
                    </div>
                    {playlist.isPublic && (
                      <Badge className="absolute top-2 right-2 bg-green-600">
                        <Users className="w-3 h-3 mr-1" />
                        Pública
                      </Badge>
                    )}
                  </div>

                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-1">{playlist.name}</h3>
                    <p className="text-slate-400 text-sm mb-3 line-clamp-2">{playlist.description}</p>

                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Music className="w-3 h-3" />
                          {playlist.trackCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
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
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">No se encontraron playlists</h3>
            <p className="text-slate-500">Intenta con otros términos de búsqueda</p>
          </div>
        )}

        {playlists.length === 0 && !searchTerm && !loading && (
          <div className="text-center py-12">
            <Music className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-400 mb-2">Aún no tienes playlists</h3>
            <p className="text-slate-500 mb-4">Crea tu primera playlist para organizar tu música favorita</p>
            <Button
              className="bg-purple-600 hover:bg-purple-700"
              disabled={!user}
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Primera Playlist
            </Button>
          </div>
        )}
      </div>
    </AppShell>
  )
}
