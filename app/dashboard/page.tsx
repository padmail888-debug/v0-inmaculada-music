 "use client"

import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { MusicGrid } from "@/components/music/music-grid"
import { FeaturedCarousel } from "@/components/featured-content/featured-carousel"
import { useEffect, useLayoutEffect, useState, Suspense, useMemo } from "react"
import { useRouter } from "next/navigation"
import { getSupabase } from "@/lib/supabase/client"
import { DashboardSuccessBanner } from "./dashboard-success-banner"
import type { User } from "@/lib/auth-types"
import { getPostLoginPath, mapSupabaseRoleToUserRole } from "@/lib/user-role"

function readUserFromStorage(): User | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem("user")
    if (!raw) return null
    const parsed = JSON.parse(raw) as User
    if (!parsed?.id) return null
    return { ...parsed, role: mapSupabaseRoleToUserRole(parsed.role) }
  } catch {
    return null
  }
}

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
  const [authChecked, setAuthChecked] = useState(false)

  const storedUser = useMemo((): User | null => readUserFromStorage(), [user, isLoading])

  const activeUser = user ?? storedUser

  // On return from checkout: set role from plan (premium | artist-pro). Only Artist Pro redirects to /artist/profile.
  useLayoutEffect(() => {
    if (typeof window === "undefined" || !activeUser?.id) return
    const params = new URLSearchParams(window.location.search)
    if (params.get("success") !== "true") return
    const planParam = params.get("plan")
    const plan = planParam === "artist-pro" ? "artist-pro" : "premium"
    setUserRole(plan)
    if (plan === "artist-pro") {
      router.replace("/artist/profile?success=true")
    }
  }, [activeUser?.id, setUserRole, router])

  useEffect(() => {
    if (isLoading) return

    let cancelled = false
    async function verifyAccess() {
      if (activeUser) {
        const homePath = getPostLoginPath(mapSupabaseRoleToUserRole(activeUser.role))
        if (homePath !== "/dashboard") {
          router.replace(homePath)
          return
        }
        if (!cancelled) setAuthChecked(true)
        return
      }

      const supabase = getSupabase()
      const { data } = await supabase.auth.getSession()
      if (cancelled) return

      if (data.session?.access_token) {
        const refreshed = await refreshUserFromSupabase()
        if (cancelled) return
        const recovered = refreshed ?? readUserFromStorage()
        if (!recovered) {
          router.replace("/login")
        }
        if (!cancelled) setAuthChecked(true)
        return
      }

      router.replace("/login")
      if (!cancelled) setAuthChecked(true)
    }

    void verifyAccess()
    return () => {
      cancelled = true
    }
  }, [isLoading, activeUser, router, refreshUserFromSupabase])

  // Sync role from server. After checkout (success=true), short delay so webhook has time to update Supabase.
  useEffect(() => {
    if (!activeUser?.id) return
    const isReturnFromCheckout =
      typeof window !== "undefined" && new URLSearchParams(window.location.search).get("success") === "true"
    const delayMs = isReturnFromCheckout ? 800 : 400
    const t = setTimeout(() => void refreshUserFromSupabase(), delayMs)
    return () => clearTimeout(t)
  }, [activeUser?.id, refreshUserFromSupabase])

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
    activeUser?.role === "artist" || activeUser?.role === "artist-pro"
  const showContent = authChecked && !isLoading && !!activeUser && !isArtistAccount

  if (authChecked && !isLoading && !activeUser) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <p className="text-slate-300 animate-pulse">Redirigiendo...</p>
        </div>
      </div>
    )
  }

  if (!authChecked || isLoading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <p className="text-slate-300 animate-pulse">Cargando...</p>
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
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">
              Bienvenido, {activeUser.name || activeUser.email || "oyente"}
            </h1>
            <p className="text-slate-300 text-sm sm:text-base">
              {activeUser.role === "premium" || activeUser.role === "artist-pro"
                ? "Disfruta de tu música sin límites"
                : "Descubre nueva música"}
            </p>
          </div>

          <div className="mb-6 sm:mb-8">
            <FeaturedCarousel />
          </div>

          <MusicGrid
            tracks={tracks}
            userRole={
              activeUser.role === "superadmin"
                ? "premium"
                : (activeUser.role as "free" | "premium" | "artist" | "artist-pro")
            }
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
