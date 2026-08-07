import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { requireSuperAdminFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

type SongStatusFilter = "pending" | "published" | "all"

function artistNameFromRel(
  rel: { artist_name?: string } | { artist_name?: string }[] | null | undefined,
): string {
  if (!rel) return "Artista"
  if (Array.isArray(rel)) return rel[0]?.artist_name || "Artista"
  return rel.artist_name || "Artista"
}

/** Super Admin: list songs for content moderation. */
export async function GET(request: Request) {
  try {
    const adminId = await requireSuperAdminFromRequest(request)
    if (!adminId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const { searchParams } = new URL(request.url)
    const status = (searchParams.get("status") || "pending") as SongStatusFilter
    const q = (searchParams.get("q") || "").trim().toLowerCase()
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || 50)))

    const supabase = getSupabaseServer()

    const { count: totalSongs } = await supabase
      .from("songs")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)

    const { count: publishedSongs } = await supabase
      .from("songs")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_published", true)

    const { count: pendingSongs } = await supabase
      .from("songs")
      .select("id", { count: "exact", head: true })
      .is("deleted_at", null)
      .eq("is_published", false)

    let query = supabase
      .from("songs")
      .select(
        "id, title, cover_image, created_at, duration, is_published, audio_file_url, artists(artist_name)",
      )
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (status === "pending") query = query.eq("is_published", false)
    if (status === "published") query = query.eq("is_published", true)

    const { data, error } = await query
    if (error) {
      return withApiCorsHeaders(NextResponse.json({ error: error.message }, { status: 500 }))
    }

    let songs = (data || []).map((row) => ({
      id: row.id as string,
      title: row.title as string,
      coverUrl: (row.cover_image as string | null) || "/placeholder.svg",
      artist: artistNameFromRel(
        row.artists as { artist_name?: string } | { artist_name?: string }[] | null,
      ),
      createdAt: row.created_at as string,
      duration: (row.duration as number) || 0,
      isPublished: !!row.is_published,
      hasAudio: !!(row.audio_file_url as string | null),
    }))

    if (q) {
      songs = songs.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.artist.toLowerCase().includes(q),
      )
    }

    return withApiCorsHeaders(
      NextResponse.json({
        ok: true,
        stats: {
          totalSongs: totalSongs || 0,
          publishedSongs: publishedSongs || 0,
          pendingSongs: pendingSongs || 0,
        },
        songs,
      }),
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
