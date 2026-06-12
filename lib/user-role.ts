import type { User, UserRole } from "@/lib/auth-types"
import { decodeJwtPayload } from "@/lib/jwt-decode"

const ROLE_TIER: Record<UserRole, number> = {
  free: 0,
  premium: 1,
  artist: 2,
  "artist-pro": 3,
  superadmin: 4,
}

/** Map Supabase / Stripe app_metadata.role strings to app UserRole. */
export function mapSupabaseRoleToUserRole(rawRole?: string | null): UserRole {
  const role = (rawRole ?? "").toLowerCase().trim()
  if (!role) return "free"

  if (role.includes("super")) return "superadmin"
  if (role.includes("artist") && role.includes("pro")) return "artist-pro"
  if (role === "pro" || role.endsWith(" pro")) return "artist-pro"
  if (role.includes("artist")) return "artist"
  if (role.includes("paid") || role.includes("premium")) return "premium"

  if (role === "free") return "free"

  return "free"
}

/** Highest tier among all raw role strings (never downgrade paid → free when one source is stale). */
export function pickBestUserRole(...rawRoles: (string | null | undefined)[]): UserRole {
  let best: UserRole = "free"
  for (const raw of rawRoles) {
    const mapped = mapSupabaseRoleToUserRole(raw)
    if (ROLE_TIER[mapped] > ROLE_TIER[best]) best = mapped
  }
  return best
}

export function hasPaidAccess(role: UserRole | string | null | undefined): boolean {
  return mapSupabaseRoleToUserRole(role ?? undefined) !== "free"
}

export function shouldShowUpgradePrompt(role: UserRole | string | null | undefined): boolean {
  return !hasPaidAccess(role)
}

/** Whether the upgrade CTA should be hidden for this user. */
export function userShouldHideUpgradePrompt(user: User | null | undefined): boolean {
  if (!user) return false
  if (hasPaidAccess(user.role)) return true
  if (user.subscription?.status === "active") return true
  return false
}

/** Prefer app_metadata (Stripe webhook) over user_metadata (often stale "free" from signup). */
export function resolveRawRoleFromAuthUser(
  appMetadata?: Record<string, unknown> | null,
  userMetadata?: Record<string, unknown> | null,
  serverRole?: string | null,
  fallbackRole?: string | null,
): string | undefined {
  const appMeta = appMetadata ?? {}
  const userMeta = userMetadata ?? {}
  return (
    serverRole ??
    (appMeta.role as string | undefined) ??
    (userMeta.role as string | undefined) ??
    fallbackRole ??
    undefined
  )
}

export function roleFromAccessToken(accessToken: string | null | undefined): UserRole | null {
  if (!accessToken) return null
  const claims = decodeJwtPayload<{
    app_metadata?: Record<string, unknown>
    user_metadata?: Record<string, unknown>
  }>(accessToken)
  if (!claims) return null
  return pickBestUserRole(
    claims.app_metadata?.role as string | undefined,
    claims.user_metadata?.role as string | undefined,
  )
}
