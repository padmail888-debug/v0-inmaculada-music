import { NextResponse } from "next/server"
import { handleApiCorsPreflight, withApiCorsHeaders } from "@/lib/api-cors"
import {
  isLikelyHeic,
  PLAYLIST_COVER_MAX_BYTES,
  resolvePlaylistCoverMime,
  sniffPlaylistCoverBytes,
} from "@/lib/playlist-cover-image"
import { getAuthedUserIdFromRequest } from "@/lib/server-auth"
import { getSupabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

type CoverBytes = {
  bytes: Buffer
  fileName: string
  contentTypeHint: string
}

function isBlobLike(value: unknown): value is { arrayBuffer: () => Promise<ArrayBuffer>; size: number; type?: string; name?: string } {
  return (
    !!value &&
    typeof value === "object" &&
    typeof (value as { arrayBuffer?: unknown }).arrayBuffer === "function" &&
    typeof (value as { size?: unknown }).size === "number"
  )
}

async function readCoverFromRequest(request: Request): Promise<
  | { ok: true; playlistId: string; cover: CoverBytes }
  | { ok: false; status: number; error: string }
> {
  const contentType = (request.headers.get("content-type") || "").toLowerCase()

  // JSON base64 — preferred from Capacitor Android (FormData file parts often break).
  if (contentType.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      playlistId?: string
      fileName?: string
      contentType?: string
      dataBase64?: string
    } | null

    const playlistId = String(body?.playlistId || "").trim()
    const dataBase64 = String(body?.dataBase64 || "").trim()
    if (!playlistId || !dataBase64) {
      return { ok: false, status: 400, error: "playlistId and dataBase64 are required" }
    }

    let bytes: Buffer
    try {
      bytes = Buffer.from(dataBase64, "base64")
    } catch {
      return { ok: false, status: 400, error: "Invalid base64 image data" }
    }

    return {
      ok: true,
      playlistId,
      cover: {
        bytes,
        fileName: String(body?.fileName || "cover.jpg"),
        contentTypeHint: String(body?.contentType || ""),
      },
    }
  }

  const form = await request.formData()
  const playlistId = String(form.get("playlistId") || "").trim()
  const raw = form.get("file")

  if (!playlistId || !isBlobLike(raw) || raw.size <= 0) {
    return {
      ok: false,
      status: 400,
      error: "playlistId and image file are required",
    }
  }

  const bytes = Buffer.from(await raw.arrayBuffer())
  return {
    ok: true,
    playlistId,
    cover: {
      bytes,
      fileName: typeof raw.name === "string" && raw.name ? raw.name : "cover.jpg",
      contentTypeHint: typeof raw.type === "string" ? raw.type : "",
    },
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthedUserIdFromRequest(request)
    if (!userId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const parsed = await readCoverFromRequest(request)
    if (!parsed.ok) {
      return withApiCorsHeaders(NextResponse.json({ error: parsed.error }, { status: parsed.status }))
    }

    const { playlistId, cover } = parsed
    if (isLikelyHeic(cover.contentTypeHint, cover.fileName)) {
      return withApiCorsHeaders(
        NextResponse.json(
          { error: "En el móvil, elige una foto JPG o PNG (HEIC no es compatible)." },
          { status: 400 },
        ),
      )
    }
    if (cover.bytes.length <= 0 || cover.bytes.length > PLAYLIST_COVER_MAX_BYTES) {
      return withApiCorsHeaders(
        NextResponse.json({ error: "Image must be smaller than 5 MB" }, { status: 400 }),
      )
    }

    const resolved =
      resolvePlaylistCoverMime(cover.contentTypeHint, cover.fileName) ||
      sniffPlaylistCoverBytes(cover.bytes)

    if (!resolved) {
      return withApiCorsHeaders(
        NextResponse.json({ error: "Use a JPG, PNG, or WebP image" }, { status: 400 }),
      )
    }

    const supabase = getSupabaseServer()
    const { data: playlist, error: playlistError } = await supabase
      .from("playlists")
      .select("id, user_id")
      .eq("id", playlistId)
      .maybeSingle()

    if (playlistError || !playlist) {
      return withApiCorsHeaders(NextResponse.json({ error: "Playlist not found" }, { status: 404 }))
    }
    if (playlist.user_id !== userId) {
      return withApiCorsHeaders(NextResponse.json({ error: "Forbidden" }, { status: 403 }))
    }

    const path = `playlists/${userId}/${playlistId}-${Date.now()}.${resolved.extension}`
    const { error: uploadError } = await supabase.storage.from("covers").upload(path, cover.bytes, {
      contentType: resolved.contentType,
      cacheControl: "3600",
      upsert: false,
    })

    if (uploadError) {
      return withApiCorsHeaders(
        NextResponse.json({ error: uploadError.message }, { status: 500 }),
      )
    }

    const { data: publicUrlData } = supabase.storage.from("covers").getPublicUrl(path)
    const coverUrl = publicUrlData.publicUrl
    const { error: updateError } = await supabase
      .from("playlists")
      .update({ cover_image: coverUrl, updated_at: new Date().toISOString() })
      .eq("id", playlistId)
      .eq("user_id", userId)

    if (updateError) {
      await supabase.storage.from("covers").remove([path])
      return withApiCorsHeaders(
        NextResponse.json({ error: updateError.message }, { status: 500 }),
      )
    }

    return withApiCorsHeaders(NextResponse.json({ ok: true, coverUrl }))
  } catch (error) {
    return withApiCorsHeaders(
      NextResponse.json(
        { error: error instanceof Error ? error.message : "Server error" },
        { status: 500 },
      ),
    )
  }
}
