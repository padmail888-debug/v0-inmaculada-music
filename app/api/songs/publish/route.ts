import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { requireSuperAdminFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

/**
 * Publish a song (and its album if present) so it appears in search/catalog.
 * Artists cannot publish — only Super Admin (prefer POST /api/admin/songs/moderate).
 */
export async function POST(request: Request) {
  try {
    const adminId = await requireSuperAdminFromRequest(request)
    if (!adminId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const body = await request.json().catch(() => ({}))
    const songId = typeof body.songId === "string" ? body.songId.trim() : ""
    if (!songId) {
      return withApiCorsHeaders(NextResponse.json({ error: "songId is required" }, { status: 400 }))
    }

    const supabase = getSupabaseServer()

    const { data: song, error: songError } = await supabase
      .from("songs")
      .select("id, album_id, is_published, deleted_at")
      .eq("id", songId)
      .maybeSingle()

    if (songError || !song) {
      return withApiCorsHeaders(NextResponse.json({ error: "Song not found" }, { status: 404 }))
    }

    if (song.deleted_at) {
      return withApiCorsHeaders(NextResponse.json({ error: "Song was deleted" }, { status: 400 }))
    }

    if (!song.is_published) {
      const { error: publishErr } = await supabase
        .from("songs")
        .update({ is_published: true })
        .eq("id", songId)

      if (publishErr) {
        return withApiCorsHeaders(
          NextResponse.json({ error: publishErr.message }, { status: 500 }),
        )
      }
    }

    if (song.album_id) {
      await supabase
        .from("albums")
        .update({ is_published: true })
        .eq("id", song.album_id)
        .eq("is_published", false)
    }

    return withApiCorsHeaders(NextResponse.json({ ok: true, songId, published: true }))
  } catch (e) {
    return withApiCorsHeaders(
      NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 }),
    )
  }
}
