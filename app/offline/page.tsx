"use client"
export const dynamic = 'force-dynamic'



import { useAuth } from "@/hooks/use-auth"
import { useOffline } from "@/hooks/use-offline"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { AppShell } from "@/components/layout/app-shell"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Download, Trash2, Play } from "lucide-react"

export default function OfflinePage() {
  const { user } = useAuth()
  const { offlineTracks, removeDownload, storageUsage } = useOffline()
  const { playTrack } = useMusicPlayer()

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleRemoveDownload = async (trackId: string) => {
    await removeDownload(trackId)
  }

  const handlePlayOfflineTrack = (trackId: string) => {
    if (!offlineTracks.length) return

    const playableQueue = offlineTracks.map((track: any) => ({
      id: track.id,
      title: track.title,
      artist: track.artist,
      album: track.album,
      duration: track.duration || 0,
      audioUrl: URL.createObjectURL(track.audioBlob),
      coverUrl: track.coverUrl,
      isPremium: false,
    }))

    const startIndex = playableQueue.findIndex((t) => t.id === trackId)
    if (startIndex === -1) return

    const startTrack = playableQueue[startIndex]
    playTrack(startTrack, playableQueue)
  }

  if (!user || user.role === "free") {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-4">Modo Offline Premium</h1>
          <p className="text-slate-300 mb-6 text-sm sm:text-base">Actualiza a Premium para descargar música</p>
          <Link href="/subscription">
            <Button className="bg-green-500 hover:bg-green-600">Actualizar a Premium</Button>
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Música Offline</h1>
        <p className="text-slate-300 mb-4 text-sm sm:text-base">{offlineTracks.length} canciones descargadas</p>

        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
          <h3 className="font-semibold mb-2">Almacenamiento</h3>
          <p className="text-sm text-slate-300">
            Usado: {formatBytes(storageUsage.used)} / {formatBytes(storageUsage.quota)}
          </p>
          <div className="w-full bg-slate-700 rounded-full h-2 mt-2">
            <div
              className="bg-green-500 h-2 rounded-full"
              style={{ width: `${(storageUsage.used / storageUsage.quota) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {offlineTracks.length === 0 ? (
        <div className="text-center py-12">
          <Download className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold mb-2">No hay música offline</h3>
          <p className="text-slate-400 text-sm sm:text-base">Descarga canciones para escucharlas sin conexión</p>
        </div>
      ) : (
        <div className="space-y-2">
          {offlineTracks.map((track) => (
            <Card
              key={track.id}
              className="bg-white/5 backdrop-blur-sm border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <div className="p-3 sm:p-4 flex flex-wrap items-center gap-3 sm:gap-4">
                <img
                  src={track.coverUrl || "/placeholder.svg"}
                  alt={track.album}
                  className="w-12 h-12 rounded object-cover shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">{track.title}</h3>
                  <p className="text-sm text-slate-300 truncate">{track.artist}</p>
                  <p className="text-xs text-slate-400 truncate">{track.album}</p>
                </div>

                <div className="flex items-center gap-2 ml-auto shrink-0">
                  <span className="text-xs text-slate-400">{formatDuration(track.duration)}</span>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePlayOfflineTrack(track.id)}
                    className="text-slate-400 hover:text-white min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                  >
                    <Play className="h-4 w-4" />
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveDownload(track.id)}
                    className="text-red-400 hover:text-red-300 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </AppShell>
  )
}
