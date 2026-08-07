import { getSupabase } from "@/lib/supabase/client"
import {
  getNativeBackendFetchFailureHint,
  nativeCrossOriginFetchInit,
  resolveApiUrl,
  shouldUseRemoteApiBase,
} from "@/lib/api-base"
import { getCachedResolvedApiBase, resolveNativeApiBase } from "@/lib/native-api-resolver"
import { preparePlaylistCover, preparedCoverToBase64 } from "@/lib/playlist-cover-prepare"

export type PlaylistTrack = {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  audioUrl: string
  coverUrl: string
  isPremium: boolean
  playlistSongId?: string
  position?: number
}

export type UserPlaylist = {
  id: string
  name: string
  description: string | null
  cover_image: string | null
  is_public: boolean
  user_id: string
  created_at: string
}

function mapSongRow(s: {
  id: string
  title: string
  duration?: number | null
  cover_image?: string | null
  audio_file_url?: string | null
}): PlaylistTrack {
  return {
    id: s.id,
    title: s.title,
    artist: "Artista",
    album: "",
    duration: s.duration || 0,
    audioUrl: s.audio_file_url || "",
    coverUrl: s.cover_image || "/abstract-soundscape.png",
    isPremium: false,
  }
}

/** Fetch playlists owned by the current user. */
export async function fetchMyPlaylists(userId: string): Promise<UserPlaylist[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("playlists")
    .select("id, user_id, name, description, cover_image, is_public, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)
  return (data ?? []) as UserPlaylist[]
}

/** Load songs in a playlist (ordered by position, then added_at). */
export async function fetchPlaylistTracks(playlistId: string): Promise<PlaylistTrack[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("playlist_songs")
    .select(
      `
      id,
      position,
      added_at,
      song_id,
      songs (
        id,
        title,
        duration,
        cover_image,
        audio_file_url
      )
    `,
    )
    .eq("playlist_id", playlistId)
    .order("position", { ascending: true })
    .order("added_at", { ascending: true })

  if (error) throw new Error(error.message)

  const tracks: PlaylistTrack[] = []
  for (const row of data ?? []) {
    const song = Array.isArray(row.songs) ? row.songs[0] : row.songs
    if (!song?.id) continue
    const mapped = mapSongRow(song)
    if (!mapped.audioUrl) continue
    tracks.push({
      ...mapped,
      playlistSongId: row.id,
      position: row.position,
    })
  }
  return tracks
}

export async function createPlaylist(input: {
  userId: string
  name: string
  description?: string | null
  isPublic?: boolean
}): Promise<UserPlaylist> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("playlists")
    .insert({
      user_id: input.userId,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      is_public: input.isPublic ?? false,
    })
    .select("id, user_id, name, description, cover_image, is_public, created_at")
    .single()

  if (error || !data) throw new Error(error?.message || "Failed to create playlist")
  return data as UserPlaylist
}

export async function addSongToPlaylist(playlistId: string, songId: string): Promise<void> {
  const supabase = getSupabase()

  const { count } = await supabase
    .from("playlist_songs")
    .select("id", { count: "exact", head: true })
    .eq("playlist_id", playlistId)

  const { error } = await supabase.from("playlist_songs").insert({
    playlist_id: playlistId,
    song_id: songId,
    position: count ?? 0,
  })

  if (error) {
    const isDuplicate =
      error.code === "23505" ||
      error.message.includes("playlist_songs_playlist_song_key") ||
      error.message.toLowerCase().includes("duplicate")
    if (isDuplicate) return
    throw new Error(error.message)
  }
}

export async function removeSongFromPlaylist(playlistId: string, songId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase
    .from("playlist_songs")
    .delete()
    .eq("playlist_id", playlistId)
    .eq("song_id", songId)

  if (error) throw new Error(error.message)
}

export async function deletePlaylist(playlistId: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from("playlists").delete().eq("id", playlistId)
  if (error) throw new Error(error.message)
}

export async function updatePlaylistDetails(
  playlistId: string,
  updates: { name: string; description?: string | null; isPublic: boolean },
): Promise<UserPlaylist> {
  const name = updates.name.trim()
  if (!name) throw new Error("El nombre de la playlist es obligatorio")

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from("playlists")
    .update({
      name,
      description: updates.description?.trim() || null,
      is_public: updates.isPublic,
      updated_at: new Date().toISOString(),
    })
    .eq("id", playlistId)
    .select("id, user_id, name, description, cover_image, is_public, created_at")
    .single()

  if (error || !data) throw new Error(error?.message || "No se pudo actualizar la playlist")
  return data as UserPlaylist
}

export async function uploadPlaylistCover(playlistId: string, file: File): Promise<string> {
  const prepared = await preparePlaylistCover(file)
  const supabase = getSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!session?.access_token || !userId) {
    throw new Error("Inicia sesión de nuevo para subir la imagen")
  }

  // 1) Direct Supabase upload — works on Capacitor without Next /api (needs storage policy).
  const path = `playlists/${userId}/${playlistId}-${Date.now()}.jpg`
  const { error: storageError } = await supabase.storage.from("covers").upload(path, prepared.blob, {
    contentType: prepared.contentType,
    cacheControl: "3600",
    upsert: false,
  })

  if (!storageError) {
    const { data: publicUrlData } = supabase.storage.from("covers").getPublicUrl(path)
    const coverUrl = publicUrlData.publicUrl
    const { error: updateError } = await supabase
      .from("playlists")
      .update({ cover_image: coverUrl, updated_at: new Date().toISOString() })
      .eq("id", playlistId)
      .eq("user_id", userId)

    if (updateError) {
      await supabase.storage.from("covers").remove([path])
      throw new Error(updateError.message || "No se pudo guardar la portada")
    }
    return coverUrl
  }

  // 2) Fallback: Next API with JSON base64 (service role). FormData is unreliable on Android WebView.
  if (shouldUseRemoteApiBase() && !getCachedResolvedApiBase()) {
    await resolveNativeApiBase()
  }

  const url = resolveApiUrl("/api/playlists/cover")
  if (!url) {
    throw new Error(
      storageError.message ||
        "No se pudo subir la imagen. Ejecuta docs/supabase-playlist-cover-storage.sql en Supabase, o despliega /api/playlists/cover en Vercel.",
    )
  }

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        playlistId,
        fileName: prepared.fileName,
        contentType: prepared.contentType,
        dataBase64: preparedCoverToBase64(prepared),
      }),
      ...nativeCrossOriginFetchInit,
    })
  } catch (err) {
    const hint = getNativeBackendFetchFailureHint()
    const base = err instanceof Error ? err.message : "Error de red"
    throw new Error(
      hint
        ? `${base}. ${hint}`
        : `${base}. También: ${storageError.message}`,
    )
  }

  const rawText = await response.text()
  let payload: { coverUrl?: string; error?: string } | null = null
  try {
    payload = JSON.parse(rawText) as { coverUrl?: string; error?: string }
  } catch {
    payload = null
  }

  if (!response.ok || !payload?.coverUrl) {
    if (response.status === 404 || rawText.trimStart().startsWith("<!DOCTYPE")) {
      throw new Error(
        `La API de portadas no está en el servidor (${response.status}). Despliega la app a Vercel, o ejecuta docs/supabase-playlist-cover-storage.sql para subir directo desde el móvil. (Storage: ${storageError.message})`,
      )
    }
    throw new Error(
      payload?.error ||
        `No se pudo subir la imagen (${response.status}). Storage: ${storageError.message}`,
    )
  }
  return payload.coverUrl
}

/** Capacitor/static-export safe URL (no dynamic [id] segment). */
export function playlistDetailHref(playlistId: string): string {
  return `/playlists?id=${encodeURIComponent(playlistId)}`
}
