import { NextResponse } from "next/server"
import { handleApiCorsPreflight } from "@/lib/api-cors"
import { getAuthedUserIdFromRequest } from "@/lib/server-auth"
import { resendPushForLatestUserNotification } from "@/lib/notification-service"
import { getSupabaseServer } from "@/lib/supabase/server"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthedUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const token = typeof body.token === "string" ? body.token.trim() : ""
    const platform = typeof body.platform === "string" ? body.platform.trim() : "web"

    if (!token) return NextResponse.json({ error: "token is required" }, { status: 400 })

    const supabase = getSupabaseServer()

    // One active token per platform per user — stale rows cause FCM "not registered" / wrong project.
    await supabase
      .from("device_tokens")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("platform", platform)

    const { error } = await supabase.from("device_tokens").upsert(
      {
        user_id: userId,
        token,
        platform,
        is_active: true,
        last_seen_at: new Date().toISOString(),
      },
      { onConflict: "token" }
    )

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    console.log("[notifications] device token saved", {
      userId,
      platform,
      tokenPreview: `${token.slice(0, 12)}…`,
    })

    // Login notification is often created before this token exists — resend push for recent inbox row.
    const resend = await resendPushForLatestUserNotification(userId)
    if (resend.sent) {
      console.log("[notifications] push resent after device registration", { userId, platform })
    }

    return NextResponse.json({ ok: true, pushResent: resend.sent })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
