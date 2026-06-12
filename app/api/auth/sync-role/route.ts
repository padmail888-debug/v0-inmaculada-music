import { type NextRequest, NextResponse } from "next/server"
import { handleApiCorsPreflight } from "@/lib/api-cors"
import { getSupabaseServer } from "@/lib/supabase/server"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

/**
 * Decode JWT payload without verification (safe here: we only use sub to fetch
 * that user's role from DB; do not use for sensitive auth decisions).
 */
function decodeJwtPayload(token: string): { sub?: string } | null {
  try {
    const parts = token.trim().split(".")
    if (parts.length !== 3) return null
    const payload = parts[1]
    const decoded = Buffer.from(payload, "base64url").toString("utf-8")
    return JSON.parse(decoded) as { sub?: string }
  } catch {
    return null
  }
}

type RoleResult =
  | { error: string; status: 401 | 404 }
  | { userId: string; app_metadata: Record<string, unknown>; role: string; whyFree: string | null }

async function getRoleFromToken(accessToken: string): Promise<RoleResult> {
  const payload = decodeJwtPayload(accessToken)
  const userId = payload?.sub
  if (!userId) return { error: "Invalid token: no sub in JWT", status: 401 }

  const supabase = getSupabaseServer()
  const { data: userData, error } = await supabase.auth.admin.getUserById(userId)
  if (error) {
    return { error: `Supabase error: ${error.message}`, status: 404 }
  }
  const user = userData?.user
  if (!user) {
    return { error: "User not found in Supabase", status: 404 }
  }

  const appMeta = (user.app_metadata ?? {}) as Record<string, unknown>
  const rawAppMeta = (user as Record<string, unknown>).raw_app_meta_data as Record<string, unknown> | undefined
  const roleFromAppMeta = appMeta.role as string | undefined
  const roleFromRaw = rawAppMeta?.role as string | undefined
  const role = roleFromAppMeta ?? roleFromRaw ?? "free"

  if (role === "free" && (roleFromAppMeta === undefined || roleFromRaw === undefined)) {
    console.log("[sync-role] user object keys:", Object.keys(user))
    console.log("[sync-role] user.app_metadata:", JSON.stringify(user.app_metadata))
    if (rawAppMeta !== undefined) console.log("[sync-role] user.raw_app_meta_data:", JSON.stringify(rawAppMeta))
  }
  return {
    userId,
    app_metadata: appMeta,
    role,
    whyFree:
      role === "free"
        ? "app_metadata.role is missing or empty in Supabase. The Stripe webhook must call updateUserById(userId, { app_metadata: { role: 'Paid User' } }) after checkout."
        : null,
  }
}

/**
 * GET /api/auth/sync-role?accessToken=xxx
 * Debug: returns full role info so you can see what Supabase has and why you might see "free".
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const accessToken = searchParams.get("accessToken")?.trim() ?? null
    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Missing accessToken",
          hint: "Use GET /api/auth/sync-role?accessToken=YOUR_JWT or POST with body { accessToken: '...' }",
        },
        { status: 400 }
      )
    }
    const result = await getRoleFromToken(accessToken)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }
    return NextResponse.json(result)
  } catch (e) {
    console.error("[sync-role GET]", e)
    return NextResponse.json(
      { error: "Server error", detail: e instanceof Error ? e.message : String(e) },
      { status: 500 }
    )
  }
}

/**
 * POST /api/auth/sync-role
 * Body: { accessToken: string }
 * Returns: { role: string } (e.g. "Paid User", "free") — source of truth from Supabase Auth.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const accessToken = typeof body.accessToken === "string" ? body.accessToken.trim() : null
    if (!accessToken) {
      return NextResponse.json({ error: "accessToken required" }, { status: 400 })
    }

    const result = await getRoleFromToken(accessToken)
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const { role, userId, app_metadata } = result
    console.log("[sync-role] userId:", userId, "app_metadata.role:", app_metadata?.role, "→ returning role:", role)
    return NextResponse.json({ role })
  } catch (e) {
    console.error("[sync-role]", e)
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
