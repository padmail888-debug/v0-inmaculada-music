import { NextResponse } from "next/server"
import { handleApiCorsPreflight } from "@/lib/api-cors"
import { getAuthedUserIdFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

export async function GET(request: Request) {
  const noStoreHeaders = {
    "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
    Pragma: "no-cache",
    Expires: "0",
    Vary: "Authorization",
  }
  try {
    const userId = await getAuthedUserIdFromRequest(request)
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: noStoreHeaders })

    const supabase = getSupabaseServer()
    const PAGE_SIZE = 1000
    const userRows: Array<{
      id: string
      is_read: boolean
      read_at: string | null
      created_at: string
      notification_id: string
    }> = []
    let offset = 0
    let totalCount: number | null = null

    for (;;) {
      const { data, error, count } = await supabase
        .from("user_notifications")
        .select("id, is_read, read_at, created_at, notification_id", { count: offset === 0 ? "exact" : undefined })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1)

      if (error) {
        const message = error.message || ""
        const isSchemaNotReady =
          message.includes("relation") ||
          message.includes("does not exist") ||
          message.includes("Could not find a relationship") ||
          message.includes("schema cache")

        if (isSchemaNotReady) {
          return NextResponse.json({ notifications: [], unreadCount: 0, totalCount: 0 }, { headers: noStoreHeaders })
        }

        return NextResponse.json({ error: error.message }, { status: 500, headers: noStoreHeaders })
      }

      if (offset === 0 && typeof count === "number") {
        totalCount = count
      }

      const chunk = data ?? []
      userRows.push(...chunk)
      if (chunk.length < PAGE_SIZE) break
      offset += PAGE_SIZE
    }

    const notificationIds = (userRows ?? [])
      .map((r: { notification_id?: string }) => r.notification_id)
      .filter((id): id is string => Boolean(id))

    let notifMap = new Map<string, any>()
    if (notificationIds.length > 0) {
      const { data: notifRows, error: notifError } = await supabase
        .from("notifications")
        .select("id, type, priority, title, message, deep_link, metadata, created_at")
        .in("id", notificationIds)
      if (notifError) {
        return NextResponse.json({ error: notifError.message }, { status: 500, headers: noStoreHeaders })
      }
      notifMap = new Map((notifRows ?? []).map((n: any) => [n.id, n]))
    }

    const notifications = (userRows ?? [])
      .map((row: any) => {
        const base = notifMap.get(row.notification_id)
        if (!base) {
          return {
            user_notification_id: row.id,
            is_read: row.is_read,
            read_at: row.read_at,
            created_at: row.created_at,
            id: row.notification_id,
            type: "account",
            priority: 5,
            title: "Notificación",
            message: "Detalles no disponibles para esta notificación.",
            deep_link: null,
            metadata: {},
          }
        }
        return {
          user_notification_id: row.id,
          is_read: row.is_read,
          read_at: row.read_at,
          created_at: base.created_at ?? row.created_at,
          ...base,
        }
      })

    const unreadCount = notifications.filter((n: any) => !n.is_read).length
    return NextResponse.json({ notifications, unreadCount, totalCount: totalCount ?? notifications.length }, { headers: noStoreHeaders })
  } catch (e) {
    const message = e instanceof Error ? e.message : "Server error"
    const isSchemaNotReady =
      message.includes("relation") ||
      message.includes("does not exist") ||
      message.includes("Could not find a relationship") ||
      message.includes("schema cache")

    if (isSchemaNotReady) {
      return NextResponse.json({ notifications: [], unreadCount: 0, totalCount: 0 }, { headers: noStoreHeaders })
    }

    return NextResponse.json({ error: message }, { status: 500, headers: noStoreHeaders })
  }
}
