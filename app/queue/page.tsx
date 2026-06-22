"use client"
export const dynamic = 'force-dynamic'



import { useAuth } from "@/hooks/use-auth"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Play, X, GripVertical } from "lucide-react"

export default function QueuePage() {
  const { user } = useAuth()
  const { queue, currentIndex, playTrack, removeFromQueue, playHistory } = useMusicPlayer()

  if (!user) {
    return <div className="text-white p-4">Loading...</div>
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <AppShell>
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Cola de Reproducción</h1>
        <p className="text-slate-300 text-sm sm:text-base">Gestiona tu lista de reproducción actual</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Próximas canciones</h2>
          <div className="space-y-2">
            {queue.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 text-center">
                <p className="text-slate-400">No hay canciones en la cola</p>
              </Card>
            ) : (
              queue.map((track, index) => (
                <Card
                  key={`${track.id}-${index}`}
                  className={`bg-white/5 backdrop-blur-sm border-white/10 p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-4 group hover:bg-white/10 transition-colors ${
                    index === currentIndex ? "bg-green-500/20 border-green-500/30" : ""
                  }`}
                >
                  <div className="flex items-center gap-2 shrink-0">
                    <GripVertical className="hidden sm:block h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400 w-6">{index + 1}</span>
                  </div>

                  <img
                    src={track.coverUrl || "/placeholder.svg"}
                    alt={track.album}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover shrink-0"
                  />

                  <div className="flex-1 min-w-0 basis-[calc(100%-8rem)] sm:basis-auto">
                    <p className="font-medium text-white truncate">{track.title}</p>
                    <p className="text-sm text-slate-400 truncate">{track.artist}</p>
                  </div>

                  <span className="text-sm text-slate-400 shrink-0">{formatDuration(track.duration)}</span>

                  <div className="flex items-center gap-1 sm:gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity ml-auto">
                    {index !== currentIndex && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => playTrack(track, queue)}
                        className="text-slate-400 hover:text-white min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                      >
                        <Play className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFromQueue(index)}
                      className="text-slate-400 hover:text-red-400 min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>
        </section>

        <section>
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Reproducidas recientemente</h2>
          <div className="space-y-2">
            {playHistory.length === 0 ? (
              <Card className="bg-white/5 backdrop-blur-sm border-white/10 p-6 text-center">
                <p className="text-slate-400">No hay historial de reproducción</p>
              </Card>
            ) : (
              playHistory.slice(0, 10).map((track, index) => (
                <Card
                  key={`history-${track.id}-${index}`}
                  className="bg-white/5 backdrop-blur-sm border-white/10 p-3 sm:p-4 flex flex-wrap items-center gap-2 sm:gap-4 group hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => playTrack(track)}
                >
                  <span className="text-sm text-slate-400 w-6 shrink-0">{index + 1}</span>

                  <img
                    src={track.coverUrl || "/placeholder.svg"}
                    alt={track.album}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded object-cover shrink-0"
                  />

                  <div className="flex-1 min-w-0 basis-[calc(100%-8rem)] sm:basis-auto">
                    <p className="font-medium text-white truncate">{track.title}</p>
                    <p className="text-sm text-slate-400 truncate">{track.artist}</p>
                  </div>

                  <span className="text-sm text-slate-400 shrink-0">{formatDuration(track.duration)}</span>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-slate-400 hover:text-white sm:opacity-0 sm:group-hover:opacity-100 transition-opacity min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 ml-auto"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </Card>
              ))
            )}
          </div>
        </section>
      </div>
    </AppShell>
  )
}
