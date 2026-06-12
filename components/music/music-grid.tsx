"use client"

import type React from "react"
import { useState } from "react"

import { Play, Lock, Heart, MoreHorizontal, Plus, Cast, Bluetooth, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { useLikes } from "@/hooks/use-likes"
import { useAuth } from "@/hooks/use-auth"
import { getSupabase } from "@/lib/supabase/client"
import { emitNotificationEvent } from "@/lib/notification-client"

interface Track {
  id: string
  title: string
  artist: string
  artistId?: string
  album: string
  duration: number
  audioUrl: string
  coverUrl: string
  isPremium: boolean
}

interface MusicGridProps {
  tracks: Track[]
  userRole: "free" | "premium" | "artist" | "artist-pro"
}

export function MusicGrid({ tracks, userRole }: MusicGridProps) {
  const { playTrack, addToQueue, currentTrack, isPlaying } = useMusicPlayer()
  const { toggleLike, isLiked } = useLikes()
  const { user } = useAuth()
  const [searchingDevices, setSearchingDevices] = useState(false)

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const canPlayTrack = (track: Track) => {
    return !track.isPremium || userRole === "premium" || userRole === "artist" || userRole === "artist-pro"
  }

  const handleTrackSelect = (track: Track) => {
    if (!canPlayTrack(track)) return

    // Play track with full tracks list as playlist
    playTrack(
      track,
      tracks.filter((t) => canPlayTrack(t)),
    )
  }

  const handleAddToQueue = (track: Track, e: React.MouseEvent) => {
    e.stopPropagation()
    if (canPlayTrack(track)) {
      addToQueue(track)
    }
  }

  const handleLike = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user?.id) return

    const supabase = getSupabase()
    const currentlyLiked = isLiked(trackId)

    // Optimistic UI update
    toggleLike(trackId)

    if (!currentlyLiked) {
      // Add favorite
      const { error } = await supabase.from("favorite_songs").insert({
        user_id: user.id,
        song_id: trackId,
      })
      if (error) {
        // If it's a duplicate (row already exists), keep UI as liked and ignore
        const code = (error as any).code as string | undefined
        if (!code && !error.message.includes("favorite_songs_user_song_key") && !error.message.includes("duplicate")) {
          toggleLike(trackId)
        } else if (code && code !== "23505") {
          toggleLike(trackId)
        }
        console.error("Error adding favorite:", error.message)
      } else {
        const likedTrack = tracks.find((t) => t.id === trackId)
        void emitNotificationEvent("song_liked", {
          songId: trackId,
          songTitle: likedTrack?.title ?? "Tu canción",
        })
      }
    } else {
      // Remove favorite
      const { error } = await supabase
        .from("favorite_songs")
        .delete()
        .eq("user_id", user.id)
        .eq("song_id", trackId)
      if (error) {
        toggleLike(trackId)
        console.error("Error removing favorite:", error.message)
      }
    }
  }

  const handleSearchDevices = () => {
    setSearchingDevices(true)
    // Simulate device search
    setTimeout(() => {
      setSearchingDevices(false)
    }, 2000)
  }

  const handleArtistClick = (artistId: string | undefined, e: React.MouseEvent) => {
    e.stopPropagation()
    if (artistId) {
      window.open(`/artist/profile?id=${artistId}`, "_blank")
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-2xl font-bold mb-4">Música Popular</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {tracks.map((track) => (
            <Card
              key={track.id}
              className="bg-slate-800/50 backdrop-blur-sm border-slate-700 hover:bg-slate-800/70 transition-all duration-300 group cursor-pointer"
              onClick={() => handleTrackSelect(track)}
            >
              <div className="p-4">
                <div className="relative mb-4">
                  <img
                    src={track.coverUrl || "/abstract-soundscape.png"}
                    alt={`${track.album} cover`}
                    className="w-full aspect-square object-cover rounded-lg"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/abstract-soundscape.png"
                    }}
                  />

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg flex items-center justify-center">
                    {canPlayTrack(track) ? (
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full w-12 h-12"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTrackSelect(track)
                          }}
                        >
                          <Play className="h-5 w-5 ml-1" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => e.stopPropagation()}
                              className="bg-black/60 hover:bg-black/80 text-white rounded-full w-10 h-10"
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700">
                            <DropdownMenuItem
                              onClick={(e) => handleAddToQueue(track, e)}
                              className="text-white hover:bg-slate-700"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Añadir a la cola de reproducción
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => handleLike(track.id, e)}
                              className="text-white hover:bg-slate-700"
                            >
                              <Heart
                                className={`mr-2 h-4 w-4 ${isLiked(track.id) ? "fill-current text-green-500" : ""}`}
                              />
                              {isLiked(track.id) ? "Quitar de favoritas" : "Añadir a Canciones que te gustan"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger className="text-white hover:bg-slate-700">
                                <Cast className="mr-2 h-4 w-4" />
                                Reproducir en otros dispositivos
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem
                                  onClick={handleSearchDevices}
                                  className="text-white hover:bg-slate-700"
                                >
                                  <Bluetooth className="mr-2 h-4 w-4" />
                                  {searchingDevices ? "Buscando..." : "Buscar dispositivos Bluetooth"}
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-slate-700">
                                  <Cast className="mr-2 h-4 w-4" />
                                  Chromecast
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-white hover:bg-slate-700">
                                  <Smartphone className="mr-2 h-4 w-4" />
                                  Otros dispositivos
                                </DropdownMenuItem>
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    ) : (
                      <div className="bg-black/60 rounded-full p-3">
                        <Lock className="h-6 w-6 text-white" />
                      </div>
                    )}
                  </div>

                  {track.isPremium && (
                    <div className="absolute top-2 right-2 bg-yellow-500 text-black text-xs px-2 py-1 rounded-full font-semibold">
                      Premium
                    </div>
                  )}

                  {currentTrack?.id === track.id && (
                    <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full font-semibold flex items-center space-x-1">
                      <div className={`w-2 h-2 bg-white rounded-full ${isPlaying ? "animate-pulse" : ""}`} />
                      <span>Reproduciendo</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <h3 className="font-semibold text-white truncate">{track.title}</h3>
                  <p
                    className="text-sm text-slate-300 truncate hover:text-white cursor-pointer transition-colors"
                    onClick={(e) => handleArtistClick(track.artistId, e)}
                  >
                    {track.artist}
                  </p>
                  <p className="text-xs text-slate-400 truncate">{track.album}</p>

                  <div className="flex items-center justify-between pt-2">
                    <span className="text-xs text-slate-400">{formatDuration(track.duration)}</span>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleLike(track.id, e)}
                      className={`${isLiked(track.id) ? "text-green-500 hover:text-green-400" : "text-slate-400 hover:text-white"} hover:bg-white/10 transition-colors`}
                    >
                      <Heart className={`h-4 w-4 ${isLiked(track.id) ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </div>
  )
}
