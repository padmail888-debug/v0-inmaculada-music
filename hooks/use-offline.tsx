"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import { offlineStorage } from "@/lib/offline-storage"

interface OfflineContextType {
  isOnline: boolean
  downloadTrack: (track: any) => Promise<boolean>
  isTrackDownloaded: (trackId: string) => Promise<boolean>
  getOfflineTrack: (trackId: string) => Promise<any>
  removeDownload: (trackId: string) => Promise<boolean>
  offlineTracks: any[]
  storageUsage: { used: number; quota: number }
  refreshOfflineTracks: () => Promise<void>
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined)

export function OfflineProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(true)
  const [offlineTracks, setOfflineTracks] = useState<any[]>([])
  const [storageUsage, setStorageUsage] = useState({ used: 0, quota: 0 })

  useEffect(() => {
    // Initialize offline storage
    offlineStorage.init().then(() => {
      console.log("[v0] Offline storage initialized")
      refreshOfflineTracks()
      updateStorageUsage()
    })

    // Monitor online status
    const handleOnline = () => {
      console.log("[v0] App is online")
      setIsOnline(true)
    }
    const handleOffline = () => {
      console.log("[v0] App is offline")
      setIsOnline(false)
    }

    setIsOnline(navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const downloadTrack = async (track: any): Promise<boolean> => {
    try {
      console.log("[v0] Downloading track:", track.title)
      const success = await offlineStorage.downloadTrack(track, track.audioUrl)
      if (success) {
        await refreshOfflineTracks()
        await updateStorageUsage()
      }
      return success
    } catch (error) {
      console.error("[v0] Download error:", error)
      return false
    }
  }

  const isTrackDownloaded = async (trackId: string): Promise<boolean> => {
    return await offlineStorage.isTrackDownloaded(trackId)
  }

  const getOfflineTrack = async (trackId: string) => {
    return await offlineStorage.getOfflineTrack(trackId)
  }

  const removeDownload = async (trackId: string): Promise<boolean> => {
    const success = await offlineStorage.removeOfflineTrack(trackId)
    if (success) {
      await refreshOfflineTracks()
      await updateStorageUsage()
    }
    return success
  }

  const refreshOfflineTracks = async () => {
    try {
      const tracks = await offlineStorage.getAllOfflineTracks()
      setOfflineTracks(tracks)
      console.log("[v0] Refreshed offline tracks:", tracks.length)
    } catch (error) {
      console.error("[v0] Error refreshing offline tracks:", error)
    }
  }

  const updateStorageUsage = async () => {
    try {
      const usage = await offlineStorage.getStorageUsage()
      setStorageUsage(usage)
    } catch (error) {
      console.error("[v0] Error getting storage usage:", error)
    }
  }

  return (
    <OfflineContext.Provider
      value={{
        isOnline,
        downloadTrack,
        isTrackDownloaded,
        getOfflineTrack,
        removeDownload,
        offlineTracks,
        storageUsage,
        refreshOfflineTracks,
      }}
    >
      {children}
    </OfflineContext.Provider>
  )
}

export function useOffline() {
  const context = useContext(OfflineContext)
  if (context === undefined) {
    throw new Error("useOffline must be used within an OfflineProvider")
  }
  return context
}
