import { getSupabaseServer } from "@/lib/supabase/server"

function decodeJwtPayload(token: string): { sub?: string } | null {
  try {
    const parts = token.trim().split(".")
    if (parts.length !== 3) return null
    const decoded = Buffer.from(parts[1], "base64url").toString("utf-8")
    return JSON.parse(decoded) as { sub?: string }
  } catch {
    return null
  }
}

export async function getAuthedUserIdFromRequest(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization") || request.headers.get("Authorization")
  let token = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null
  if (!token) {
    try {
      const cloned = request.clone()
      const body = await cloned.json().catch(() => ({}))
      if (typeof body?.accessToken === "string" && body.accessToken.trim()) {
        token = body.accessToken.trim()
      }
    } catch {
      // ignore
    }
  }
  if (!token) return null
  const payload = decodeJwtPayload(token)
  const userId = payload?.sub
  if (!userId) return null

  const supabase = getSupabaseServer()
  const { data, error } = await supabase.auth.admin.getUserById(userId)
  if (error || !data?.user) return null
  return data.user.id
}
