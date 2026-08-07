import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { requireSuperAdminFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function addUtcDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function emptyDaySeries(from: Date, days: number) {
  const series: Array<{ date: string; label: string; value: number }> = []
  for (let i = 0; i < days; i++) {
    const d = addUtcDays(from, i)
    series.push({
      date: dayKey(d),
      label: d.toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" }),
      value: 0,
    })
  }
  return series
}

function artistNameFromRel(
  rel:
    | { id?: string; artist_name?: string }
    | { id?: string; artist_name?: string }[]
    | null
    | undefined,
) {
  if (!rel) return "Artista"
  const artist = Array.isArray(rel) ? rel[0] : rel
  return artist?.artist_name || "Artista"
}

async function countAuthUsers() {
  const supabase = getSupabaseServer()
  let total = 0
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    total += data.users.length
    if (data.users.length < 200) break
  }
  return total
}

export async function GET(request: Request) {
  try {
    const adminId = await requireSuperAdminFromRequest(request)
    if (!adminId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const supabase = getSupabaseServer()
    const now = new Date()
    const todayStart = startOfUtcDay(now)
    const yesterdayStart = addUtcDays(todayStart, -1)
    const rangeStart = addUtcDays(todayStart, -6)
    const prevRangeStart = addUtcDays(todayStart, -13)

    const [
      totalPlaysRes,
      playsTodayRes,
      playsYesterdayRes,
      playsThisWeekRes,
      recentWeekPlaysRes,
      allPlayRowsRes,
      recentPlaysRes,
      totalUsers,
    ] = await Promise.all([
      supabase.from("plays").select("id", { count: "exact", head: true }),
      supabase
        .from("plays")
        .select("id", { count: "exact", head: true })
        .gte("played_at", todayStart.toISOString()),
      supabase
        .from("plays")
        .select("id", { count: "exact", head: true })
        .gte("played_at", yesterdayStart.toISOString())
        .lt("played_at", todayStart.toISOString()),
      supabase
        .from("plays")
        .select("id", { count: "exact", head: true })
        .gte("played_at", rangeStart.toISOString()),
      supabase
        .from("plays")
        .select("played_at")
        .gte("played_at", prevRangeStart.toISOString())
        .order("played_at", { ascending: true })
        .limit(50000),
      supabase.from("plays").select("song_id").limit(30000),
      supabase
        .from("plays")
        .select("id, song_id, user_id, played_at")
        .order("played_at", { ascending: false })
        .limit(20),
      countAuthUsers().catch(() => 0),
    ])

    if (totalPlaysRes.error) {
      console.warn("[admin/playback] plays table:", totalPlaysRes.error.message)
    }

    const totalPlays = totalPlaysRes.count || 0
    const playsToday = playsTodayRes.count || 0
    const playsYesterday = playsYesterdayRes.count || 0
    const playsThisWeek = playsThisWeekRes.count || 0

    const playsByDay = emptyDaySeries(rangeStart, 7)
    let playsPrevWeek = 0
    for (const row of recentWeekPlaysRes.data || []) {
      const playedAt = row.played_at ? new Date(row.played_at as string) : null
      if (!playedAt || Number.isNaN(+playedAt)) continue
      if (playedAt >= rangeStart) {
        const key = dayKey(startOfUtcDay(playedAt))
        const bucket = playsByDay.find((s) => s.date === key)
        if (bucket) bucket.value += 1
      } else if (playedAt >= prevRangeStart && playedAt < rangeStart) {
        playsPrevWeek++
      }
    }

    const playsWeekGrowth =
      playsPrevWeek > 0
        ? Math.round(((playsThisWeek - playsPrevWeek) / playsPrevWeek) * 1000) / 10
        : playsThisWeek > 0
          ? 100
          : 0

    const avgPlaysPerUser =
      totalUsers > 0 ? Math.round((totalPlays / totalUsers) * 10) / 10 : 0

    const playCountBySong = new Map<string, number>()
    for (const row of allPlayRowsRes.data || []) {
      const id = row.song_id as string
      if (!id) continue
      playCountBySong.set(id, (playCountBySong.get(id) || 0) + 1)
    }

    const topSongIds = [...playCountBySong.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id)

    let topSongs: Array<{
      id: string
      title: string
      artist: string
      plays: number
      coverUrl: string | null
    }> = []

    if (topSongIds.length > 0) {
      const { data: songs } = await supabase
        .from("songs")
        .select("id, title, cover_image, artists(artist_name)")
        .in("id", topSongIds)

      const byId = new Map((songs || []).map((s) => [s.id as string, s]))
      topSongs = topSongIds.map((id) => {
        const s = byId.get(id) as
          | {
              id: string
              title: string
              cover_image: string | null
              artists?: { artist_name?: string } | { artist_name?: string }[] | null
            }
          | undefined
        return {
          id,
          title: s?.title || "Canción",
          artist: artistNameFromRel(s?.artists),
          plays: playCountBySong.get(id) || 0,
          coverUrl: s?.cover_image || null,
        }
      })
    }

    let topArtists: Array<{
      id: string
      name: string
      totalPlays: number
      songs: number
    }> = []

    if (playCountBySong.size > 0) {
      const songIdsForArtists = [...playCountBySong.keys()].slice(0, 800)
      const { data: artistSongRows } = await supabase
        .from("songs")
        .select("id, artist_id, artists(id, artist_name)")
        .is("deleted_at", null)
        .in("id", songIdsForArtists)

      const artistAgg = new Map<
        string,
        { id: string; name: string; totalPlays: number; songs: Set<string> }
      >()

      for (const row of artistSongRows || []) {
        const songId = row.id as string
        const artistId = row.artist_id as string
        if (!artistId) continue
        const rel = row.artists as
          | { id?: string; artist_name?: string }
          | { id?: string; artist_name?: string }[]
          | null
        const artist = Array.isArray(rel) ? rel[0] : rel
        const songPlays = playCountBySong.get(songId) || 0
        const prev = artistAgg.get(artistId) || {
          id: artistId,
          name: artist?.artist_name || "Artista",
          totalPlays: 0,
          songs: new Set<string>(),
        }
        prev.totalPlays += songPlays
        prev.songs.add(songId)
        artistAgg.set(artistId, prev)
      }

      topArtists = [...artistAgg.values()]
        .sort((a, b) => b.totalPlays - a.totalPlays)
        .slice(0, 10)
        .map((a) => ({
          id: a.id,
          name: a.name,
          totalPlays: a.totalPlays,
          songs: a.songs.size,
        }))
    }

    const recentPlayRows = recentPlaysRes.data || []
    const recentSongIds = [...new Set(recentPlayRows.map((r) => r.song_id as string).filter(Boolean))]
    const recentUserIds = [
      ...new Set(recentPlayRows.map((r) => r.user_id as string | null).filter(Boolean) as string[]),
    ]

    const songMeta = new Map<string, { title: string; artist: string; coverUrl: string | null }>()
    if (recentSongIds.length > 0) {
      const { data: songs } = await supabase
        .from("songs")
        .select("id, title, cover_image, artists(artist_name)")
        .in("id", recentSongIds)
      for (const s of songs || []) {
        songMeta.set(s.id as string, {
          title: (s.title as string) || "Canción",
          artist: artistNameFromRel(
            s.artists as
              | { artist_name?: string }
              | { artist_name?: string }[]
              | null,
          ),
          coverUrl: (s.cover_image as string | null) || null,
        })
      }
    }

    const userEmailById = new Map<string, string>()
    if (recentUserIds.length > 0) {
      // Resolve a small set of users via admin API (page scan is heavy; try getUserById)
      await Promise.all(
        recentUserIds.slice(0, 20).map(async (uid) => {
          try {
            const { data, error } = await supabase.auth.admin.getUserById(uid)
            if (!error && data.user) {
              userEmailById.set(uid, data.user.email || uid.slice(0, 8))
            }
          } catch {
            // ignore
          }
        }),
      )
    }

    const recentPlays = recentPlayRows.map((row) => {
      const songId = row.song_id as string
      const meta = songMeta.get(songId)
      const userId = (row.user_id as string | null) || null
      return {
        id: row.id as string,
        songId,
        title: meta?.title || "Canción",
        artist: meta?.artist || "Artista",
        coverUrl: meta?.coverUrl || null,
        userId,
        userLabel: userId ? userEmailById.get(userId) || "Usuario" : "Anónimo",
        playedAt: row.played_at as string,
      }
    })

    return withApiCorsHeaders(
      NextResponse.json({
        ok: true,
        generatedAt: now.toISOString(),
        summary: {
          totalPlays,
          playsToday,
          playsYesterday,
          playsThisWeek,
          playsWeekGrowth,
          avgPlaysPerUser,
          uniqueSongsPlayed: playCountBySong.size,
        },
        playsByDay,
        topSongs,
        topArtists,
        recentPlays,
      }),
    )
  } catch (error) {
    return withApiCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      ),
    )
  }
}
