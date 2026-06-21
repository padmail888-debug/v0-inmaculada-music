 "use client"

import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { MusicGrid } from "@/components/music/music-grid"
import { FeaturedCarousel } from "@/components/featured-content/featured-carousel"
import { useEffect, useLayoutEffect, useState, Suspense } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase/client"
import { DashboardSuccessBanner } from "./dashboard-success-banner"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  audioUrl: string
  coverUrl: string
  isPremium: boolean
}

export default function DashboardPage() {
  const { user, isLoading, setUserRole, refreshUserFromSupabase } = useAuth()
  const router = useRouter()
  const [tracks, setTracks] = useState<Track[]>([])

  // On return from checkout: set role from plan (premium | artist-pro). Only Artist Pro redirects to /artist/profile.
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !user?.id) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") !== "true") return
    const planParam = params.get("plan")
    const plan = planParam === "artist-pro" ? "artist-pro" : "premium"
    setUserRole(plan)
    if (plan === "artist-pro") {
      router.replace("/artist/profile?success=true")
    }
  }, [user?.id, setUserRole, router])

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
      return
    }
    if (!isLoading && user && (user.role === "artist" || user.role === "artist-pro")) {
      router.replace("/artist/profile")
    }
  }, [isLoading, user, router])

  // Sync role from server. After checkout (success=true), short delay so webhook has time to update Supabase.
  useEffect(() => {
    if (!user?.id) return
    const isReturnFromCheckout =
      typeof window !== "undefined" && new URLSearchParams(window.location.search).get("success") === "true"
    const delayMs = isReturnFromCheckout ? 800 : 400
    const t = setTimeout(() => void refreshUserFromSupabase(), delayMs)
    return () => clearTimeout(t)
  }, [user?.id, refreshUserFromSupabase])

  useEffect(() => {
    const supabase = getSupabase()
    supabase
      .from("songs")
      .select("id, title, duration, cover_image, audio_file_url, artist_id, album_id")
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data: songsData, error }) => {
        if (error || !songsData?.length) {
          setTracks([])
          return
        }
        const artistIds = [...new Set(songsData.map((s) => s.artist_id))]
        supabase
          .from("artists")
          .select("id, artist_name")
          .in("id", artistIds)
          .then(({ data: artistsData }) => {
            const artistMap: Record<string, string> = {}
            artistsData?.forEach((a: { id: string; artist_name?: string }) => {
              artistMap[a.id] = a.artist_name || "Artista"
            })
            const albumIds = [...new Set(songsData.map((s) => (s as { album_id?: string }).album_id).filter(Boolean))] as string[]
            const loadTracks = (albums: Record<string, string>) => {
              const list: Track[] = songsData.map((s) => {
                const row = s as { album_id?: string; cover_image?: string; audio_file_url?: string }
                const albumId = row.album_id
                return {
                  id: s.id,
                  title: s.title,
                  artist: artistMap[s.artist_id] || "Artista",
                  album: albumId ? albums[albumId] || "" : "",
                  duration: s.duration || 0,
                  audioUrl: row.audio_file_url || "",
                  coverUrl: row.cover_image || "",
                  isPremium: false,
                }
              })
              const withAudio = list.filter((t) => t.audioUrl)
              setTracks(withAudio)
            }
            if (albumIds.length > 0) {
              supabase.from("albums").select("id, title").in("id", albumIds).then(({ data: albumsData }) => {
                const albumMap: Record<string, string> = {}
                albumsData?.forEach((a: { id: string; title?: string }) => {
                  albumMap[a.id] = a.title || ""
                })
                loadTracks(albumMap)
              })
            } else {
              loadTracks({})
            }
          })
      })
  }, [])

  const isArtistAccount =
    user?.role === "artist" || user?.role === "artist-pro"
  const showContent = !isLoading && user && !isArtistAccount

  // Show loading spinner while auth is initializing
  if (isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white mx-auto mb-4" />
          <p className="text-slate-300">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  // User is not logged in, show login prompt
  if (!user) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold mb-4">Acceso Requerido</h1>
          <p className="text-slate-300 mb-8">Por favor, inicia sesión para continuar</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg transition-colors"
          >
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    )
  }

  if (isArtistAccount) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      </div>
    )
  }

  return (
    <AppShell>
      <Suspense fallback={null}>
        <DashboardSuccessBanner />
      </Suspense>

      {showContent ? (
        <>
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">Bienvenido, {user.name}</h1>
            <p className="text-slate-300 text-sm sm:text-base">
              {user.role === "premium" || user.role === "artist-pro"
                ? "Disfruta de tu música sin límites"
                : "Descubre nueva música"}
            </p>
          </div>

          <div className="mb-6 sm:mb-8">
            <FeaturedCarousel />
          </div>

          <MusicGrid
            tracks={tracks}
            userRole={user.role === "superadmin" ? "premium" : (user.role as "free" | "premium" | "artist" | "artist-pro")}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          <p className="text-slate-300 animate-pulse">Cargando...</p>
        </div>
      )}
    </AppShell>
  )
}
