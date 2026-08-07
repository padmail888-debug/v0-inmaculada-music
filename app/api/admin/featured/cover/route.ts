import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { PLAYLIST_COVER_MAX_BYTES } from "@/lib/playlist-cover-image"
import { requireSuperAdminFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

export async function POST(request: Request) {
  try {
    const adminId = await requireSuperAdminFromRequest(request)
    if (!adminId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const body = (await request.json().catch(() => null)) as {
      fileName?: string
      contentType?: string
      dataBase64?: string
    } | null

    const dataBase64 = String(body?.dataBase64 || "").trim()
    if (!dataBase64) {
      return withApiCorsHeaders(
        NextResponse.json({ error: "dataBase64 is required" }, { status: 400 }),
      )
    }

    let bytes: Buffer
    try {
      bytes = Buffer.from(dataBase64, "base64")
    } catch {
      return withApiCorsHeaders(
        NextResponse.json({ error: "Invalid base64 image data" }, { status: 400 }),
      )
    }

    if (bytes.length <= 0 || bytes.length > PLAYLIST_COVER_MAX_BYTES) {
      return withApiCorsHeaders(
        NextResponse.json(
          { error: `Image must be between 1 byte and ${PLAYLIST_COVER_MAX_BYTES} bytes` },
          { status: 400 },
        ),
      )
    }

    const path = `featured/${adminId}/${Date.now()}.jpg`
    const supabase = getSupabaseServer()
    const { error: uploadError } = await supabase.storage.from("covers").upload(path, bytes, {
      contentType: "image/jpeg",
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      return withApiCorsHeaders(
        NextResponse.json(
          {
            error:
              uploadError.message ||
              "Upload failed. Ensure the covers bucket exists and run docs/supabase-featured-cover-storage.sql.",
          },
          { status: 500 },
        ),
      )
    }

    const { data: publicUrlData } = supabase.storage.from("covers").getPublicUrl(path)
    return withApiCorsHeaders(
      NextResponse.json({ ok: true, imageUrl: publicUrlData.publicUrl }),
    )
  } catch (error) {
    return withApiCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      ),
    )
  }
}
