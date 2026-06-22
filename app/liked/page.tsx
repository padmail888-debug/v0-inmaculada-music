 "use client"

export const revalidate = 0


import type React from "react"

import { useEffect, useState, useMemo } from "react"
import { Heart, Play, MoreHorizontal, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useLikes } from "@/hooks/use-likes"
import { getSupabase } from "@/lib/supabase/client"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"

interface LikedSong {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  audioUrl: string
  coverUrl: string
  isPremium: boolean
  likedAt?: string
}

export default function LikedSongsPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const { playTrack, addToQueue } = useMusicPlayer()
  const { likedTracks, toggleLike } = useLikes()
  const { user } = useAuth()
  const [likedSongs, setLikedSongs] = useState<LikedSong[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadLikedSongs = async () => {
      if (!user?.id) {
        setLikedSongs([])
        return
      }

      const likedIds = Array.from(likedTracks)
      if (likedIds.length === 0) {
        setLikedSongs([])
        return
      }

      setLoading(true)
      setError(null)
      try {
        const supabase = getSupabase()
        const { data: songsData, error: songsError } = await supabase
          .from("songs")
          .select("id, title, duration, cover_image, audio_file_url")
          .in("id", likedIds)

        if (songsError) {
          setError("Error al cargar canciones que te gustan: " + songsError.message)
          setLikedSongs([])
          return
        }

        const mapped: LikedSong[] =
          songsData?.map((s: any) => ({
            id: s.id,
            title: s.title,
            artist: "Artista", // optional: can be resolved via artists table later
            album: "",
            duration: s.duration || 0,
            audioUrl: s.audio_file_url || "",
            coverUrl: s.cover_image || "/abstract-soundscape.png",
            isPremium: false,
          })) || []

        // Preserve order roughly by likedIds
        const ordered = likedIds
          .map((id) => mapped.find((m) => m.id === id))
          .filter((m): m is LikedSong => !!m && !!m.audioUrl)

        setLikedSongs(ordered)
      } catch (err) {
        console.error("Error loading liked songs:", err)
        setError("Error al cargar canciones que te gustan.")
        setLikedSongs([])
      } finally {
        setLoading(false)
      }
    }

    void loadLikedSongs()
  }, [user?.id, likedTracks])

  const filteredSongs = likedSongs.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handlePlay = (song: any) => {
    playTrack(song, likedSongs)
  }

  const handleUnlike = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user?.id) return

    // Optimistic update
    toggleLike(trackId)
    try {
      const supabase = getSupabase()
      const { error: deleteError } = await supabase
        .from("favorite_songs")
        .delete()
        .eq("user_id", user.id)
        .eq("song_id", trackId)

      if (deleteError) {
        // Roll back optimistic change on error
        toggleLike(trackId)
        setError("Error al quitar de favoritas: " + deleteError.message)
        console.error("Error removing favorite:", deleteError.message)
      }
    } catch (err) {
      toggleLike(trackId)
      setError("Error al quitar de favoritas.")
      console.error("Error removing favorite:", err)
    }
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto min-w-0">
        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-700 text-red-200 text-sm rounded">
            {error}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 mb-6 sm:mb-8">
          <div className="w-36 h-36 sm:w-48 sm:h-48 md:w-60 md:h-60 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center shrink-0">
            <Heart className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 text-white" />
          </div>

          <div className="flex-1 min-w-0 text-center sm:text-left">
            <Badge className="bg-white/10 text-white mb-2">Playlist</Badge>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white mb-4">Canciones que te gustan</h1>
            <p className="text-gray-300 mb-4">{likedSongs.length} canciones</p>

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
              <Button
                size="lg"
                className="bg-green-500 hover:bg-green-600 text-white rounded-full w-14 h-14"
                onClick={() => likedSongs.length > 0 && handlePlay(likedSongs[0])}
                disabled={likedSongs.length === 0}
              >
                <Play className="h-6 w-6 ml-1" />
              </Button>
              <Button variant="ghost" size="lg" className="text-white hover:bg-white/10">
                <Download className="h-5 w-5 mr-2" />
                Descargar
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <Input
            placeholder="Buscar en canciones que te gustan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md bg-white/10 border-white/20 text-white placeholder:text-gray-400"
          />
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Cargando canciones que te gustan...</p>
            </div>
          ) : (
            filteredSongs.map((song, index) => (
              <Card key={song.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  <div className="w-12 text-center">
                    <span className="text-gray-400 text-sm">{index + 1}</span>
                  </div>

                  <img
                    src={song.coverUrl || "/placeholder.svg"}
                    alt={song.album || song.title}
                    className="w-12 h-12 rounded object-cover"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg?key=liked"
                    }}
                  />

                  <div className="flex-1 min-w-0 basis-[50%] sm:basis-auto">
                    <h3 className="text-white font-medium">{song.title}</h3>
                    <p className="text-gray-400 text-sm">{song.artist}</p>
                  </div>

                  <div className="hidden md:block text-gray-400 text-sm">{song.album}</div>

                  <div className="text-gray-400 text-sm">{formatDuration(song.duration)}</div>

                  <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-green-500 hover:bg-white/10"
                      onClick={(e) => handleUnlike(song.id, e)}
                    >
                      <Heart className="h-4 w-4 fill-current" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                      onClick={() => handlePlay(song)}
                      disabled={!song.audioUrl}
                    >
                      <Play className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        addToQueue(song)
                      }}
                      disabled={!song.audioUrl}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {filteredSongs.length === 0 && !loading && (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {searchTerm ? "No se encontraron canciones" : "No tienes canciones que te gusten"}
            </h3>
            <p className="text-gray-400">
              {searchTerm
                ? "Intenta con otros términos de búsqueda"
                : "Empieza a dar me gusta a las canciones que más te gusten"}
            </p>
          </div>
        )}
      </div>
    </AppShell>
  )
}
