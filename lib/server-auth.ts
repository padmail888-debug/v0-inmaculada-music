import { getSupabaseServer } from "@/lib/supabase/server"
import { mapSupabaseRoleToUserRole } from "@/lib/user-role"

function decodeJwtPayload(token: string): { sub?: string } | null {
  try {
    const parts = token.trim().split(".")
    if (parts.length !== 3) return null
    const decoded = Buffer.from(parts[1], "base64url").toString("utf-8")
    return JSON.parse(decoded) as { sub?: string }
  } catch {
    return null
  }
}

export async function getAuthedUserIdFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null
  if (!token) {
    const contentType = (request.headers.get("content-type") || "").toLowerCase()
    // Never try to parse multipart as JSON (Android cover uploads).
    if (contentType.includes("application/json")) {
      try {
        const cloned = request.clone()
        const body = await cloned.json().catch(() => ({}))
        if (typeof body?.accessToken === "string" && body.accessToken.trim()) {
          token = body.accessToken.trim()
        }
      } catch {
        // ignore
      }
    }
  }
  if (!token) return null
  const payload = decodeJwtPayload(token)
  const userId = payload?.sub
  if (!userId) return null

  const supabase = getSupabaseServer()
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data?.user) return null
  return data.user.id
}

/** Returns user id only when the caller is Super Admin. */
export async function requireSuperAdminFromRequest(request: Request): Promise<string | null> {
  const userId = await getAuthedUserIdFromRequest(request)
  if (!userId) return null

  const supabase = getSupabaseServer()
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data?.user) return null

  const appRole = (data.user.app_metadata as { role?: string } | undefined)?.role
  const userRole = (data.user.user_metadata as { role?: string } | undefined)?.role
  const mapped = mapSupabaseRoleToUserRole(appRole || userRole)
  if (mapped !== "superadmin") return null
  return userId
}

