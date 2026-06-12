"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useAuth } from "@/hooks/use-auth"
import { getSupabase } from "@/lib/supabase/client"

interface LikesContextType {
  likedTracks: Set<string>
  toggleLike: (trackId: string) => void
  isLiked: (trackId: string) => boolean
  getLikedTracksArray: () => string[]
}

const LikesContext = createContext<LikesContextType | undefined>(undefined)

export function LikesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [likedTracks, setLikedTracks] = useState<Set<string>>(new Set())

  // Load liked tracks for the current user from Supabase
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.id) {
        setLikedTracks(new Set())
        return
      }
      try {
        const supabase = getSupabase()
        const { data, error } = await supabase
          .from("favorite_songs")
          .select("song_id")
          .eq("user_id", user.id)

        if (error) {
          console.error("Error loading favorite songs:", error.message)
          return
        }

        const ids = (data || []).map((row: { song_id: string }) => row.song_id)
        setLikedTracks(new Set(ids))
      } catch (err) {
        console.error("Error loading favorite songs:", err)
      }
    }

    void loadFavorites()
  }, [user?.id])

  const toggleLike = (trackId: string) => {
    setLikedTracks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(trackId)) {
        newSet.delete(trackId)
      } else {
        newSet.add(trackId)
      }
      return newSet
    })
  }

  const isLiked = (trackId: string) => {
    return likedTracks.has(trackId)
  }

  const getLikedTracksArray = () => {
    return Array.from(likedTracks)
  }

  return (
    <LikesContext.Provider value={{ likedTracks, toggleLike, isLiked, getLikedTracksArray }}>
      {children}
    </LikesContext.Provider>
  )
}

export function useLikes() {
  const context = useContext(LikesContext)
  if (context === undefined) {
    throw new Error("useLikes must be used within a LikesProvider")
  }
  return context
}
