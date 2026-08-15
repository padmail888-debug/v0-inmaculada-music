"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  audioUrl: string
  coverUrl: string
  isPremium: boolean
}

interface MusicPlayerContextType {
  // Current state
  currentTrack: Track | null
  isPlaying: boolean
  queue: Track[]
  currentIndex: number

  // Playback modes
  isShuffled: boolean
  repeatMode: "none" | "one" | "all"

  // History
  playHistory: Track[]

  // Actions
  playTrack: (track: Track, playlist?: Track[]) => void
  playPause: () => void
  nextTrack: () => void
  previousTrack: () => void
  toggleShuffle: () => void
  toggleRepeat: () => void
  setQueue: (tracks: Track[], startIndex?: number) => void
  addToQueue: (track: Track) => void
  removeFromQueue: (index: number) => void
  clearPlayback: () => void
}

const MusicPlayerContext = createContext<MusicPlayerContextType | undefined>(undefined)

export function MusicPlayerProvider({ children }: { children: ReactNode }) {
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueueState] = useState<Track[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isShuffled, setIsShuffled] = useState(false)
  const [repeatMode, setRepeatMode] = useState<"none" | "one" | "all">("none")
  const [playHistory, setPlayHistory] = useState<Track[]>([])
  const [originalQueue, setOriginalQueue] = useState<Track[]>([])

  const shuffleArray = useCallback((array: Track[]) => {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }, [])

  const addToHistory = useCallback((track: Track) => {
    setPlayHistory((prev) => {
      const filtered = prev.filter((t) => t.id !== track.id)
      return [track, ...filtered].slice(0, 50) // Keep last 50 tracks
    })
  }, [])

  const playTrack = useCallback(
    (track: Track, playlist?: Track[]) => {
      setCurrentTrack(track)
      setIsPlaying(true)
      addToHistory(track)

      if (playlist && playlist.length > 0) {
        const trackIndex = playlist.findIndex((t) => t.id === track.id)
        setQueueState(playlist)
        setOriginalQueue(playlist)
        setCurrentIndex(trackIndex >= 0 ? trackIndex : 0)
        return
      }

      // No playlist passed: jump to track in existing queue, or replace queue with this track
      setQueueState((prev) => {
        const idx = prev.findIndex((t) => t.id === track.id)
        if (idx >= 0) {
          setCurrentIndex(idx)
          return prev
        }
        setOriginalQueue([track])
        setCurrentIndex(0)
        return [track]
      })
    },
    [addToHistory],
  )

  const playPause = useCallback(() => {
    setIsPlaying((prev) => !prev)
    console.log("[v0] Play/Pause toggled:", !isPlaying)
  }, [isPlaying])

  const nextTrack = useCallback(() => {
    if (queue.length === 0) return

    let nextIndex = currentIndex + 1

    if (repeatMode === "one") {
      // Stay on current track
      return
    } else if (nextIndex >= queue.length) {
      if (repeatMode === "all") {
        nextIndex = 0
      } else {
        setIsPlaying(false)
        return
      }
    }

    const upcoming = queue[nextIndex]
    if (upcoming) {
      setCurrentTrack(upcoming)
      setCurrentIndex(nextIndex)
      setIsPlaying(true)
      addToHistory(upcoming)
    }
  }, [queue, currentIndex, repeatMode, addToHistory])

  const previousTrack = useCallback(() => {
    if (queue.length === 0) return

    // If more than 3s in, restart current track
    // (actual seek is handled by player; here we only change track index)

    let prevIndex = currentIndex - 1

    if (prevIndex < 0) {
      if (repeatMode === "all") {
        prevIndex = queue.length - 1
      } else {
        return
      }
    }

    const previous = queue[prevIndex]
    if (previous) {
      setCurrentTrack(previous)
      setCurrentIndex(prevIndex)
      setIsPlaying(true)
      addToHistory(previous)
    }
  }, [queue, currentIndex, repeatMode, addToHistory])

  const toggleShuffle = useCallback(() => {
    const newShuffled = !isShuffled
    setIsShuffled(newShuffled)
    console.log("[v0] Shuffle toggled:", newShuffled)

    if (newShuffled) {
      // Create shuffled queue, keeping current track at current position
      const currentTrackData = currentTrack
      const otherTracks = originalQueue.filter((t) => t.id !== currentTrackData?.id)
      const shuffledOthers = shuffleArray(otherTracks)

      const newQueue = currentTrackData ? [currentTrackData, ...shuffledOthers] : shuffledOthers

      setQueueState(newQueue)
      setCurrentIndex(0)
    } else {
      // Restore original queue
      setQueueState(originalQueue)
      const originalIndex = originalQueue.findIndex((t) => t.id === currentTrack?.id)
      setCurrentIndex(originalIndex >= 0 ? originalIndex : 0)
    }
  }, [isShuffled, currentTrack, originalQueue, shuffleArray])

  const toggleRepeat = useCallback(() => {
    const modes: ("none" | "one" | "all")[] = ["none", "all", "one"]
    const currentModeIndex = modes.indexOf(repeatMode)
    const nextMode = modes[(currentModeIndex + 1) % modes.length]
    setRepeatMode(nextMode)
    console.log("[v0] Repeat mode:", nextMode)
  }, [repeatMode])

  const setQueue = useCallback((tracks: Track[], startIndex = 0) => {
    setQueueState(tracks)
    setOriginalQueue(tracks)
    setCurrentIndex(startIndex)
    if (tracks[startIndex]) {
      setCurrentTrack(tracks[startIndex])
    }
  }, [])

  const addToQueue = useCallback((track: Track) => {
    setQueueState((prev) => [...prev, track])
    setOriginalQueue((prev) => [...prev, track])
    console.log("[v0] Added to queue:", track.title)
  }, [])

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueueState((prev) => prev.filter((_, i) => i !== index))
      setOriginalQueue((prev) => prev.filter((_, i) => i !== index))

      if (index < currentIndex) {
        setCurrentIndex((prev) => prev - 1)
      } else if (index === currentIndex) {
        // If removing current track, play next one
        nextTrack()
      }
    },
    [currentIndex, nextTrack],
  )

  const clearPlayback = useCallback(() => {
    setCurrentTrack(null)
    setIsPlaying(false)
    setQueueState([])
    setOriginalQueue([])
    setCurrentIndex(0)
  }, [])

  const value: MusicPlayerContextType = {
    currentTrack,
    isPlaying,
    queue,
    currentIndex,
    isShuffled,
    repeatMode,
    playHistory,
    playTrack,
    playPause,
    nextTrack,
    previousTrack,
    toggleShuffle,
    toggleRepeat,
    setQueue,
    addToQueue,
    removeFromQueue,
    clearPlayback,
  }

  return <MusicPlayerContext.Provider value={value}>{children}</MusicPlayerContext.Provider>
}

export function useMusicPlayer() {
  const context = useContext(MusicPlayerContext)
  if (context === undefined) {
    throw new Error("useMusicPlayer must be used within a MusicPlayerProvider")
  }
  return context
}
