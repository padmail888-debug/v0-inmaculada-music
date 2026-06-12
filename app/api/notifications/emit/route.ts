import { NextResponse } from "next/server"
import { handleApiCorsPreflight } from "@/lib/api-cors"
import { getAuthedUserIdFromRequest } from "@/lib/server-auth"
import { createAndDispatchNotification } from "@/lib/notification-service"
import { getSupabaseServer } from "@/lib/supabase/server"

export function OPTIONS() {
  return handleApiCorsPreflight()
}

async function getArtistOwnerUserId(artistId: string): Promise<string | null> {
  const supabase = getSupabaseServer()
  const { data, error } = await supabase.from("artists").select("user_id").eq("id", artistId).maybeSingle()
  if (error || !data?.user_id) return null
  return data.user_id as string
}

async function getFollowerUserIds(artistId: string): Promise<string[]> {
  const supabase = getSupabaseServer()
  const { data, error } = await supabase.from("favorite_artists").select("user_id").eq("artist_id", artistId)
  if (error || !data) return []
  return data.map((r: { user_id: string }) => r.user_id)
}

function followerRecipients(followerIds: string[], excludeUserId: string): string[] {
  const set = new Set(followerIds.filter(Boolean))
  set.delete(excludeUserId)
  return [...set]
}

async function getSongArtistUserId(songId: string): Promise<string | null> {
  const supabase = getSupabaseServer()
  const { data, error } = await supabase.from("songs").select("artist_id").eq("id", songId).maybeSingle()
  if (error || !data?.artist_id) return null
  return getArtistOwnerUserId(data.artist_id as string)
}

export async function POST(request: Request) {
  try {
    const actorUserId = await getAuthedUserIdFromRequest(request)
    if (!actorUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const type = typeof body.type === "string" ? body.type : ""
    const metadata = (body.metadata ?? {}) as Record<string, unknown>

    switch (type) {
      case "song_liked": {
        const songId = String(metadata.songId || "")
        const songTitle = String(metadata.songTitle || "tu canción")
        if (!songId) return NextResponse.json({ error: "songId is required" }, { status: 400 })
        const artistUserId = await getSongArtistUserId(songId)
        if (!artistUserId || artistUserId === actorUserId) return NextResponse.json({ ok: true })
        const result = await createAndDispatchNotification({
          type: "song_liked",
          title: "A alguien le gustó tu canción",
          message: `Tu canción "${songTitle}" recibió un nuevo me gusta.`,
          recipientUserIds: [artistUserId],
          deepLink: "/artist/profile",
          metadata: { songId, actorUserId },
        })
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
        return NextResponse.json({ ok: true, result })
      }

      case "new_follower": {
        const artistId = String(metadata.artistId || "")
        if (!artistId) return NextResponse.json({ error: "artistId is required" }, { status: 400 })
        const artistOwnerUserId = await getArtistOwnerUserId(artistId)
        if (!artistOwnerUserId || artistOwnerUserId === actorUserId) return NextResponse.json({ ok: true })
        const result = await createAndDispatchNotification({
          type: "new_follower",
          title: "Tienes un nuevo seguidor",
          message: "Alguien comenzó a seguir tu perfil de artista.",
          recipientUserIds: [artistOwnerUserId],
          deepLink: "/artist/profile",
          metadata: { artistId, actorUserId },
        })
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
        return NextResponse.json({ ok: true, result })
      }

      case "new_song_release": {
        const artistId = String(metadata.artistId || "")
        const songId = String(metadata.songId || "")
        const songTitle = String(metadata.songTitle || "Nueva canción")
        if (!artistId || !songId) return NextResponse.json({ error: "artistId and songId are required" }, { status: 400 })
        const followers = await getFollowerUserIds(artistId)
        const recipients = followerRecipients(followers, actorUserId)
        if (recipients.length === 0) return NextResponse.json({ ok: true })
        const result = await createAndDispatchNotification({
          type: "new_song_release",
          title: "Nueva canción disponible",
          message: `Tu artista seguido lanzó "${songTitle}".`,
          recipientUserIds: recipients,
          deepLink: `/search?q=${encodeURIComponent(songTitle)}`,
          metadata: { artistId, songId },
        })
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
        return NextResponse.json({ ok: true, result })
      }

      case "new_album_release": {
        const artistId = String(metadata.artistId || "")
        const albumId = String(metadata.albumId || "")
        const albumTitle = String(metadata.albumTitle || "Nuevo álbum")
        if (!artistId || !albumId) return NextResponse.json({ error: "artistId and albumId are required" }, { status: 400 })
        const followers = await getFollowerUserIds(artistId)
        const recipients = followerRecipients(followers, actorUserId)
        if (recipients.length === 0) return NextResponse.json({ ok: true })
        const result = await createAndDispatchNotification({
          type: "new_album_release",
          title: "Nuevo álbum disponible",
          message: `Tu artista seguido lanzó el álbum "${albumTitle}".`,
          recipientUserIds: recipients,
          deepLink: `/search?q=${encodeURIComponent(albumTitle)}`,
          metadata: { artistId, albumId },
        })
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
        return NextResponse.json({ ok: true, result })
      }

      case "artist_pro_feature_used": {
        const feature = String(metadata.feature || "Función Pro")
        const result = await createAndDispatchNotification({
          type: "artist_pro_feature_used",
          title: "Uso de ventaja Artist Pro",
          message: `Se usó la ventaja Pro: ${feature}.`,
          recipientUserIds: [actorUserId],
          deepLink: "/artist/profile",
          metadata: { feature },
        })
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
        return NextResponse.json({ ok: true, result })
      }

      case "account":
      case "security_alert": {
        const result = await createAndDispatchNotification({
          type,
          title: String(body.title || (type === "account" ? "Actualización de cuenta" : "Alerta de seguridad")),
          message: String(body.message || "Tenemos una actualización importante para tu cuenta."),
          recipientUserIds: [actorUserId],
          deepLink: type === "account" ? "/profile" : null,
          metadata,
        })
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
        return NextResponse.json({ ok: true, result })
      }

      case "payment_success": {
        const result = await createAndDispatchNotification({
          type: "payment_success",
          title: String(body.title || "Pago completado correctamente"),
          message: String(body.message || "Tu pago se procesó correctamente."),
          recipientUserIds: [actorUserId],
          deepLink: String(metadata.deepLink || "/dashboard"),
          metadata: { ...metadata, source: metadata.source ?? "emit" },
        })
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
        return NextResponse.json({ ok: true, result })
      }

      case "payment_failed": {
        const result = await createAndDispatchNotification({
          type: "payment_failed",
          title: String(body.title || "Pago no completado"),
          message: String(body.message || "No pudimos procesar tu pago. Revisa tu método de pago."),
          recipientUserIds: [actorUserId],
          deepLink: "/subscription",
          metadata: { ...metadata, source: metadata.source ?? "emit" },
        })
        if (!result.ok) return NextResponse.json({ error: result.error }, { status: 500 })
        return NextResponse.json({ ok: true, result })
      }

      default:
        return NextResponse.json({ error: "Unsupported notification type" }, { status: 400 })
    }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 })
  }
}
