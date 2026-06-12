export type UserRole = "free" | "premium" | "artist" | "artist-pro" | "superadmin"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatar?: string
  bio?: string
  artistName?: string
  subscription: {
    plan: string
    status: "active" | "cancelled" | "expired"
    expiresAt: string
  } | null
}
