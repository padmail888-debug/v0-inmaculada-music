/** Decode JWT payload in browser or Node (no signature verification). */
export function decodeJwtPayload<T extends Record<string, unknown> = Record<string, unknown>>(
  token: string,
): T | null {
  try {
    const parts = token.trim().split(".")
    if (parts.length !== 3) return null
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
    const json =
      typeof atob !== "undefined"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8")
    return JSON.parse(json) as T
  } catch {
    return null
  }
}
