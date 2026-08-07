"use client"

import { useEffect, useState } from "react"
import { ListMusic, Loader2, Plus } from "lucide-react"
import {
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/hooks/use-auth"
import {
  addSongToPlaylist,
  createPlaylist,
  fetchMyPlaylists,
  type UserPlaylist,
} from "@/lib/playlists"

type AddToPlaylistSubmenuProps = {
  songId: string
  songTitle?: string
  onAdded?: (playlistName: string) => void
  onError?: (message: string) => void
}

/**
 * Dropdown submenu: pick one of the user's playlists (or create a quick one)
 * and add the given song.
 */
export function AddToPlaylistSubmenu({
  songId,
  songTitle,
  onAdded,
  onError,
}: AddToPlaylistSubmenuProps) {
  const { user } = useAuth()
  const [playlists, setPlaylists] = useState<UserPlaylist[]>([])
  const [loading, setLoading] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  const loadPlaylists = async () => {
    if (!user?.id || loaded) return
    setLoading(true)
    try {
      const rows = await fetchMyPlaylists(user.id)
      setPlaylists(rows)
      setLoaded(true)
    } catch (err) {
      console.error("Failed to load playlists:", err)
      onError?.(err instanceof Error ? err.message : "Error al cargar playlists")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setLoaded(false)
    setPlaylists([])
  }, [user?.id])

  const handleAdd = async (playlist: UserPlaylist) => {
    if (!user?.id || busyId) return
    setBusyId(playlist.id)
    try {
      await addSongToPlaylist(playlist.id, songId)
      onAdded?.(playlist.name)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al añadir a la playlist"
      console.error(msg, err)
      onError?.(msg)
    } finally {
      setBusyId(null)
    }
  }

  const handleCreateAndAdd = async () => {
    if (!user?.id || busyId) return
    const name = songTitle
      ? `Playlist · ${songTitle.slice(0, 40)}`
      : `Mi playlist ${new Date().toLocaleDateString()}`
    setBusyId("__new__")
    try {
      const playlist = await createPlaylist({
        userId: user.id,
        name,
        description: "Creada desde una canción",
        isPublic: false,
      })
      await addSongToPlaylist(playlist.id, songId)
      setPlaylists((prev) => [playlist, ...prev])
      onAdded?.(playlist.name)
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error al crear playlist"
      console.error(msg, err)
      onError?.(msg)
    } finally {
      setBusyId(null)
    }
  }

  if (!user?.id) {
    return (
      <DropdownMenuItem disabled className="text-slate-400">
        <ListMusic className="mr-2 h-4 w-4" />
        Inicia sesión para guardar en playlists
      </DropdownMenuItem>
    )
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        className="text-white hover:bg-slate-700"
        onPointerEnter={() => void loadPlaylists()}
      >
        <ListMusic className="mr-2 h-4 w-4" />
        Añadir a playlist
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-h-72 w-56 overflow-y-auto border-slate-700 bg-slate-800">
        {loading && (
          <DropdownMenuItem disabled className="text-slate-300">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Cargando…
          </DropdownMenuItem>
        )}
        {!loading &&
          playlists.map((playlist) => (
            <DropdownMenuItem
              key={playlist.id}
              className="text-white hover:bg-slate-700"
              disabled={busyId === playlist.id}
              onClick={(e) => {
                e.stopPropagation()
                void handleAdd(playlist)
              }}
            >
              {busyId === playlist.id ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ListMusic className="mr-2 h-4 w-4" />
              )}
              <span className="truncate">{playlist.name}</span>
            </DropdownMenuItem>
          ))}
        {!loading && playlists.length === 0 && (
          <DropdownMenuItem disabled className="text-slate-400">
            Aún no tienes playlists
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator className="bg-slate-700" />
        <DropdownMenuItem
          className="text-white hover:bg-slate-700"
          disabled={busyId === "__new__"}
          onClick={(e) => {
            e.stopPropagation()
            void handleCreateAndAdd()
          }}
        >
          {busyId === "__new__" ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Crear playlist nueva
        </DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  )
}
