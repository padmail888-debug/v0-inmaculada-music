/** Shared playlist cover validation for web + Capacitor (Android often sends empty MIME). */

/** Max size of the *processed* image we upload. */
export const PLAYLIST_COVER_MAX_BYTES = 5 * 1024 * 1024
/** Max size of the *raw* file the user may pick (we compress it down before upload). */
export const PLAYLIST_COVER_MAX_INPUT_BYTES = 40 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export function isLikelyHeic(mime: string | null | undefined, fileName?: string | null): boolean {
  const m = (mime || "").toLowerCase()
  const n = (fileName || "").toLowerCase()
  return (
    m.includes("heic") ||
    m.includes("heif") ||
    n.endsWith(".heic") ||
    n.endsWith(".heif")
  )
}

function extensionFromName(fileName: string): string | null {
  const n = fileName.toLowerCase()
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "jpg"
  if (n.endsWith(".png")) return "png"
  if (n.endsWith(".webp")) return "webp"
  return null
}

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

/** Resolve content-type + storage extension from MIME and/or filename. */
export function resolvePlaylistCoverMime(
  mime: string | null | undefined,
  fileName?: string | null,
): { contentType: string; extension: string } | null {
  const normalized = (mime || "").toLowerCase().split(";")[0].trim()
  const fromMime = MIME_TO_EXT[normalized]
  if (fromMime) {
    return { contentType: EXT_TO_MIME[fromMime], extension: fromMime }
  }

  const fromName = extensionFromName(fileName || "")
  if (fromName && EXT_TO_MIME[fromName]) {
    return { contentType: EXT_TO_MIME[fromName], extension: fromName }
  }
  return null
}

/** Sniff JPEG/PNG/WebP when Android WebView leaves type + name empty/odd. */
export function sniffPlaylistCoverBytes(
  bytes: Uint8Array,
): { contentType: string; extension: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", extension: "jpg" }
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { contentType: "image/png", extension: "png" }
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { contentType: "image/webp", extension: "webp" }
  }
  return null
}

/**
 * Client-side message before upload; null = OK.
 * Does NOT reject on the 5 MB output limit — large photos are compressed first.
 */
export function playlistCoverClientError(file: File): string | null {
  if (file.size <= 0) return "La imagen está vacía."
  if (file.size > PLAYLIST_COVER_MAX_INPUT_BYTES) {
    return "La imagen es demasiado grande. Elige una foto más pequeña."
  }
  if (isLikelyHeic(file.type, file.name)) {
    return "En el móvil, elige una foto JPG o PNG (HEIC no es compatible)."
  }
  if (resolvePlaylistCoverMime(file.type, file.name)) return null

  const type = (file.type || "").toLowerCase()
  // Android WebView often omits MIME — let the API sniff magic bytes.
  if (!type || type === "application/octet-stream") return null
  if (type.startsWith("image/")) return null
  return "Usa una imagen JPG, PNG o WebP."
}
