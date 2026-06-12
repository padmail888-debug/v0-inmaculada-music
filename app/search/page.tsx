 "use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, Play, Plus, Clock, Music, User, Album, Filter, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { getSupabase } from "@/lib/supabase/client"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { emitNotificationEvent } from "@/lib/notification-client"

interface SearchResult {
  id: string
  type: "song" | "artist" | "album" | "playlist"
  title: string
  subtitle: string
  coverUrl: string
  duration?: number
  isPremium?: boolean
  trackCount?: number
  genre?: string
  tags?: string[]
  audioUrl?: string
  albumTitle?: string
}

export default function SearchPage() {
  const { user } = useAuth()
  const { playTrack, addToQueue } = useMusicPlayer()
  const [searchTerm, setSearchTerm] = useState("")
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("all")
  const [selectedGenre, setSelectedGenre] = useState<string>("all")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [followedArtistIds, setFollowedArtistIds] = useState<Set<string>>(new Set())

  const genres = ["all", "pop", "rock", "electronic", "jazz", "classical", "hip-hop", "reggaeton", "indie"]
  const availableTags = ["trending", "new-release", "chill", "workout", "party", "romantic", "instrumental", "acoustic"]

  useEffect(() => {
    if (searchTerm.length > 2) {
      void performSearch(searchTerm)
    } else {
      setResults([])
    }
  }, [searchTerm, selectedGenre, selectedTags])

  useEffect(() => {
    async function loadFollowedArtists() {
      if (!user?.id) {
        setFollowedArtistIds(new Set())
        return
      }
      const supabase = getSupabase()
      const { data } = await supabase.from("favorite_artists").select("artist_id").eq("user_id", user.id)
      setFollowedArtistIds(new Set((data || []).map((r: { artist_id: string }) => r.artist_id)))
    }
    void loadFollowedArtists()
  }, [user?.id])

  const performSearch = async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setResults([])
      return
    }

    setLoading(true)
    const supabase = getSupabase()

    try {
      // Search songs by title
      const { data: songRows, error: songsError } = await supabase
        .from("songs")
        .select("id, title, duration, cover_image, audio_file_url, artist_id, album_id")
        .ilike("title", `%${trimmed}%`)
        .order("created_at", { ascending: false })
        .limit(50)

      let songResults: SearchResult[] = []

      if (!songsError && songRows && songRows.length > 0) {
        const artistIdsForSongs = [
          ...new Set(
            songRows
              .map((s) => (s as { artist_id?: string }).artist_id)
              .filter((id): id is string => Boolean(id)),
          ),
        ]

        let artistMap: Record<string, string> = {}
        if (artistIdsForSongs.length > 0) {
          const { data: artistRows } = await supabase
            .from("artists")
            .select("id, artist_name")
            .in("id", artistIdsForSongs)
          artistRows?.forEach((a: { id: string; artist_name?: string }) => {
            artistMap[a.id] = a.artist_name || "Artista"
          })
        }

        songResults = (songRows as any[])
          .filter((s) => s.audio_file_url)
          .map((s) => {
            const row = s as {
              id: string
              title: string
              duration?: number
              cover_image?: string
              audio_file_url?: string
              artist_id?: string
              album_id?: string
            }
            return {
              id: row.id,
              type: "song" as const,
              title: row.title,
              subtitle: artistMap[row.artist_id || ""] || "Artista",
              coverUrl: row.cover_image || "/abstract-soundscape.png",
              duration: row.duration || 0,
              isPremium: false,
              genre: undefined,
              tags: [],
              audioUrl: row.audio_file_url || "",
            }
          })
      }

      // Search artists by name
      const { data: artistRows, error: artistsError } = await supabase
        .from("artists")
        .select("id, artist_name, profile_image, bio")
        .ilike("artist_name", `%${trimmed}%`)
        .order("artist_name", { ascending: true })
        .limit(30)

      let artistResults: SearchResult[] = []
      if (!artistsError && artistRows && artistRows.length > 0) {
        artistResults = artistRows.map(
          (a: { id: string; artist_name?: string; profile_image?: string; bio?: string }) => ({
            id: a.id,
            type: "artist" as const,
            title: a.artist_name || "Artista",
            subtitle: a.bio || "",
            coverUrl: a.profile_image || "/placeholder-user.jpg",
            genre: undefined,
            tags: [],
          }),
        )
      }

      // Apply simple genre / tag filters (will usually be no-op because we don't have those fields yet)
      const allResults = [...songResults, ...artistResults].filter(
        (item) =>
          (selectedGenre === "all" || item.genre === selectedGenre) &&
          (selectedTags.length === 0 || selectedTags.some((tag) => item.tags?.includes(tag))),
      )

      setResults(allResults)
    } catch (err) {
      console.error("Error performing search:", err)
      setResults([])
    } finally {
      setLoading(false)
    }
  }

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]))
  }

  const clearFilters = () => {
    setSelectedGenre("all")
    setSelectedTags([])
  }

  const filteredResults = activeTab === "all" ? results : results.filter((result) => result.type === activeTab)

  const canPlayResult = (result: SearchResult) => {
    if (result.type !== "song" || !result.audioUrl) return false
    if (!result.isPremium) return true
    const role = user?.role
    return role === "premium" || role === "artist" || role === "artist-pro"
  }

  const buildTrackForPlayer = (result: SearchResult) => {
    return {
      id: result.id,
      title: result.title,
      artist: result.subtitle || "Artista",
      album: result.albumTitle || "",
      duration: result.duration || 0,
      audioUrl: result.audioUrl || "",
      coverUrl: result.coverUrl || "/abstract-soundscape.png",
      isPremium: !!result.isPremium,
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "song":
        return <Music className="w-4 h-4" />
      case "artist":
        return <User className="w-4 h-4" />
      case "album":
        return <Album className="w-4 h-4" />
      case "playlist":
        return <Music className="w-4 h-4" />
      default:
        return <Music className="w-4 h-4" />
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const toggleFollowArtist = async (artistId: string) => {
    if (!user?.id) return
    const supabase = getSupabase()
    const isFollowing = followedArtistIds.has(artistId)

    setFollowedArtistIds((prev) => {
      const next = new Set(prev)
      if (isFollowing) next.delete(artistId)
      else next.add(artistId)
      return next
    })

    if (isFollowing) {
      const { error } = await supabase.from("favorite_artists").delete().eq("user_id", user.id).eq("artist_id", artistId)
      if (error) {
        setFollowedArtistIds((prev) => new Set(prev).add(artistId))
      }
      return
    }

    const { error } = await supabase.from("favorite_artists").insert({ user_id: user.id, artist_id: artistId })
    if (error) {
      const code = (error as any).code as string | undefined
      if (code !== "23505") {
        setFollowedArtistIds((prev) => {
          const next = new Set(prev)
          next.delete(artistId)
          return next
        })
      }
    } else {
      void emitNotificationEvent("new_follower", { artistId })
    }
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto min-w-0">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4">Buscar</h1>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <Input
                placeholder="¿Qué quieres escuchar?"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 text-lg bg-slate-800/50 border-slate-700 text-white placeholder-slate-400 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center gap-4 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="bg-slate-800/50 border-slate-700 text-white hover:bg-slate-700"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>

              {(selectedGenre !== "all" || selectedTags.length > 0) && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-400 hover:text-white">
                  <X className="w-4 h-4 mr-2" />
                  Limpiar filtros
                </Button>
              )}
            </div>

            {showFilters && (
              <Card className="bg-slate-800/30 border-slate-700 mb-4">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Género</label>
                      <select
                        value={selectedGenre}
                        onChange={(e) => setSelectedGenre(e.target.value)}
                        className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      >
                        {genres.map((genre) => (
                          <option key={genre} value={genre}>
                            {genre === "all" ? "Todos los géneros" : genre.charAt(0).toUpperCase() + genre.slice(1)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-slate-300 mb-2 block">Etiquetas</label>
                      <div className="flex flex-wrap gap-2">
                        {availableTags.map((tag) => (
                          <Badge
                            key={tag}
                            variant={selectedTags.includes(tag) ? "default" : "outline"}
                            className={`cursor-pointer transition-colors ${
                              selectedTags.includes(tag)
                                ? "bg-purple-600 hover:bg-purple-700"
                                : "border-slate-600 text-slate-300 hover:bg-slate-700"
                            }`}
                            onClick={() => toggleTag(tag)}
                          >
                            {tag.replace("-", " ")}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {searchTerm.length > 2 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="flex w-full overflow-x-auto bg-slate-800/50 border-slate-700 p-1 gap-1 [&>button]:flex-shrink-0 [&>button]:min-h-[40px] sm:grid sm:grid-cols-5 sm:overflow-visible sm:[&>button]:min-h-0">
                <TabsTrigger value="all" className="data-[state=active]:bg-purple-600">
                  Todo
                </TabsTrigger>
                <TabsTrigger value="song" className="data-[state=active]:bg-purple-600">
                  Canciones
                </TabsTrigger>
                <TabsTrigger value="artist" className="data-[state=active]:bg-purple-600">
                  Artistas
                </TabsTrigger>
                <TabsTrigger value="album" className="data-[state=active]:bg-purple-600">
                  Álbumes
                </TabsTrigger>
                <TabsTrigger value="playlist" className="data-[state=active]:bg-purple-600">
                  Playlists
                </TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab} className="mt-6">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
                    <p className="text-slate-400 mt-4">Buscando...</p>
                  </div>
                ) : filteredResults.length > 0 ? (
                  <div className="space-y-2">
                    {filteredResults.map((result) => (
                      <Card
                        key={result.id}
                        className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-colors group"
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                              <img
                                src={result.coverUrl || "/placeholder.svg"}
                                alt={result.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                {getIcon(result.type)}
                                <h3 className="font-medium text-white truncate">{result.title}</h3>
                                {result.isPremium && <Badge className="bg-yellow-600 text-xs">Premium</Badge>}
                              </div>
                              <p className="text-slate-400 text-sm truncate">{result.subtitle}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {result.genre && (
                                  <Badge variant="outline" className="text-xs border-slate-600 text-slate-400">
                                    {result.genre}
                                  </Badge>
                                )}
                                {result.tags?.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="outline"
                                    className="text-xs border-purple-600 text-purple-400"
                                  >
                                    {tag.replace("-", " ")}
                                  </Badge>
                                ))}
                              </div>
                              {result.duration && (
                                <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDuration(result.duration)}
                                </p>
                              )}
                              {result.trackCount && (
                                <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                                  <Music className="w-3 h-3" />
                                  {result.trackCount} canciones
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
                              {result.type === "song" && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-slate-400 hover:text-white"
                                    disabled={!canPlayResult(result)}
                                    onClick={() => {
                                      if (!canPlayResult(result)) return
                                      const track = buildTrackForPlayer(result)
                                      addToQueue(track)
                                    }}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50"
                                    disabled={!canPlayResult(result)}
                                    onClick={() => {
                                      if (!canPlayResult(result)) return
                                      const track = buildTrackForPlayer(result)
                                      playTrack(track)
                                    }}
                                  >
                                    <Play className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {result.type === "artist" && (
                                <Button
                                  size="sm"
                                  variant={followedArtistIds.has(result.id) ? "outline" : "default"}
                                  className={
                                    followedArtistIds.has(result.id)
                                      ? "border-slate-600 text-slate-200"
                                      : "bg-purple-600 hover:bg-purple-700"
                                  }
                                  onClick={() => void toggleFollowArtist(result.id)}
                                >
                                  {followedArtistIds.has(result.id) ? "Siguiendo" : "Seguir"}
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : searchTerm.length > 2 ? (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-slate-400 mb-2">No se encontraron resultados</h3>
                    <p className="text-slate-500">Intenta con otros términos de búsqueda o ajusta los filtros</p>
                  </div>
                ) : null}
              </TabsContent>
            </Tabs>
          )}

          {searchTerm.length <= 2 && (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-400 mb-2">Busca tu música favorita</h3>
              <p className="text-slate-500">Encuentra canciones, artistas, álbumes y playlists</p>
            </div>
          )}
      </div>
    </AppShell>
  )
}
