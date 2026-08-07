"use client"

import { useEffect, useState } from "react"
import { ListMusic, Loader2, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useAuth } from "@/hooks/use-auth"
import {
  addSongToPlaylist,
  createPlaylist,
  fetchMyPlaylists,
  type UserPlaylist,
} from "@/lib/playlists"

type AddToPlaylistButtonProps = {
  songId: string
  songTitle?: string
  /** Compact icon button (default) or labeled button */
  variant?: "icon" | "labeled"
  className?: string
  disabled?: boolean
}

/**
 * Add song to playlist — dialog works on mobile Capacitor (no window.prompt).
 */
export function AddToPlaylistButton({
  songId,
  songTitle,
  variant = "icon",
  className,
  disabled,
}: AddToPlaylistButtonProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")

  useEffect(() => {
    if (!open || !user?.id) return
    let cancelled = false
    setLoading(true)
    setMessage(null)
    setError(null)
    setCreating(false)
    setNewName("")
    void fetchMyPlaylists(user.id)
      .then((rows) => {
        if (!cancelled) setPlaylists(rows)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Error al cargar playlists")
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, user?.id])

  const handleAdd = async (playlist: UserPlaylist) => {
    if (!user?.id || busyId) return
    setBusyId(playlist.id)
    setError(null)
    setMessage(null)
    try {
      await addSongToPlaylist(playlist.id, songId)
      setMessage(`Añadida a “${playlist.name}”`)
      window.setTimeout(() => setOpen(false), 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al añadir a la playlist")
    } finally {
      setBusyId(null)
    }
  }

  const handleCreateAndAdd = async () => {
    if (!user?.id || busyId) return
    const name = newName.trim()
    if (!name) {
      setError("Escribe un nombre para la playlist")
      return
    }

    setBusyId("__new__")
    setError(null)
    setMessage(null)
    try {
      const playlist = await createPlaylist({
        userId: user.id,
        name,
        description: null,
        isPublic: false,
      })
      await addSongToPlaylist(playlist.id, songId)
      setPlaylists((prev) => [playlist, ...prev])
      setMessage(`Creada “${playlist.name}” y canción añadida`)
      setCreating(false)
      setNewName("")
      window.setTimeout(() => setOpen(false), 900)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al crear playlist")
    } finally {
      setBusyId(null)
    }
  }

  if (!user?.id) {
    return (
      <Button
        size="sm"
        variant="ghost"
        className={className ?? "min-h-[44px] min-w-[44px] text-slate-400"}
        disabled
        title="Inicia sesión para guardar en playlists"
      >
        <ListMusic className="h-4 w-4" />
      </Button>
    )
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={variant === "labeled" ? "outline" : "ghost"}
          className={
            className ??
            (variant === "labeled"
              ? "min-h-[44px] border-slate-600 text-slate-200 hover:bg-slate-800"
              : "min-h-[44px] min-w-[44px] text-slate-300 hover:bg-white/10 hover:text-white")
          }
          disabled={disabled}
          title="Añadir a playlist"
          aria-label="Añadir a playlist"
          onClick={(e) => e.stopPropagation()}
        >
          <ListMusic className="h-4 w-4 shrink-0" />
          {variant === "labeled" && (
            <span className="ml-2 whitespace-nowrap text-xs sm:text-sm">Añadir a playlist</span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="max-h-[85dvh] overflow-y-auto border-slate-700 bg-slate-800 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-white sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle className="text-white">Añadir a playlist</DialogTitle>
        </DialogHeader>
        {songTitle && (
          <p className="truncate text-sm text-slate-400">
            Canción: <span className="text-slate-200">{songTitle}</span>
          </p>
        )}

        {error && (
          <div className="rounded border border-red-700 bg-red-900/40 p-2 text-sm text-red-200">{error}</div>
        )}
        {message && (
          <div className="rounded border border-green-700 bg-green-900/40 p-2 text-sm text-green-200">
            {message}
          </div>
        )}

        <div className="max-h-[40vh] space-y-1 overflow-y-auto overscroll-contain sm:max-h-64">
          {loading && (
            <div className="flex items-center justify-center gap-2 py-6 text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" />
              Cargando playlists…
            </div>
          )}
          {!loading && playlists.length === 0 && !creating && (
            <p className="py-4 text-center text-sm text-slate-400">
              Aún no tienes playlists. Crea una abajo.
            </p>
          )}
          {!loading &&
            playlists.map((playlist) => (
              <button
                key={playlist.id}
                type="button"
                disabled={!!busyId}
                onClick={() => void handleAdd(playlist)}
                className="flex min-h-[48px] w-full touch-manipulation items-center gap-3 rounded-md px-3 py-3 text-left text-sm text-white active:bg-slate-700 hover:bg-slate-700 disabled:opacity-50"
              >
                {busyId === playlist.id ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                ) : (
                  <ListMusic className="h-4 w-4 shrink-0 text-purple-400" />
                )}
                <span className="min-w-0 flex-1 truncate font-medium">{playlist.name}</span>
              </button>
            ))}
        </div>

        {creating ? (
          <div className="space-y-3 border-t border-slate-700 pt-3">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre de la playlist"
              className="min-h-[48px] touch-manipulation border-slate-600 bg-slate-900 text-base text-white"
              autoFocus
              autoCapitalize="sentences"
              enterKeyHint="done"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleCreateAndAdd()
              }}
            />
            <div className="flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="min-h-[44px] flex-1 bg-purple-600 hover:bg-purple-700"
                disabled={!!busyId || !newName.trim()}
                onClick={() => void handleCreateAndAdd()}
              >
                {busyId === "__new__" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Crear y añadir
              </Button>
              <Button
                type="button"
                variant="outline"
                className="min-h-[44px] border-slate-600 text-slate-200"
                disabled={!!busyId}
                onClick={() => {
                  setCreating(false)
                  setNewName("")
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            className="min-h-[48px] w-full touch-manipulation bg-purple-600 hover:bg-purple-700"
            disabled={!!busyId}
            onClick={() => {
              setCreating(true)
              setNewName(songTitle ? `Con ${songTitle.slice(0, 28)}` : "")
              setError(null)
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Crear playlist nueva y añadir
          </Button>
        )}
      </DialogContent>
    </Dialog>
  )
}
