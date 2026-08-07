import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import { requireSuperAdminFromRequest } from "@/lib/server-auth"
import { createAndDispatchNotification } from "@/lib/notification-service"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

async function notifySongPublished(params: {
  artistId: string
  songId: string
  songTitle: string
  albumId: string | null
  albumJustPublished: boolean
  albumTitle: string | null
}) {
  const supabase = getSupabaseServer()
  const { data: followers } = await supabase
    .from("favorite_artists")
    .select("user_id")
    .eq("artist_id", params.artistId)
  const recipientUserIds = [...new Set((followers || []).map((r) => r.user_id).filter(Boolean))]
  if (recipientUserIds.length === 0) return

  await createAndDispatchNotification({
    type: "new_song_release",
    title: "Nueva canción disponible",
    message: `Tu artista seguido lanzó "${params.songTitle}".`,
    recipientUserIds,
    deepLink: `/search?q=${encodeURIComponent(params.songTitle)}`,
    metadata: { artistId: params.artistId, songId: params.songId },
  })

  if (params.albumJustPublished && params.albumId && params.albumTitle) {
    await createAndDispatchNotification({
      type: "new_album_release",
      title: "Nuevo álbum disponible",
      message: `Tu artista seguido lanzó el álbum "${params.albumTitle}".`,
      recipientUserIds,
      deepLink: `/search?q=${encodeURIComponent(params.albumTitle)}`,
      metadata: { artistId: params.artistId, albumId: params.albumId },
    })
  }
}

/** Super Admin: approve (publish) or reject (soft-delete) a pending song. */
export async function POST(request: Request) {
  try {
    const adminId = await requireSuperAdminFromRequest(request)
    if (!adminId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const body = (await request.json().catch(() => null)) as {
      songId?: string
      action?: "approve" | "reject" | "unpublish"
    } | null

    const songId = String(body?.songId || "").trim()
    const action = body?.action
    if (!songId || (action !== "approve" && action !== "reject" && action !== "unpublish")) {
      return withApiCorsHeaders(
        NextResponse.json(
          { error: "songId and action (approve|reject|unpublish) are required" },
          { status: 400 },
        ),
      )
    }

    const supabase = getSupabaseServer()
    const { data: song, error: songError } = await supabase
      .from("songs")
      .select("id, artist_id, album_id, title, deleted_at, is_published")
      .eq("id", songId)
      .maybeSingle()

    if (songError || !song) {
      return withApiCorsHeaders(NextResponse.json({ error: "Song not found" }, { status: 404 }))
    }

    if (action === "approve") {
      const { error } = await supabase
        .from("songs")
        .update({ is_published: true })
        .eq("id", songId)
      if (error) {
        return withApiCorsHeaders(NextResponse.json({ error: error.message }, { status: 500 }))
      }

      let albumJustPublished = false
      let albumTitle: string | null = null
      if (song.album_id) {
        const { data: album } = await supabase
          .from("albums")
          .select("id, title, is_published")
          .eq("id", song.album_id)
          .maybeSingle()
        albumTitle = album?.title ?? null
        if (album && !album.is_published) {
          await supabase
            .from("albums")
            .update({ is_published: true })
            .eq("id", song.album_id)
            .eq("is_published", false)
          albumJustPublished = true
        }
      }

      if (!song.is_published && song.artist_id) {
        void notifySongPublished({
          artistId: song.artist_id,
          songId,
          songTitle: song.title || "Nueva canción",
          albumId: song.album_id,
          albumJustPublished,
          albumTitle,
        })
      }

      return withApiCorsHeaders(NextResponse.json({ ok: true, songId, action: "approve" }))
    }

    if (action === "unpublish") {
      const { error } = await supabase
        .from("songs")
        .update({ is_published: false })
        .eq("id", songId)
      if (error) {
        return withApiCorsHeaders(NextResponse.json({ error: error.message }, { status: 500 }))
      }
      return withApiCorsHeaders(NextResponse.json({ ok: true, songId, action: "unpublish" }))
    }

    // reject → soft delete
    const { error } = await supabase
      .from("songs")
      .update({ deleted_at: new Date().toISOString(), is_published: false })
      .eq("id", songId)
    if (error) {
      return withApiCorsHeaders(NextResponse.json({ error: error.message }, { status: 500 }))
    }
    return withApiCorsHeaders(NextResponse.json({ ok: true, songId, action: "reject" }))
  } catch (error) {
    return withApiCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      ),
    )
  }
}
