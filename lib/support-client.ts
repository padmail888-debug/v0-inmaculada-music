import { nativeCrossOriginFetchInit, resolveApiUrl } from "@/lib/api-base"
import { SUPPORT_EMAIL } from "@/lib/brand"

export function buildSupportMailto(subject: string, body: string) {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

export async function submitSupportMessage(payload: {
  name?: string
  email: string
  category?: string
  subject: string
  message: string
  device?: string
}) {
  try {
    const url = resolveApiUrl("/api/support")
    if (url) {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        ...nativeCrossOriginFetchInit,
      })
    }
  } catch {
    // Mail client is the delivery path if the API is unavailable.
  }

  window.location.href = buildSupportMailto(
    payload.subject,
    [
      payload.name ? `Nombre: ${payload.name}` : null,
      `Email: ${payload.email}`,
      payload.category ? `Categoría: ${payload.category}` : null,
      payload.device ? `Dispositivo: ${payload.device}` : null,
      "",
      payload.message,
    ]
      .filter(Boolean)
      .join("\n"),
  )
}
