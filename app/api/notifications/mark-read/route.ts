import { NextResponse } from "next/server"
import { handleApiCorsPreflight } from "@/lib/api-cors"
import { getAuthedUserIdFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthedUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const userNotificationId = typeof body.userNotificationId === "string" ? body.userNotificationId : null
    if (!userNotificationId) {
      return NextResponse.json({ error: "userNotificationId is required" }, { status: 400 })
    }

    const supabase = getSupabaseServer()
    const { error } = await supabase
      .from("user_notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", userNotificationId)
      .eq("user_id", userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
