"use client"

import {
  getNativeBackendFetchFailureHint,
  nativeCrossOriginFetchInit,
  resolveApiUrl,
  shouldUseRemoteApiBase,
} from "@/lib/api-base"
import { getCachedResolvedApiBase, resolveNativeApiBase } from "@/lib/native-api-resolver"
import { getSupabase } from "@/lib/supabase/client"
import type { UserRole } from "@/lib/auth-types"

export type AdminDashboardData = {
  generatedAt: string
  userStats: {
    totalUsers: number
    freeUsers: number
    premiumUsers: number
    artists: number
    artistPro: number
    superAdmins: number
    unpaidAccounts: number
    activeToday: number
    newThisMonth: number
    conversionRate: number
  }
  contentStats: {
    totalSongs: number
    publishedSongs: number
    pendingSongs: number
  }
  playStats: {
    totalPlays: number
    playsToday: number
    playsYesterday: number
    avgPlaysPerUser: number
    topSongs: Array<{
      id: string
      title: string
      artist: string
      plays: number
      coverUrl: string | null
    }>
    topArtists: Array<{
      id: string
      name: string
      totalPlays: number
      songs: number
    }>
  }
  recentUsers: Array<{
    id: string
    name: string
    email: string
    role: UserRole
    status: string
    createdAt: string
    lastActive: string | null
  }>
  pendingSongList: Array<{
    id: string
    title: string
    coverUrl: string
    artist: string
    createdAt: string
  }>
}

async function getAccessToken() {
  const supabase = getSupabase()
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token || null
}

async function adminFetch(path: string, init?: RequestInit) {
  if (shouldUseRemoteApiBase() && !getCachedResolvedApiBase()) {
    await resolveNativeApiBase()
  }
  const url = resolveApiUrl(path)
  if (!url) throw new Error("No se pudo contactar la API de administración")

  const token = await getAccessToken()
  if (!token) throw new Error("Sesión expirada. Inicia sesión de nuevo.")

  let response: Response
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(init?.headers || {}),
      },
      ...nativeCrossOriginFetchInit,
    })
  } catch (err) {
    const hint = getNativeBackendFetchFailureHint()
    const base = err instanceof Error ? err.message : "Error de red"
    throw new Error(hint ? `${base}. ${hint}` : base)
  }

  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(
      (payload && typeof payload === "object" && "error" in payload && String(payload.error)) ||
        `Error ${response.status}`,
    )
  }
  return payload
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const payload = (await adminFetch("/api/admin/dashboard")) as AdminDashboardData & {
    ok?: boolean
  }
  return payload
}

export async function moderateAdminSong(
  songId: string,
  action: "approve" | "reject" | "unpublish",
): Promise<void> {
  await adminFetch("/api/admin/songs/moderate", {
    method: "POST",
    body: JSON.stringify({ songId, action }),
  })
}

export type AdminSongRow = {
  id: string
  title: string
  coverUrl: string
  artist: string
  createdAt: string
  duration: number
  isPublished: boolean
  hasAudio: boolean
}

export type AdminSongsData = {
  stats: {
    totalSongs: number
    publishedSongs: number
    pendingSongs: number
  }
  songs: AdminSongRow[]
}

export async function fetchAdminSongs(
  status: "pending" | "published" | "all" = "pending",
  q = "",
): Promise<AdminSongsData> {
  const params = new URLSearchParams({ status, limit: "80" })
  if (q.trim()) params.set("q", q.trim())
  const payload = (await adminFetch(`/api/admin/songs?${params.toString()}`)) as AdminSongsData & {
    ok?: boolean
  }
  return {
    stats: payload.stats || { totalSongs: 0, publishedSongs: 0, pendingSongs: 0 },
    songs: payload.songs || [],
  }
}

export type AdminUserRow = {
  id: string
  name: string
  email: string
  role: UserRole
  status: "active" | "suspended" | "unpaid"
  joinDate: string
  lastActive: string | null
  isCurrentAdmin?: boolean
}

export type AdminUsersData = {
  users: AdminUserRow[]
  stats: {
    total: number
    free: number
    premium: number
    artists: number
    unpaid: number
    suspended: number
  }
}

export async function fetchAdminUsers(): Promise<AdminUsersData> {
  const payload = (await adminFetch("/api/admin/users")) as AdminUsersData & { ok?: boolean }
  return {
    users: payload.users || [],
    stats: payload.stats || {
      total: 0,
      free: 0,
      premium: 0,
      artists: 0,
      unpaid: 0,
      suspended: 0,
    },
  }
}

export async function moderateAdminUser(
  userId: string,
  action: "activate" | "suspend",
): Promise<void> {
  await adminFetch("/api/admin/users/moderate", {
    method: "POST",
    body: JSON.stringify({ userId, action }),
  })
}

export type AdminAnalyticsData = {
  generatedAt: string
  summary: {
    totalUsers: number
    activeToday: number
    activeLast7Days: number
    newThisMonth: number
    monthGrowth: number
    conversionRate: number
    totalPlays: number
    playsToday: number
    playsYesterday: number
    playsThisWeek: number
    playsWeekGrowth: number
    avgPlaysPerUser: number
    totalSongs: number
    publishedSongs: number
    pendingSongs: number
    publishedRate: number
    songsThisWeek: number
  }
  playsByDay: Array<{ date: string; label: string; value: number }>
  signupsByDay: Array<{ date: string; label: string; value: number }>
  roleDistribution: Array<{
    key: string
    label: string
    color: string
    count: number
    percent: number
  }>
}

export async function fetchAdminAnalytics(): Promise<AdminAnalyticsData> {
  return (await adminFetch("/api/admin/analytics")) as AdminAnalyticsData
}

export type AdminPlaybackData = {
  generatedAt: string
  summary: {
    totalPlays: number
    playsToday: number
    playsYesterday: number
    playsThisWeek: number
    playsWeekGrowth: number
    avgPlaysPerUser: number
    uniqueSongsPlayed: number
  }
  playsByDay: Array<{ date: string; label: string; value: number }>
  topSongs: Array<{
    id: string
    title: string
    artist: string
    plays: number
    coverUrl: string | null
  }>
  topArtists: Array<{
    id: string
    name: string
    totalPlays: number
    songs: number
  }>
  recentPlays: Array<{
    id: string
    songId: string
    title: string
    artist: string
    coverUrl: string | null
    userId: string | null
    userLabel: string
    playedAt: string
  }>
}

export async function fetchAdminPlayback(): Promise<AdminPlaybackData> {
  return (await adminFetch("/api/admin/playback")) as AdminPlaybackData
}

export type AdminPlatformSettings = {
  userRegistration: boolean
  maintenanceMode: boolean
  contentUpload: boolean
  premiumPrice: number
  artistCommission: number
  updatedAt?: string | null
}

export async function fetchAdminSettings(): Promise<AdminPlatformSettings> {
  const payload = (await adminFetch("/api/admin/settings")) as {
    settings: AdminPlatformSettings
  }
  return payload.settings
}

export async function saveAdminSettings(
  patch: Partial<AdminPlatformSettings>,
): Promise<AdminPlatformSettings> {
  const payload = (await adminFetch("/api/admin/settings", {
    method: "PUT",
    body: JSON.stringify(patch),
  })) as { settings: AdminPlatformSettings }
  return payload.settings
}
