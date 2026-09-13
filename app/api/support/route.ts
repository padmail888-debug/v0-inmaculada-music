import { type NextRequest, NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { getSupabaseServer } from "@/lib/supabase/server"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

function asString(value: unknown, max = 2000) {
  if (typeof value !== "string") return ""
  return value.trim().slice(0, max)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const email = asString(body.email, 320)
    const subject = asString(body.subject, 200)
    const message = asString(body.message, 8000)
    const name = asString(body.name, 120)
    const category = asString(body.category, 80)
    const device = asString(body.device, 200)

    if (!email || !subject || !message) {
      return withApiCorsHeaders(NextResponse.json({ error: "email, subject and message are required" }, { status: 400 }))
    }

    console.info("[support]", {
      email,
      subject,
      category: category || null,
      at: new Date().toISOString(),
    })

    let stored = false
    try {
      const supabase = getSupabaseServer()
      const { error } = await supabase.from("support_messages").insert({
        email,
        subject,
        message,
        name: name || null,
        category: category || null,
        device: device || null,
      })
      stored = !error
    } catch {
      stored = false
    }

    return withApiCorsHeaders(NextResponse.json({ ok: true, stored }))
  } catch (error) {
    console.error("[support]", error)
    return withApiCorsHeaders(NextResponse.json({ ok: true, stored: false }))
  }
}
