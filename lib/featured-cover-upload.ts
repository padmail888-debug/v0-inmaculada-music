"use client"

import {
  getNativeBackendFetchFailureHint,
  nativeCrossOriginFetchInit,
  resolveApiUrl,
  shouldUseRemoteApiBase,
} from "@/lib/api-base"
import { getCachedResolvedApiBase, resolveNativeApiBase } from "@/lib/native-api-resolver"
import { preparePlaylistCover, preparedCoverToBase64 } from "@/lib/playlist-cover-prepare"
import { getSupabase } from "@/lib/supabase/client"

/**
 * Compress (resize) a featured banner image and upload to Storage.
 * Returns a public URL for `featured_content.image_url`.
 */
export async function uploadFeaturedImage(file: File): Promise<string> {
  const prepared = await preparePlaylistCover(file)
  const supabase = getSupabase()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const userId = session?.user?.id
  if (!session?.access_token || !userId) {
    throw new Error("Inicia sesión de nuevo para subir la imagen")
  }

  const path = `featured/${userId}/${Date.now()}.jpg`
  const { error: storageError } = await supabase.storage.from("covers").upload(path, prepared.blob, {
    contentType: prepared.contentType,
    cacheControl: "3600",
    upsert: false,
  })

  if (!storageError) {
    const { data: publicUrlData } = supabase.storage.from("covers").getPublicUrl(path)
    return publicUrlData.publicUrl
  }

  if (shouldUseRemoteApiBase() && !getCachedResolvedApiBase()) {
    await resolveNativeApiBase()
  }

  const url = resolveApiUrl("/api/admin/featured/cover")
  if (!url) {
    throw new Error(
      storageError.message ||
        "No se pudo subir la imagen. Ejecuta docs/supabase-featured-cover-storage.sql en Supabase.",
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
        fileName: prepared.fileName,
        contentType: prepared.contentType,
        dataBase64: preparedCoverToBase64(prepared),
      }),
      ...nativeCrossOriginFetchInit,
    })
  } catch (err) {
    const hint = getNativeBackendFetchFailureHint()
    const base = err instanceof Error ? err.message : "Error de red"
    throw new Error(hint ? `${base}. ${hint}` : `${base}. Storage: ${storageError.message}`)
  }

  const payload = (await response.json().catch(() => null)) as {
    imageUrl?: string
    error?: string
  } | null

  if (!response.ok || !payload?.imageUrl) {
    throw new Error(
      payload?.error ||
        `No se pudo subir la imagen (${response.status}). Ejecuta docs/supabase-featured-cover-storage.sql. (Storage: ${storageError.message})`,
    )
  }

  return payload.imageUrl
}
