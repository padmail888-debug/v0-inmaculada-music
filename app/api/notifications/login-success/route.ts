import { NextResponse } from "next/server"
import { handleApiCorsPreflight } from "@/lib/api-cors"
import { getAuthedUserIdFromRequest } from "@/lib/server-auth"
import { PRIORITY_ORDER } from "@/lib/notifications"
import { createAndDispatchNotification } from "@/lib/notification-service"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthedUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const source = typeof body?.source === "string" ? body.source : "login_form"
    const loginAt = typeof body?.loginAt === "string" ? body.loginAt : new Date().toISOString()

    const title = "Inicio de sesión exitoso"
    const message = "Has iniciado sesión correctamente en tu cuenta."

    const dispatch = await createAndDispatchNotification({
      type: "account",
      title,
      message,
      recipientUserIds: [userId],
      metadata: { event: "login", source, loginAt },
    })

    if (!dispatch.ok) {
      return NextResponse.json({ error: dispatch.error || "Failed to create login notification" }, { status: 500 })
    }

    const userRow = dispatch.userNotifications?.find((r) => r.user_id === userId) ?? dispatch.userNotifications?.[0]
    const pushSent = dispatch.push?.sent === true
    console.log("[notifications/login-success]", {
      userId,
      pushPath: dispatch.reason,
      pushSent,
      notificationId: dispatch.notificationId,
    })

    return NextResponse.json({
      ok: true,
      pushSent,
      notification: {
        id: dispatch.notificationId,
        user_notification_id: userRow?.id,
        user_id: userId,
        created_at: userRow?.created_at ?? new Date().toISOString(),
        is_read: false,
        read_at: null as string | null,
        type: "account",
        priority: PRIORITY_ORDER.account,
        title,
        message,
        deep_link: null,
        metadata: { event: "login", source, loginAt },
      },
    })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
