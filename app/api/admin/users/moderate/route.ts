import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { requireSuperAdminFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"
import { mapSupabaseRoleToUserRole } from "@/lib/user-role"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

/** Super Admin: activate (unban) or suspend (ban) a user. */
export async function POST(request: Request) {
  try {
    const adminId = await requireSuperAdminFromRequest(request)
    if (!adminId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const body = (await request.json().catch(() => null)) as {
      userId?: string
      action?: "activate" | "suspend"
    } | null

    const userId = String(body?.userId || "").trim()
    const action = body?.action
    if (!userId || (action !== "activate" && action !== "suspend")) {
      return withApiCorsHeaders(
        NextResponse.json(
          { error: "userId and action (activate|suspend) are required" },
          { status: 400 },
        ),
      )
    }

    if (userId === adminId) {
      return withApiCorsHeaders(
        NextResponse.json({ error: "No puedes suspender tu propia cuenta" }, { status: 400 }),
      )
    }

    const supabase = getSupabaseServer()
    const { data: target, error: getErr } = await supabase.auth.admin.getUserById(userId)
    if (getErr || !target?.user) {
      return withApiCorsHeaders(NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 }))
    }

    const targetRole = mapSupabaseRoleToUserRole(
      ((target.user.app_metadata as { role?: string } | undefined)?.role ||
        (target.user.user_metadata as { role?: string } | undefined)?.role) ??
        "",
    )
    if (targetRole === "superadmin") {
      return withApiCorsHeaders(
        NextResponse.json({ error: "No se puede suspender a otro Super Admin" }, { status: 400 }),
      )
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: action === "suspend" ? "876000h" : "none",
    })

    if (error) {
      return withApiCorsHeaders(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    return withApiCorsHeaders(NextResponse.json({ ok: true, userId, action }))
  } catch (error) {
    return withApiCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      ),
    )
  }
}
