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

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function addUtcDays(d: Date, days: number) {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000)
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function roleOf(user: User): UserRole {
  const appRole = (user.app_metadata as { role?: string } | undefined)?.role
  const userRole = (user.user_metadata as { role?: string } | undefined)?.role
  return mapSupabaseRoleToUserRole(appRole || userRole)
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

export async function GET(request: Request) {
  try {
    const adminId = await requireSuperAdminFromRequest(request)
    if (!adminId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const supabase = getSupabaseServer()
    const now = new Date()
    const todayStart = startOfUtcDay(now)
    const rangeStart = addUtcDays(todayStart, -6) // last 7 days inclusive
    const prevRangeStart = addUtcDays(todayStart, -13)
    const prevRangeEnd = addUtcDays(todayStart, -7)
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const prevMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1))

    const users = await listAllAuthUsers()

    const roleCounts: Record<string, number> = {
      free: 0,
      premium: 0,
      artist: 0,
      "artist-pro": 0,
      superadmin: 0,
    }
    let activeToday = 0
    let activeLast7Days = 0
    let newThisMonth = 0
    let newPrevMonth = 0
    const signupsByDay = emptyDaySeries(rangeStart, 7)

    for (const u of users) {
      const role = roleOf(u)
      roleCounts[role] = (roleCounts[role] || 0) + 1

      const lastSignIn = u.last_sign_in_at ? new Date(u.last_sign_in_at) : null
      if (lastSignIn && lastSignIn >= todayStart) activeToday++
      if (lastSignIn && lastSignIn >= rangeStart) activeLast7Days++

      const created = u.created_at ? new Date(u.created_at) : null
      if (created && created >= monthStart) newThisMonth++
      if (created && created >= prevMonthStart && created < monthStart) newPrevMonth++

      if (created && created >= rangeStart) {
        const key = dayKey(startOfUtcDay(created))
        const bucket = signupsByDay.find((s) => s.date === key)
        if (bucket) bucket.value += 1
      }
    }

    const totalUsers = users.length
    const conversionRate =
      totalUsers > 0
        ? Math.round(
            (((roleCounts.premium || 0) + (roleCounts.artist || 0) + (roleCounts["artist-pro"] || 0)) /
              totalUsers) *
              1000,
          ) / 10
        : 0

    const monthGrowth =
      newPrevMonth > 0
        ? Math.round(((newThisMonth - newPrevMonth) / newPrevMonth) * 1000) / 10
        : newThisMonth > 0
          ? 100
          : 0

    // Plays in last 14 days for week comparison + 7-day series
    const { data: recentPlays, error: playsErr } = await supabase
      .from("plays")
      .select("played_at")
      .gte("played_at", prevRangeStart.toISOString())
      .order("played_at", { ascending: true })
      .limit(50000)

    if (playsErr) {
      // Table may be missing — return zeros rather than failing the whole tab
      console.warn("[admin/analytics] plays query:", playsErr.message)
    }

    const playsByDay = emptyDaySeries(rangeStart, 7)
    let playsThisWeek = 0
    let playsPrevWeek = 0
    let playsToday = 0
    let playsYesterday = 0
    const yesterdayStart = addUtcDays(todayStart, -1)

    for (const row of recentPlays || []) {
      const playedAt = row.played_at ? new Date(row.played_at as string) : null
      if (!playedAt || Number.isNaN(+playedAt)) continue

      if (playedAt >= rangeStart) {
        playsThisWeek++
        const key = dayKey(startOfUtcDay(playedAt))
        const bucket = playsByDay.find((s) => s.date === key)
        if (bucket) bucket.value += 1
        if (playedAt >= todayStart) playsToday++
        else if (playedAt >= yesterdayStart) playsYesterday++
      } else if (playedAt >= prevRangeStart && playedAt < rangeStart) {
        playsPrevWeek++
      }
    }

    let totalPlays = 0
    const { count: totalPlaysCount, error: totalPlaysErr } = await supabase
      .from("plays")
      .select("id", { count: "exact", head: true })
    if (totalPlaysErr) {
      console.warn("[admin/analytics] total plays:", totalPlaysErr.message)
    } else {
      totalPlays = totalPlaysCount || 0
    }

    const playsWeekGrowth =
      playsPrevWeek > 0
        ? Math.round(((playsThisWeek - playsPrevWeek) / playsPrevWeek) * 1000) / 10
        : playsThisWeek > 0
          ? 100
          : 0

    // Catalog
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

    const { count: songsThisWeek } = await supabase
      .from("songs")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .gte("created_at", rangeStart.toISOString())

    const publishedRate =
      (totalSongs || 0) > 0
        ? Math.round(((publishedSongs || 0) / (totalSongs || 1)) * 1000) / 10
        : 0

    const avgPlaysPerUser =
      totalUsers > 0 ? Math.round((totalPlays / totalUsers) * 10) / 10 : 0

    const roleDistribution = (
      [
        { key: "free", label: "Gratuitos", color: "bg-slate-400" },
        { key: "premium", label: "Premium", color: "bg-blue-500" },
        { key: "artist", label: "Artistas", color: "bg-purple-500" },
        { key: "artist-pro", label: "Artist Pro", color: "bg-fuchsia-500" },
        { key: "superadmin", label: "Super Admin", color: "bg-amber-500" },
      ] as const
    ).map((item) => {
      const count = roleCounts[item.key] || 0
      return {
        key: item.key,
        label: item.label,
        color: item.color,
        count,
        percent: totalUsers > 0 ? Math.round((count / totalUsers) * 1000) / 10 : 0,
      }
    })

    return withApiCorsHeaders(
      NextResponse.json({
        ok: true,
        generatedAt: now.toISOString(),
        summary: {
          totalUsers,
          activeToday,
          activeLast7Days,
          newThisMonth,
          monthGrowth,
          conversionRate,
          totalPlays,
          playsToday,
          playsYesterday,
          playsThisWeek,
          playsWeekGrowth,
          avgPlaysPerUser,
          totalSongs: totalSongs || 0,
          publishedSongs: publishedSongs || 0,
          pendingSongs: pendingSongs || 0,
          publishedRate,
          songsThisWeek: songsThisWeek || 0,
        },
        playsByDay,
        signupsByDay,
        roleDistribution,
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
