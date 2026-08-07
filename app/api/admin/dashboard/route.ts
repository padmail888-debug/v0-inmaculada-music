import { NextResponse } from "next/server"
import type { User } from "@supabase/supabase-js"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { requireSuperAdminFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"
import { mapSupabaseRoleToUserRole } from "@/lib/user-role"
import type { UserRole } from "@/lib/auth-types"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function startOfUtcMonth(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

function roleOf(user: User): UserRole {
  const appRole = (user.app_metadata as { role?: string } | undefined)?.role
  const userRole = (user.user_metadata as { role?: string } | undefined)?.role
  return mapSupabaseRoleToUserRole(appRole || userRole)
}

function displayName(user: User): string {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>
  return (
    (meta.name as string | undefined) ||
    (meta.full_name as string | undefined) ||
    user.email?.split("@")[0] ||
    "Usuario"
  )
}

async function listAllAuthUsers() {
  const supabase = getSupabaseServer()
  const users: User[] = []
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 })
    if (error) throw new Error(error.message)
    users.push(...data.users)
    if (data.users.length < 200) break
  }
  return users
}

export async function GET(request: Request) {
  try {
    const adminId = await requireSuperAdminFromRequest(request)
    if (!adminId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const supabase = getSupabaseServer()
    const users = await listAllAuthUsers()
    const now = new Date()
    const dayStart = startOfUtcDay(now)
    const monthStart = startOfUtcMonth(now)
    const yesterdayStart = new Date(dayStart.getTime() - 24 * 60 * 60 * 1000)

    let freeUsers = 0
    let premiumUsers = 0
    let artists = 0
    let artistPro = 0
    let superAdmins = 0
    let activeToday = 0
    let newThisMonth = 0

    for (const u of users) {
      const role = roleOf(u)
      if (role === "free") freeUsers++
      else if (role === "premium") premiumUsers++
      else if (role === "artist") artists++
      else if (role === "artist-pro") {
        artists++
        artistPro++
      } else if (role === "superadmin") superAdmins++

      const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at) : null
      if (lastSignIn && lastSignIn >= dayStart) activeToday++

      const created = u.created_at ? new Date(u.created_at) : null
      if (created && created >= monthStart) newThisMonth++
    }

    const totalUsers = users.length
    const conversionRate =
      totalUsers > 0 ? Math.round(((premiumUsers + artists) / totalUsers) * 1000) / 10 : 0

    // Unpaid / expired subscriptions (best-effort if table exists)
    let unpaidAccounts = 0
    const { count: unpaidCount, error: subErr } = await supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .or("status.eq.expired,status.eq.cancelled,status.eq.past_due")
    if (!subErr && typeof unpaidCount === "number") unpaidAccounts = unpaidCount

    // Songs
    const { count: totalSongs } = await supabase
      .from("songs")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)

    const { count: publishedSongs } = await supabase
      .from("songs")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_published", true)

    const { count: pendingSongs } = await supabase
      .from("songs")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_published", false)

    // Plays
    const { count: totalPlays } = await supabase
      .from("plays")
      .select("id", { count: "exact", head: true })

    const { count: playsToday } = await supabase
      .from("plays")
      .select("id", { count: "exact", head: true })
      .gte("played_at", dayStart.toISOString())

    const { count: playsYesterday } = await supabase
      .from("plays")
      .select("id", { count: "exact", head: true })
      .gte("played_at", yesterdayStart.toISOString())
      .lt("played_at", dayStart.toISOString())

    // Top songs by play count (aggregate in memory from recent/all play rows — cap fetch)
    const { data: playRows } = await supabase
      .from("plays")
      .select("song_id")
      .limit(20000)

    const playCountBySong = new Map<string, number>()
    for (const row of playRows || []) {
      const id = row.song_id as string
      if (!id) continue
      playCountBySong.set(id, (playCountBySong.get(id) || 0) + 1)
    }
    const topSongIds = [...playCountBySong.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
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
        .select("id, title, cover_image, artist_id, artists(artist_name)")
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
        const artistRel = s?.artists
        const artistName = Array.isArray(artistRel)
          ? artistRel[0]?.artist_name
          : artistRel?.artist_name
        return {
          id,
          title: s?.title || "Canción",
          artist: artistName || "Artista",
          plays: playCountBySong.get(id) || 0,
          coverUrl: s?.cover_image || null,
        }
      })
    }

    // Top artists by summing song plays
    let topArtists: Array<{
      id: string
      name: string
      totalPlays: number
      songs: number
    }> = []

    if (playCountBySong.size > 0) {
      const songIdsForArtists = [...playCountBySong.keys()].slice(0, 500)
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
        const rel = row.artists as
          | { id?: string; artist_name?: string }
          | { id?: string; artist_name?: string }[]
          | null
        const artist = Array.isArray(rel) ? rel[0] : rel
        if (!artistId) continue
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
        .slice(0, 5)
        .map((a) => ({
          id: a.id,
          name: a.name,
          totalPlays: a.totalPlays,
          songs: a.songs.size,
        }))
    }

    // Recent users for Usuarios tab preview
    const recentUsers = [...users]
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at))
      .slice(0, 8)
      .map((u) => ({
        id: u.id,
        name: displayName(u),
        email: u.email || "",
        role: roleOf(u),
        status: u.banned_until ? "suspended" : "active",
        createdAt: u.created_at,
        lastActive: u.last_sign_in_at,
      }))

    // Pending songs for Contenido tab
    const { data: pendingRows } = await supabase
      .from("songs")
      .select("id, title, cover_image, created_at, artist_id, artists(artist_name)")
      .is("deleted_at", null)
      .eq("is_published", false)
      .order("created_at", { ascending: false })
      .limit(20)

    const pendingSongList = (pendingRows || []).map((row) => {
      const rel = row.artists as
        | { artist_name?: string }
        | { artist_name?: string }[]
        | null
      const artistName = Array.isArray(rel) ? rel[0]?.artist_name : rel?.artist_name
      return {
        id: row.id as string,
        title: row.title as string,
        coverUrl: (row.cover_image as string | null) || "/placeholder.svg",
        artist: artistName || "Artista",
        createdAt: row.created_at as string,
      }
    })

    const avgPlaysPerUser =
      totalUsers > 0 && typeof totalPlays === "number"
        ? Math.round((totalPlays / totalUsers) * 10) / 10
        : 0

    return withApiCorsHeaders(
      NextResponse.json({
        ok: true,
        generatedAt: now.toISOString(),
        userStats: {
          totalUsers,
          freeUsers,
          premiumUsers,
          artists,
          artistPro,
          superAdmins,
          unpaidAccounts,
          activeToday,
          newThisMonth,
          conversionRate,
        },
        contentStats: {
          totalSongs: totalSongs || 0,
          publishedSongs: publishedSongs || 0,
          pendingSongs: pendingSongs || 0,
        },
        playStats: {
          totalPlays: totalPlays || 0,
          playsToday: playsToday || 0,
          playsYesterday: playsYesterday || 0,
          avgPlaysPerUser,
          topSongs,
          topArtists,
        },
        recentUsers,
        pendingSongList,
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
