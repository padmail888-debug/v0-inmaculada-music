"use client"

import type React from "react"
import { FeaturedBanner } from "@/components/featured-content/featured-banner"
import { ArtistShell } from "@/components/layout/artist-shell"

import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Music,
  BarChart3,
  Settings,
  Play,
  Heart,
  Share2,
  Pencil,
  Calendar,
  MapPin,
  Clock,
  Plus,
  Crown,
  Trash2,
} from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useNotificationInboxPreview } from "@/hooks/use-notification-inbox-preview"
import { useRouter } from "next/navigation"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { getSupabase } from "@/lib/supabase/client"

interface ArtistTrack {
  id: string
  title: string
  album?: string
  duration: number
  plays: number
  likes: number
  uploadDate: string
  status: "published" | "pending" | "draft"
  cover_image?: string | null
  audioUrl?: string | null
}

interface Concert {
  id: string
  title: string
  venue: string
  city: string
  date: string
  time: string
  ticket_url?: string
  status: "confirmed" | "cancelled"
}

interface ArtistStats {
  totalPlays: number
  totalLikes: number
  monthlyListeners: number
  totalTracks: number
}

interface ArtistProfile {
  name: string
  bio: string
  location: string
  genres: string[]
  socialLinks: {
    youtube?: string
    soundcloud?: string
    bandcamp?: string
    instagram?: string
    website?: string
  }
}

export default function ArtistProfilePage() {
  const { user, isLoading, setUserRole, refreshUserFromSupabase } = useAuth()
  const router = useRouter()
  const [artistId, setArtistId] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [saveProfileLoading, setSaveProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null)
  const [photoUploading, setPhotoUploading] = useState(false)
  const [concerts, setConcerts] = useState<Concert[]>([])
  const [addConcertLoading, setAddConcertLoading] = useState(false)
  const [showNewConcertForm, setShowNewConcertForm] = useState(false)
  const [newConcert, setNewConcert] = useState<Partial<Concert> & { ticketUrl?: string }>({
    title: "",
    venue: "",
    city: "",
    date: "",
    time: "",
    ticketUrl: "",
  })
  const [tracks, setTracks] = useState<ArtistTrack[]>([])
  const [stats, setStats] = useState<ArtistStats>({
    totalPlays: 0,
    totalLikes: 0,
    monthlyListeners: 0,
    totalTracks: 0,
  })
  const [profile, setProfile] = useState<ArtistProfile>({
    name: "",
    bio: "",
    location: "",
    genres: [],
    socialLinks: {
      youtube: "",
      soundcloud: "",
      bandcamp: "",
      instagram: "",
      website: "",
    },
  })
  const profilePhotoInputRef = useRef<HTMLInputElement>(null)

  const { playTrack } = useMusicPlayer()

  const { liveBanner } = useNotificationInboxPreview(user?.id, "artist-profile")

  const isProArtist = user?.role === "artist-pro"
  const maxSocialLinks = isProArtist ? 5 : 2

  const refetchConcerts = useCallback(async () => {
    if (!artistId) return
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from("concerts")
      .select("id, title, venue, city, date, time, ticket_url, status")
      .eq("artist_id", artistId)
      .order("date", { ascending: true })
    if (!error && data) {
      setConcerts(
        data.map((c) => ({
          id: c.id,
          title: c.title,
          venue: c.venue,
          city: c.city || "",
          date: c.date,
          time: c.time ? String(c.time).slice(0, 5) : "",
          ticket_url: c.ticket_url ?? undefined,
          status: (c.status as "confirmed" | "cancelled") || "confirmed",
        }))
      )
    } else {
      setConcerts([])
    }
  }, [artistId])

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.push("/login")
      return
    }
    const isReturnFromCheckout =
      typeof window !== "undefined" && new URLSearchParams(window.location.search).get("success") === "true"
    if (isReturnFromCheckout) return
    if (user.role !== "artist" && user.role !== "artist-pro" && user.role !== "superadmin") {
      router.push("/dashboard")
      return
    }
  }, [user, isLoading, router])

  // On return from Artist Pro checkout: set role immediately so we don't redirect to dashboard, then sync from server.
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !user?.id) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") !== "true") return
    setUserRole("artist-pro")
  }, [user?.id, setUserRole])

  useEffect(() => {
    if (!user?.id) return
    const isReturnFromCheckout =
      typeof window !== "undefined" && new URLSearchParams(window.location.search).get("success") === "true"
    if (isReturnFromCheckout) {
      const t = setTimeout(() => void refreshUserFromSupabase(), 800)
      return () => clearTimeout(t)
    }
  }, [user?.id, refreshUserFromSupabase])

  useEffect(() => {
    if (!user?.id) return
    const userId = user.id
    const userName = user.name

    const supabase = getSupabase()

    async function load() {
      setProfileLoading(true)
      setProfileError(null)
      try {
        let { data: artist, error: artistErr } = await supabase
          .from("artists")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle()

        if (artistErr) {
          setProfileError("Error al cargar el perfil: " + artistErr.message)
          setProfileLoading(false)
          return
        }

        if (!artist) {
          const { data: created, error: insertErr } = await supabase
            .from("artists")
            .insert({ user_id: userId, artist_name: userName || "Artista" })
            .select("*")
            .single()
          if (insertErr) {
            setProfileError("Error al crear perfil de artista: " + insertErr.message)
            setProfileLoading(false)
            return
          }
          artist = created
        }

        setArtistId(artist.id)
        const artistRow = artist as { artist_name?: string; bio?: string; profile_image?: string; location?: string; social_links?: Record<string, string> }
        const socialLinks = artistRow.social_links || {}
        setProfile({
          name: artistRow.artist_name || "",
          bio: artistRow.bio || "",
          location: artistRow.location || "",
          genres: [],
          socialLinks: {
            youtube: socialLinks.youtube ?? "",
            soundcloud: socialLinks.soundcloud ?? "",
            bandcamp: socialLinks.bandcamp ?? "",
            instagram: socialLinks.instagram ?? "",
            website: socialLinks.website ?? "",
          },
        })
        setProfilePhoto(artistRow.profile_image || null)

        const { data: songsData, error: songsErr } = await supabase
          .from("songs")
          .select("id, title, duration, cover_image, created_at, album_id, audio_file_url")
          .eq("artist_id", artist.id)
          .order("created_at", { ascending: false })

        if (songsErr) {
          setTracks([])
        } else {
          const songIds = (songsData || []).map((s) => s.id)
          const albumIds = [...new Set((songsData || []).map((s) => (s as { album_id?: string }).album_id).filter(Boolean))] as string[]
          let albumMap: Record<string, string> = {}
          if (albumIds.length > 0) {
            try {
              const { data: albumsData } = await supabase.from("albums").select("id, title").in("id", albumIds)
              albumsData?.forEach((a: { id: string; title?: string }) => {
                albumMap[a.id] = a.title || ""
              })
            } catch {
              // albums table may not exist
            }
          }
          let playsMap: Record<string, number> = {}
          let likesMap: Record<string, number> = {}
          if (songIds.length > 0) {
            const { data: playsData } = await supabase.from("plays").select("song_id").in("song_id", songIds)
            playsData?.forEach((p: { song_id: string }) => {
              playsMap[p.song_id] = (playsMap[p.song_id] || 0) + 1
            })
            const { data: favData } = await supabase.from("favorite_songs").select("song_id").in("song_id", songIds)
            favData?.forEach((f: { song_id: string }) => {
              likesMap[f.song_id] = (likesMap[f.song_id] || 0) + 1
            })
          }
          const tracksList: ArtistTrack[] = (songsData || []).map((s) => {
            const row = s as { album_id?: string; created_at?: string; cover_image?: string; audio_file_url?: string }
            const albumId = row.album_id
            return {
              id: s.id,
              title: s.title,
              album: albumId ? albumMap[albumId] : undefined,
              duration: s.duration || 0,
              plays: playsMap[s.id] || 0,
              likes: likesMap[s.id] || 0,
              uploadDate: row.created_at?.slice(0, 10) || "",
              status: "published" as const,
              cover_image: row.cover_image,
              audioUrl: row.audio_file_url || null,
            }
          })
          setTracks(tracksList)

          const totalPlaysSum = tracksList.reduce((sum, t) => sum + t.plays, 0)
          const totalLikesSum = tracksList.reduce((sum, t) => sum + t.likes, 0)
          const publishedCount = tracksList.filter((t) => t.status === "published").length
          setStats({
            totalPlays: totalPlaysSum,
            totalLikes: totalLikesSum,
            monthlyListeners: totalPlaysSum,
            totalTracks: publishedCount,
          })
        }

        const { data: concertsData, error: concertsErr } = await supabase
          .from("concerts")
          .select("id, title, venue, city, date, time, ticket_url, status")
          .eq("artist_id", artist.id)
          .order("date", { ascending: true })

        if (!concertsErr && concertsData) {
          setConcerts(
            concertsData.map((c) => ({
              id: c.id,
              title: c.title,
              venue: c.venue,
              city: c.city || "",
              date: c.date,
              time: c.time ? String(c.time).slice(0, 5) : "",
              ticket_url: c.ticket_url ?? undefined,
              status: (c.status as "confirmed" | "cancelled") || "confirmed",
            }))
          )
        } else if (concertsErr) {
          setConcerts([])
        }
      } catch (e) {
        setProfileError(e instanceof Error ? e.message : "Error al cargar")
      } finally {
        setProfileLoading(false)
      }
    }

    load()
  }, [user?.id])

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M"
    if (num >= 1000) return (num / 1000).toFixed(1) + "K"
    return num.toString()
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-green-600"
      case "pending":
        return "bg-yellow-600"
      case "draft":
        return "bg-gray-600"
      default:
        return "bg-gray-600"
    }
  }

  const handleSaveProfile = async () => {
    if (!artistId) return
    setSaveProfileLoading(true)
    setProfileError(null)
    setProfileSuccess(null)
    const supabase = getSupabase()
    const payload: Record<string, unknown> = {
      artist_name: profile.name,
      bio: profile.bio || null,
    }
    if (profile.location !== undefined) payload.location = profile.location || null
    if (profile.socialLinks !== undefined) payload.social_links = profile.socialLinks
    let { error } = await supabase.from("artists").update(payload).eq("id", artistId)
    if (error && (error.message?.includes("column") || error.message?.includes("does not exist"))) {
      const fallback = { artist_name: profile.name, bio: profile.bio || null }
      const res = await supabase.from("artists").update(fallback).eq("id", artistId)
      error = res.error
    }
    if (error) {
      setProfileError("Error al guardar: " + error.message)
    } else {
      setProfileSuccess("Cambios guardados correctamente.")
      setTimeout(() => setProfileSuccess(null), 4000)
    }
    setSaveProfileLoading(false)
  }

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id || !artistId) return
    setPhotoUploading(true)
    const supabase = getSupabase()
    const path = `avatars/${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
    const { error: uploadErr } = await supabase.storage.from("covers").upload(path, file, {
      contentType: file.type,
      upsert: true,
    })
    if (uploadErr) {
      setProfileError("Error al subir la foto: " + uploadErr.message)
      setPhotoUploading(false)
      return
    }
    const { data: urlData } = supabase.storage.from("covers").getPublicUrl(path)
    const publicUrl = urlData.publicUrl
    const { error: updateErr } = await supabase.from("artists").update({ profile_image: publicUrl }).eq("id", artistId)
    if (updateErr) {
      setProfileError("Error al actualizar la foto: " + updateErr.message)
      setPhotoUploading(false)
      return
    }
    setProfilePhoto(publicUrl)
    setPhotoUploading(false)
    event.target.value = ""
  }

  const handleAddConcert = async () => {
    if (!artistId || !newConcert.title || !newConcert.venue || !newConcert.date || !newConcert.time) return
    setAddConcertLoading(true)
    setProfileError(null)
    const supabase = getSupabase()
    const ticketUrl = (newConcert.ticket_url ?? (newConcert as { ticketUrl?: string }).ticketUrl ?? "").trim() || null
    const { error } = await supabase
      .from("concerts")
      .insert({
        artist_id: artistId,
        title: newConcert.title.trim(),
        venue: newConcert.venue.trim(),
        city: (newConcert.city || "").trim() || null,
        date: newConcert.date,
        time: newConcert.time,
        ticket_url: ticketUrl,
        status: "confirmed",
      })
      .select("id, title, venue, city, date, time, ticket_url, status")
      .single()
    setAddConcertLoading(false)
    if (error) {
      setProfileError("Error al añadir concierto: " + error.message)
      return
    }
    await refetchConcerts()
    setNewConcert({ title: "", venue: "", city: "", date: "", time: "", ticketUrl: "" })
    setShowNewConcertForm(false)
  }

  const generateCalendarLink = (concert: Concert, type: "google" | "ical") => {
    const startDate = new Date(`${concert.date}T${concert.time}`)
    const endDate = new Date(startDate.getTime() + 3 * 60 * 60 * 1000) // 3 hours duration

    const title = encodeURIComponent(concert.title)
    const details = encodeURIComponent(
      `Venue: ${concert.venue}, ${concert.city}\n\nDate: ${concert.date}, Time: ${concert.time}`,
    )
    const location = encodeURIComponent(`${concert.venue}, ${concert.city}`)

    if (type === "google") {
      const startStr = startDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"
      const endStr = endDate.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z"

      return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`
    } else {
      // iCalendar format
      const icalContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MusicStream//Concert//EN
BEGIN:VEVENT
UID:${concert.id}@musicstream.com
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTSTART:${startDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, "").split(".")[0]}Z
SUMMARY:${concert.title}
DESCRIPTION:Venue: ${concert.venue}, ${concert.city}\n\nDate: ${concert.date}, Time: ${concert.time}
LOCATION:${concert.venue}, ${concert.city}
END:VEVENT
END:VCALENDAR`

      const blob = new Blob([icalContent], { type: "text/calendar" })
      return URL.createObjectURL(blob)
    }
  }

  const handleCalendarExport = (concert: Concert, type: "google" | "ical") => {
    const link = generateCalendarLink(concert, type)

    if (type === "google") {
      window.open(link, "_blank")
    } else {
      const a = document.createElement("a")
      a.href = link
      a.download = `${concert.title}.ics`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(link)
    }
  }

  const handleDeleteConcert = async (concertId: string) => {
    if (!artistId) return
    if (!confirm("¿Eliminar este concierto?")) return
    const supabase = getSupabase()
    const { error } = await supabase.from("concerts").delete().eq("id", concertId).eq("artist_id", artistId)
    if (error) {
      setProfileError("Error al eliminar: " + error.message)
      return
    }
    setConcerts((prev) => prev.filter((c) => c.id !== concertId))
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando perfil de artista...</div>
      </div>
    )
  }

  if (user && profileLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Cargando datos del artista...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-white text-xl">Redirigiendo al login...</div>
      </div>
    )
  }

  if (user.role !== "artist" && user.role !== "artist-pro" && user.role !== "superadmin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Acceso Restringido</h2>
          <p className="text-slate-300 mb-4">Esta página es solo para artistas.</p>
          <Button type="button" onClick={() => router.push("/dashboard")} className="bg-purple-600 hover:bg-purple-700 min-h-[44px]">
            Volver al inicio
          </Button>
        </div>
      </div>
    )
  }

  return (
    <ArtistShell>
      {liveBanner && (
        <div className="mb-4 rounded-md border border-purple-400/30 bg-slate-900/95 px-4 py-3">
          <p className="text-sm font-semibold text-white">{liveBanner.title}</p>
          <p className="mt-1 text-xs text-slate-300">{liveBanner.message}</p>
        </div>
      )}

      <div className="max-w-6xl mx-auto min-w-0">
        <FeaturedBanner showInProfile={true} />

        {profileError && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg text-red-200 text-sm">
            {profileError}
          </div>
        )}

        {profileSuccess && (
          <div className="mb-4 p-4 bg-green-900/30 border border-green-500/50 rounded-lg text-green-200 text-sm">
            {profileSuccess}
          </div>
        )}

        {/* Artist Header - clean layout, no overlapping */}
        <header className="rounded-xl overflow-hidden border border-slate-700 bg-slate-800/50 mb-8">
          <div className="h-24 sm:h-28 bg-gradient-to-r from-purple-900 via-blue-900 to-indigo-900" />
          <div className="px-4 sm:px-6 pb-6 pt-4">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              <div className="relative group flex-shrink-0">
                <Avatar className="w-20 h-20 sm:w-24 sm:h-24 border-4 border-slate-800 ring-2 ring-slate-700">
                  <AvatarImage src={profilePhoto || "/placeholder.svg"} alt="Artist" />
                  <AvatarFallback className="bg-slate-700 text-white text-xl">
                    {(profile.name || user.name)?.charAt(0).toUpperCase() || "AR"}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  onClick={() => profilePhotoInputRef.current?.click()}
                  disabled={photoUploading}
                  className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center cursor-pointer touch-manipulation opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ring-2 ring-transparent hover:ring-slate-500 disabled:opacity-50"
                  aria-label="Cambiar foto"
                >
                  <Pencil className="w-5 h-5 text-white" />
                </button>
                <input
                  ref={profilePhotoInputRef}
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="sr-only"
                  tabIndex={-1}
                />
              </div>

              <div className="min-w-0 flex-1">
                <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                  <h1 className="truncate text-2xl font-bold text-white sm:text-3xl">
                    {profile.name || user.name || "Artista"}
                  </h1>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      className={`w-fit ${isProArtist ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" : "bg-slate-600"}`}
                    >
                      {isProArtist ? "Artista Pro" : "Artista Gratuito"}
                    </Badge>
                    {!isProArtist && (
                      <Button
                        type="button"
                        size="sm"
                        className="min-h-[36px] bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
                        onClick={() => router.push("/subscription")}
                      >
                        <Crown className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">Upgrade to Pro</span>
                      </Button>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                    Indie Pop
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                    Acoustic
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300">
                    Folk
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs - fixed spacing below header */}
        <section className="mb-6" aria-label="Secciones del perfil">
        <Tabs defaultValue="music" className="w-full min-w-0">
          <TabsList className="flex w-full overflow-x-auto bg-slate-800/50 border border-slate-700 rounded-lg p-1 gap-1 [&>button]:flex-shrink-0 [&>button]:min-h-[40px]">
            <TabsTrigger value="music" className="data-[state=active]:bg-purple-600">
              <Music className="w-4 h-4 sm:mr-2" />
              Mi Música
            </TabsTrigger>
            <TabsTrigger value="concerts" className="data-[state=active]:bg-purple-600">
              <Calendar className="w-4 h-4 sm:mr-2" />
              Conciertos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-purple-600">
              <BarChart3 className="w-4 h-4 sm:mr-2" />
              Analíticas
            </TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-purple-600">
              <Settings className="w-4 h-4 sm:mr-2" />
              Configuración
            </TabsTrigger>
          </TabsList>

          <TabsContent value="music" className="mt-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                <h3 className="text-xl font-semibold text-white">Canciones Publicadas</h3>
                <Button
                  type="button"
                  onClick={() => router.push("/artist/upload")}
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto min-h-[44px]"
                >
                  <Music className="w-4 h-4 mr-2" />
                  Subir Nueva Canción
                </Button>
              </div>

              {tracks.length === 0 ? (
                <Card className="bg-slate-800/30 border-slate-700">
                  <CardContent className="p-8 text-center">
                    <Music className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                    <h4 className="text-lg font-semibold text-white mb-2">Aún no tienes canciones</h4>
                    <p className="text-slate-400 mb-4">Sube tu primera canción y aparecerá aquí.</p>
                    <Button
                      type="button"
                      onClick={() => router.push("/artist/upload")}
                      className="bg-purple-600 hover:bg-purple-700 min-h-[44px]"
                    >
                      <Music className="w-4 h-4 mr-2" />
                      Subir canción
                    </Button>
                  </CardContent>
                </Card>
              ) : (
              tracks.map((track) => (
                <Card
                  key={track.id}
                  className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-colors"
                >
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="relative flex-shrink-0">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded flex items-center justify-center overflow-hidden">
                            {track.cover_image ? (
                              <img src={track.cover_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Music className="w-6 h-6 text-white" />
                            )}
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            disabled={!track.audioUrl}
                            title={track.audioUrl ? "Reproducir" : "Sin archivo de audio"}
                            className="absolute -top-1 -right-1 bg-green-500 hover:bg-green-600 text-white rounded-full w-7 h-7 p-0 min-w-0 touch-manipulation disabled:opacity-50 disabled:pointer-events-none"
                            onClick={() => {
                              if (!track.audioUrl) return
                              const artistName = profile.name || user?.name || "Artista"
                              const playerTrack = {
                                id: track.id,
                                title: track.title,
                                artist: artistName,
                                album: track.album || "",
                                duration: track.duration,
                                audioUrl: track.audioUrl,
                                coverUrl: track.cover_image || "",
                                isPremium: false,
                              }
                              const playableTracks = tracks
                                .filter((t) => t.audioUrl)
                                .map((t) => ({
                                  id: t.id,
                                  title: t.title,
                                  artist: profile.name || user?.name || "Artista",
                                  album: t.album || "",
                                  duration: t.duration,
                                  audioUrl: t.audioUrl!,
                                  coverUrl: t.cover_image || "",
                                  isPremium: false,
                                }))
                              playTrack(playerTrack, playableTracks)
                            }}
                          >
                            <Play className="h-3 w-3 ml-0.5" />
                          </Button>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-white truncate">{track.title}</h3>
                          <p className="text-slate-400 text-sm">
                            {track.album ? `${track.album} • ` : ""}
                            {formatDuration(track.duration)}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Play className="w-3 h-3 flex-shrink-0" />
                              {formatNumber(track.plays)}
                            </span>
                            <span className="text-slate-500 text-xs flex items-center gap-1">
                              <Heart className="w-3 h-3 flex-shrink-0" />
                              {formatNumber(track.likes)}
                            </span>
                            <span className="text-slate-500 text-xs">
                              Subido: {new Date(track.uploadDate).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge className={getStatusColor(track.status)}>
                          {track.status === "published"
                            ? "Publicado"
                            : track.status === "pending"
                              ? "Pendiente"
                              : "Borrador"}
                        </Badge>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-slate-400 hover:bg-slate-700 min-h-[40px] min-w-[40px]"
                          onClick={() => {
                            const url = typeof window !== "undefined" ? `${window.location.origin}/artist?track=${encodeURIComponent(track.id)}` : ""
                            if (typeof navigator !== "undefined" && navigator.share) {
                              navigator.share({ title: track.title, url }).catch(() => {
                                if (url) navigator.clipboard?.writeText(url)
                              })
                            } else if (url) {
                              navigator.clipboard?.writeText(url).then(() => {})
                            }
                          }}
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
              ) }
            </div>
          </TabsContent>

          <TabsContent value="concerts" className="mt-6">
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <h3 className="text-xl font-semibold text-white">Próximos Conciertos</h3>
                <Button
                  type="button"
                  onClick={() => setShowNewConcertForm(!showNewConcertForm)}
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto min-h-[44px]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir Concierto
                </Button>
              </div>

              {/* New Concert Form */}
              {showNewConcertForm && (
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Nuevo Concierto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="concertTitle" className="text-white">
                          Título del concierto
                        </Label>
                        <Input
                          id="concertTitle"
                          value={newConcert.title || ""}
                          onChange={(e) => setNewConcert((prev) => ({ ...prev, title: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Ej: Nocturnal Vibes Tour"
                        />
                      </div>
                      <div>
                        <Label htmlFor="venue" className="text-white">
                          Venue
                        </Label>
                        <Input
                          id="venue"
                          value={newConcert.venue || ""}
                          onChange={(e) => setNewConcert((prev) => ({ ...prev, venue: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Ej: Sala Apolo"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city" className="text-white">
                          Ciudad
                        </Label>
                        <Input
                          id="city"
                          value={newConcert.city || ""}
                          onChange={(e) => setNewConcert((prev) => ({ ...prev, city: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="Barcelona"
                        />
                      </div>
                      <div>
                        <Label htmlFor="date" className="text-white">
                          Fecha
                        </Label>
                        <Input
                          id="date"
                          type="date"
                          value={newConcert.date || ""}
                          onChange={(e) => setNewConcert((prev) => ({ ...prev, date: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="time" className="text-white">
                          Hora
                        </Label>
                        <Input
                          id="time"
                          type="time"
                          value={newConcert.time || ""}
                          onChange={(e) => setNewConcert((prev) => ({ ...prev, time: e.target.value }))}
                          className="bg-slate-700 border-slate-600 text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="ticketUrl" className="text-white">
                        URL de entradas (opcional)
                      </Label>
                      <Input
                        id="ticketUrl"
                        value={newConcert.ticketUrl || ""}
                        onChange={(e) => setNewConcert((prev) => ({ ...prev, ticketUrl: e.target.value }))}
                        className="bg-slate-700 border-slate-600 text-white"
                        placeholder="https://tickets.example.com"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={handleAddConcert}
                        disabled={addConcertLoading}
                        className="bg-green-600 hover:bg-green-700 min-h-[44px] disabled:opacity-70"
                      >
                        {addConcertLoading ? "Guardando…" : "Guardar Concierto"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowNewConcertForm(false)}
                        className="border-slate-600 text-white hover:bg-slate-700 min-h-[44px]"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Concerts List */}
              <div className="space-y-4">
                {concerts.map((concert) => (
                  <Card
                    key={concert.id}
                    className="bg-slate-800/30 border-slate-700 hover:bg-slate-800/50 transition-colors"
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg sm:text-xl font-semibold text-white mb-2">{concert.title}</h4>

                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300 mb-3">
                            <div className="flex items-center gap-1">
                              <MapPin className="w-4 h-4 flex-shrink-0" />
                              <span>
                                {concert.city ? `${concert.venue}, ${concert.city}` : concert.venue}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>
                                {new Date(concert.date).toLocaleDateString()} - {concert.time}
                              </span>
                            </div>
                          </div>

                          {concert.ticket_url && (
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => window.open(concert.ticket_url, "_blank")}
                              className="bg-green-600 hover:bg-green-700 min-h-[36px] mt-2"
                            >
                              Comprar Entradas
                            </Button>
                          )}
                          <div className="flex flex-wrap gap-2 mt-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 min-h-[32px]"
                              onClick={() => handleCalendarExport(concert, "google")}
                            >
                              Google Calendar
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="border-slate-600 text-slate-300 hover:bg-slate-700 min-h-[32px]"
                              onClick={() => handleCalendarExport(concert, "ical")}
                            >
                              .ics
                            </Button>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                          <Badge className={`flex-shrink-0 w-fit ${concert.status === "confirmed" ? "bg-green-600" : "bg-gray-600"}`}>
                            {concert.status === "confirmed" ? "Confirmado" : "Cancelado"}
                          </Badge>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/20 min-h-[36px]"
                            onClick={() => handleDeleteConcert(concert.id)}
                            aria-label="Eliminar concierto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {concerts.length === 0 && (
                  <Card className="bg-slate-800/30 border-slate-700">
                    <CardContent className="p-8 text-center">
                      <Calendar className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                      <h4 className="text-lg font-semibold text-white mb-2">No hay conciertos programados</h4>
                      <p className="text-slate-400 mb-4">
                        Añade tu primer concierto para que tus fans puedan seguir tus presentaciones.
                      </p>
                      <Button
                        type="button"
                        onClick={() => setShowNewConcertForm(true)}
                        className="bg-purple-600 hover:bg-purple-700 min-h-[44px]"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir Primer Concierto
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Reproducciones por mes</CardTitle>
                  <CardDescription className="text-slate-400">Resumen de estadísticas</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-xl font-bold text-white">{formatNumber(stats.totalPlays)}</p>
                      <p className="text-xs text-slate-400">Reproducciones totales</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-xl font-bold text-white">{formatNumber(stats.totalLikes)}</p>
                      <p className="text-xs text-slate-400">Me gusta</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-xl font-bold text-white">{stats.totalTracks}</p>
                      <p className="text-xs text-slate-400">Canciones</p>
                    </div>
                    <div className="p-3 bg-slate-700/50 rounded-lg">
                      <p className="text-xl font-bold text-white">{formatNumber(stats.monthlyListeners)}</p>
                      <p className="text-xs text-slate-400">Oyentes (aprox.)</p>
                    </div>
                  </div>
                  <div className="h-32 flex items-center justify-center text-slate-500 text-sm border border-slate-700 rounded-lg border-dashed">
                    Gráfico de reproducciones (próximamente)
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Top países</CardTitle>
                  <CardDescription className="text-slate-400">Por ubicación de oyentes</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 flex items-center justify-center text-slate-500 text-sm border border-slate-700 rounded-lg border-dashed">
                    Top países (próximamente)
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <div className="space-y-6">
              {/* Artist Tier Information Card */}
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    Plan de Artista
                    <Badge
                      className={
                        isProArtist ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-white" : "bg-slate-600"
                      }
                    >
                      {isProArtist ? "Pro" : "Gratuito"}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {isProArtist
                      ? "Tienes acceso a todas las funciones premium para artistas"
                      : "Actualiza a Artista Pro para desbloquear más funciones"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-white mb-3">Artista Gratuito</h4>
                      <ul className="space-y-2 text-sm text-slate-300">
                        <li>• Subir hasta 10 canciones</li>
                        <li>• 2 enlaces sociales</li>
                        <li>• Analíticas básicas</li>
                        <li>• 70% de ingresos por ventas</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-white mb-3">Artista Pro</h4>
                      <ul className="space-y-2 text-sm text-slate-300">
                        <li>• Canciones ilimitadas</li>
                        <li>• 5 enlaces sociales</li>
                        <li>• Analíticas avanzadas</li>
                        <li>• 85% de ingresos por ventas</li>
                        <li>• Destacado en portada</li>
                        <li>• Promoción prioritaria</li>
                      </ul>
                    </div>
                  </div>
                  {!isProArtist && (
                    <Button
                      type="button"
                      className="mt-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 min-h-[44px]"
                      onClick={() => router.push("/subscription")}
                    >
                      Actualizar a Artista Pro
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Configuración del perfil</CardTitle>
                  <CardDescription className="text-slate-400">Actualiza tu información de artista</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="artistName" className="text-white">
                      Nombre artístico
                    </Label>
                    <Input
                      id="artistName"
                      value={profile.name}
                      onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  <div>
                    <Label htmlFor="bio" className="text-white">
                      Biografía
                    </Label>
                    <Textarea
                      id="bio"
                      value={profile.bio}
                      onChange={(e) => setProfile((prev) => ({ ...prev, bio: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label htmlFor="location" className="text-white">
                      Ubicación
                    </Label>
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile((prev) => ({ ...prev, location: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white"
                    />
                  </div>

                  {/* Social Media Links Configuration */}
                  <div>
                    <Label className="text-white text-base font-semibold">
                      Enlaces Sociales ({Object.values(profile.socialLinks || {}).filter(Boolean).length}/
                      {maxSocialLinks})
                    </Label>
                    <p className="text-sm text-slate-400 mb-4">
                      {isProArtist
                        ? "Como Artista Pro puedes agregar hasta 5 enlaces sociales"
                        : "Como Artista Gratuito puedes agregar hasta 2 enlaces sociales. Actualiza a Pro para más."}
                    </p>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="youtube" className="text-white">
                          YouTube
                        </Label>
                        <Input
                          id="youtube"
                          value={profile.socialLinks?.youtube || ""}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              socialLinks: { ...prev.socialLinks, youtube: e.target.value },
                            }))
                          }
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="https://youtube.com/@tucanal"
                          disabled={
                            !isProArtist &&
                            Object.values(profile.socialLinks || {}).filter(Boolean).length >= maxSocialLinks &&
                            !profile.socialLinks?.youtube
                          }
                        />
                      </div>

                      <div>
                        <Label htmlFor="soundcloud" className="text-white">
                          SoundCloud
                        </Label>
                        <Input
                          id="soundcloud"
                          value={profile.socialLinks?.soundcloud || ""}
                          onChange={(e) =>
                            setProfile((prev) => ({
                              ...prev,
                              socialLinks: { ...prev.socialLinks, soundcloud: e.target.value },
                            }))
                          }
                          className="bg-slate-700 border-slate-600 text-white"
                          placeholder="https://soundcloud.com/tuartista"
                          disabled={
                            !isProArtist &&
                            Object.values(profile.socialLinks || {}).filter(Boolean).length >= maxSocialLinks &&
                            !profile.socialLinks?.soundcloud
                          }
                        />
                      </div>

                      {isProArtist && (
                        <>
                          <div>
                            <Label htmlFor="bandcamp" className="text-white">
                              Bandcamp
                            </Label>
                            <Input
                              id="bandcamp"
                              value={profile.socialLinks?.bandcamp || ""}
                              onChange={(e) =>
                                setProfile((prev) => ({
                                  ...prev,
                                  socialLinks: { ...prev.socialLinks, bandcamp: e.target.value },
                                }))
                              }
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="https://tuartista.bandcamp.com"
                            />
                          </div>

                          <div>
                            <Label htmlFor="instagram" className="text-white">
                              Instagram
                            </Label>
                            <Input
                              id="instagram"
                              value={profile.socialLinks?.instagram || ""}
                              onChange={(e) =>
                                setProfile((prev) => ({
                                  ...prev,
                                  socialLinks: { ...prev.socialLinks, instagram: e.target.value },
                                }))
                              }
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="https://instagram.com/tuartista"
                            />
                          </div>

                          <div>
                            <Label htmlFor="website" className="text-white">
                              Website Personal
                            </Label>
                            <Input
                              id="website"
                              value={profile.socialLinks?.website || ""}
                              onChange={(e) =>
                                setProfile((prev) => ({
                                  ...prev,
                                  socialLinks: { ...prev.socialLinks, website: e.target.value },
                                }))
                              }
                              className="bg-slate-700 border-slate-600 text-white"
                              placeholder="https://tuwebsite.com"
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <Button
                    type="button"
                    className="bg-purple-600 hover:bg-purple-700 min-h-[44px]"
                    onClick={handleSaveProfile}
                    disabled={saveProfileLoading}
                  >
                    {saveProfileLoading ? "Guardando…" : "Guardar cambios"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
        </section>
      </div>
    </ArtistShell>
  )
}
