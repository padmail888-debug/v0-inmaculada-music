"use client"

import { playlistCoverClientError } from "@/lib/playlist-cover-image"

export type PreparedPlaylistCover = {
  blob: Blob
  bytes: Uint8Array
  fileName: string
  contentType: string
}

/** Hard cap for the file we actually upload (must stay under API/storage limits). */
export const PLAYLIST_COVER_UPLOAD_MAX_BYTES = 512 * 1024 // 512 KB
/** Soft target — keep trying until we hit this or exhaust resize steps. */
const TARGET_BYTES = 400 * 1024 // 400 KB
const EDGE_STEPS = [1200, 960, 720, 540, 400, 320, 240]
const QUALITY_STEPS = [0.75, 0.65, 0.55, 0.45, 0.35, 0.25]

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = ""
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

async function blobToUint8(blob: Blob): Promise<Uint8Array> {
  return new Uint8Array(await blob.arrayBuffer())
}

function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(",")
  const mimeMatch = /data:([^;]+)/.exec(header || "")
  const mime = mimeMatch?.[1] || "image/jpeg"
  const binary = atob(data || "")
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Blob([bytes], { type: mime })
}

/** Read file as data URL — most reliable on Capacitor Android WebView. */
function readFileAsDataUrl(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result)
      else reject(new Error("No se pudo leer la imagen"))
    }
    reader.onerror = () => reject(new Error("No se pudo leer la imagen"))
    reader.readAsDataURL(file)
  })
}

function loadImageFromSrc(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error("No se pudo decodificar la imagen"))
    img.decoding = "async"
    img.src = src
  })
}

/**
 * Decode an image for canvas drawing.
 * Order: FileReader data-URL (Android-safe) → createImageBitmap → object URL.
 */
async function loadImageElement(file: File): Promise<{
  img: CanvasImageSource
  width: number
  height: number
  cleanup: () => void
}> {
  // 1) FileReader → <img> (works when createImageBitmap fails on Android)
  try {
    const dataUrl = await readFileAsDataUrl(file)
    const img = await loadImageFromSrc(dataUrl)
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    if (width > 0 && height > 0) {
      return { img, width, height, cleanup: () => undefined }
    }
  } catch {
    // continue
  }

  // 2) createImageBitmap
  try {
    const bitmap = await createImageBitmap(file)
    return {
      img: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      cleanup: () => bitmap.close(),
    }
  } catch {
    // continue
  }

  // 3) object URL
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImageFromSrc(objectUrl)
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height
    if (!width || !height) throw new Error("empty")
    return {
      img,
      width,
      height,
      cleanup: () => URL.revokeObjectURL(objectUrl),
    }
  } catch {
    URL.revokeObjectURL(objectUrl)
    throw new Error("No se pudo leer la imagen. Prueba con un JPG o PNG.")
  }
}

/** Prefer toBlob; fall back to toDataURL (Android WebView often has broken toBlob). */
async function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob | null> {
  const fromToBlob = await new Promise<Blob | null>((resolve) => {
    try {
      canvas.toBlob((result) => resolve(result), "image/jpeg", quality)
    } catch {
      resolve(null)
    }
  })
  if (fromToBlob && fromToBlob.size > 0) return fromToBlob

  try {
    const dataUrl = canvas.toDataURL("image/jpeg", quality)
    if (!dataUrl || !dataUrl.startsWith("data:image/jpeg")) return null
    const blob = dataUrlToBlob(dataUrl)
    return blob.size > 0 ? blob : null
  } catch {
    return null
  }
}

function drawScaled(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  width: number,
  height: number,
) {
  ctx.clearRect(0, 0, width, height)
  ctx.fillStyle = "#ffffff"
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(source, 0, 0, width, height)
}

/**
 * ALWAYS compress oversized (and normal) gallery photos to a small JPEG.
 * Never returns the original file — upload path only gets the compressed result.
 */
export async function preparePlaylistCover(file: File): Promise<PreparedPlaylistCover> {
  const clientError = playlistCoverClientError(file)
  if (clientError) throw new Error(clientError)

  const { img, width, height, cleanup } = await loadImageElement(file)
  const baseName = (file.name && file.name.includes(".") ? file.name : "playlist-cover.jpg").replace(
    /\.[^.]+$/,
    "",
  )

  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d", { alpha: false })
  if (!ctx) {
    cleanup()
    throw new Error("Este dispositivo no puede comprimir imágenes.")
  }

  let best: Blob | null = null

  try {
    for (const edge of EDGE_STEPS) {
      const scale = Math.min(1, edge / Math.max(width, height))
      const w = Math.max(1, Math.round(width * scale))
      const h = Math.max(1, Math.round(height * scale))
      canvas.width = w
      canvas.height = h
      drawScaled(ctx, img, w, h)

      for (const quality of QUALITY_STEPS) {
        const blob = await canvasToJpegBlob(canvas, quality)
        if (!blob) continue
        if (!best || blob.size < best.size) best = blob

        // Prefer the target size; accept anything under the hard upload cap.
        if (blob.size <= TARGET_BYTES) {
          const bytes = await blobToUint8(blob)
          return {
            blob,
            bytes,
            fileName: `${baseName}.jpg`,
            contentType: "image/jpeg",
          }
        }
      }
    }
  } finally {
    cleanup()
  }

  if (best && best.size <= PLAYLIST_COVER_UPLOAD_MAX_BYTES) {
    const bytes = await blobToUint8(best)
    return {
      blob: best,
      bytes,
      fileName: `${baseName}.jpg`,
      contentType: "image/jpeg",
    }
  }

  if (best) {
    throw new Error(
      `No se pudo reducir la imagen lo suficiente (${Math.round(best.size / 1024)} KB). Prueba otra foto.`,
    )
  }

  throw new Error("No se pudo comprimir la imagen. Prueba con un JPG o PNG.")
}

export function preparedCoverToBase64(prepared: PreparedPlaylistCover): string {
  return uint8ToBase64(prepared.bytes)
}
