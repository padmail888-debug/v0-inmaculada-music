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

function isBanned(user: User): boolean {
  const bannedUntil = (user as { banned_until?: string | null }).banned_until
  if (!bannedUntil) return false
  const until = new Date(bannedUntil)
  return !Number.isNaN(+until) && until.getTime() > Date.now()
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

    const unpaidIds = new Set<string>()
    const { data: unpaidSubs } = await supabase
      .from("subscriptions")
      .select("user_id, status, current_period_end")
      .or("status.eq.expired,status.eq.cancelled,status.eq.past_due")

    for (const row of unpaidSubs || []) {
      if (row.user_id) unpaidIds.add(row.user_id as string)
    }

    // Also mark premium/artist users whose period ended
    const { data: endedSubs } = await supabase
      .from("subscriptions")
      .select("user_id, current_period_end, status")
      .lt("current_period_end", new Date().toISOString())
      .eq("status", "active")

    for (const row of endedSubs || []) {
      if (row.user_id) unpaidIds.add(row.user_id as string)
    }

    const mapped = users.map((u) => {
      const role = roleOf(u)
      const banned = isBanned(u)
      const unpaid = unpaidIds.has(u.id)
      let status: "active" | "suspended" | "unpaid" = "active"
      if (banned) status = "suspended"
      else if (unpaid) status = "unpaid"

      return {
        id: u.id,
        name: displayName(u),
        email: u.email || "",
        role,
        status,
        joinDate: u.created_at,
        lastActive: u.last_sign_in_at,
        isCurrentAdmin: u.id === adminId,
      }
    })

    mapped.sort((a, b) => +new Date(b.joinDate) - +new Date(a.joinDate))

    const stats = {
      total: mapped.length,
      free: mapped.filter((u) => u.role === "free").length,
      premium: mapped.filter((u) => u.role === "premium").length,
      artists: mapped.filter((u) => u.role === "artist" || u.role === "artist-pro").length,
      unpaid: mapped.filter((u) => u.status === "unpaid").length,
      suspended: mapped.filter((u) => u.status === "suspended").length,
    }

    return withApiCorsHeaders(NextResponse.json({ ok: true, users: mapped, stats }))
  } catch (error) {
    return withApiCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      ),
    )
  }
}
