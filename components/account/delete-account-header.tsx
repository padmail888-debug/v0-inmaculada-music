"use client"

import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { useAuth } from "@/hooks/use-auth"

/** Back fallback: artist profile for artists, listener profile otherwise. */
export function DeleteAccountHeader() {
  const { user } = useAuth()
  const isArtist = user?.role === "artist" || user?.role === "artist-pro"
  return <PublicSiteHeader showBack backHref={isArtist ? "/artist/profile" : "/profile"} />
}
