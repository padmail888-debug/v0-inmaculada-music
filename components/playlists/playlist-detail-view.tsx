"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ImageIcon, ListMusic, Pencil, Play, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useAuth } from "@/hooks/use-auth"
import { useMusicPlayer } from "@/hooks/use-music-player"
import { getSupabase } from "@/lib/supabase/client"
import { preparePlaylistCover } from "@/lib/playlist-cover-prepare"
import {
  deletePlaylist,
  fetchPlaylistTracks,
  removeSongFromPlaylist,
  updatePlaylistDetails,
  uploadPlaylistCover,
  type PlaylistTrack,
  type UserPlaylist,
} from "@/lib/playlists"

type PlaylistDetailViewProps = {
  playlistId: string
}

/**
 * Playlist detail — works on web and Capacitor (opened via /playlists?id=…).
 * Touch-friendly controls + padding for the bottom music player.
 */
export function PlaylistDetailView({ playlistId }: PlaylistDetailViewProps) {
  const router = useRouter()
  const { user } = useAuth()
  const { playTrack, addToQueue } = useMusicPlayer()

  const [playlist, setPlaylist] = useState<UserPlaylist | null>(null)
  const [tracks, setTracks] = useState<PlaylistTrack[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editIsPublic, setEditIsPublic] = useState(false)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
  const [compressingCover, setCompressingCover] = useState(false)
  const [coverSizeLabel, setCoverSizeLabel] = useState<string | null>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  const isOwner = !!user?.id && playlist?.user_id === user.id

  const load = useCallback(async () => {
    if (!playlistId) return
    setLoading(true)
    setError(null)
    try {
      const supabase = getSupabase()
      const { data: playlistRow, error: playlistError } = await supabase
        .from("playlists")
        .select("id, user_id, name, description, cover_image, is_public, created_at")
        .eq("id", playlistId)
        .maybeSingle()

      if (playlistError) throw new Error(playlistError.message)
      if (!playlistRow) {
        setError("Playlist no encontrada.")
        setPlaylist(null)
        setTracks([])
        return
      }

      setPlaylist(playlistRow as UserPlaylist)
      setEditName(playlistRow.name)
      setEditDescription(playlistRow.description || "")
      setEditIsPublic(!!playlistRow.is_public)
      const songRows = await fetchPlaylistTracks(playlistId)
      setTracks(songRows)
    } catch (err) {
      console.error("Error loading playlist:", err)
      setError(err instanceof Error ? err.message : "Error al cargar la playlist.")
      setPlaylist(null)
      setTracks([])
    } finally {
      setLoading(false)
    }
  }, [playlistId])

  useEffect(() => {
    void load()
  }, [load])

  const filteredTracks = tracks.filter(
    (song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const totalSeconds = tracks.reduce((sum, t) => sum + (t.duration || 0), 0)

  const handlePlay = (song: PlaylistTrack) => {
    playTrack(song, tracks)
  }

  const handleRemove = async (songId: string) => {
    if (!playlistId || !isOwner) return
    const previous = tracks
    setTracks((prev) => prev.filter((t) => t.id !== songId))
    try {
      await removeSongFromPlaylist(playlistId, songId)
    } catch (err) {
      setTracks(previous)
      setError(err instanceof Error ? err.message : "Error al quitar la canción.")
    }
  }

  const handleDeletePlaylist = async () => {
    if (!playlistId || !isOwner || deleting) return
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    try {
      await deletePlaylist(playlistId)
      router.push("/playlists")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al eliminar la playlist.")
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  const cancelEdit = () => {
    if (coverPreview) URL.revokeObjectURL(coverPreview)
    setCoverPreview(null)
    setCoverFile(null)
    setCoverSizeLabel(null)
    setCompressingCover(false)
    setEditName(playlist?.name || "")
    setEditDescription(playlist?.description || "")
    setEditIsPublic(!!playlist?.is_public)
    setEditing(false)
    setError(null)
  }

  const handleCoverSelected = async (file: File | undefined) => {
    // Reset so the same gallery image can be re-picked on Android.
    if (coverInputRef.current) coverInputRef.current.value = ""
    if (!file) return

    setCompressingCover(true)
    setError(null)
    try {
      // Always compress on the device before upload (large camera photos → ~400 KB JPEG).
      const prepared = await preparePlaylistCover(file)
      const compressed = new File([prepared.blob], prepared.fileName, {
        type: prepared.contentType,
        lastModified: Date.now(),
      })
      if (coverPreview) URL.revokeObjectURL(coverPreview)
      setCoverFile(compressed)
      setCoverPreview(URL.createObjectURL(prepared.blob))
      setCoverSizeLabel(`${Math.max(1, Math.round(prepared.blob.size / 1024))} KB`)
    } catch (err) {
      setCoverFile(null)
      setCoverSizeLabel(null)
      setError(err instanceof Error ? err.message : "No se pudo comprimir la imagen.")
    } finally {
      setCompressingCover(false)
    }
  }

  const startEditing = () => {
    setConfirmDelete(false)
    setEditing(true)
    // Bring the form into view above the bottom player on phones.
    window.setTimeout(() => {
      document.getElementById("playlist-edit-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      })
    }, 50)
  }

  const handleSaveDetails = async () => {
    if (!playlist || !isOwner || saving || compressingCover || !editName.trim()) return
    setSaving(true)
    setError(null)
    try {
      let coverUrl = playlist.cover_image
      if (coverFile) {
        coverUrl = await uploadPlaylistCover(playlist.id, coverFile)
      }
      const updated = await updatePlaylistDetails(playlist.id, {
        name: editName,
        description: editDescription,
        isPublic: editIsPublic,
      })
      setPlaylist({ ...updated, cover_image: coverUrl })
      if (coverPreview) URL.revokeObjectURL(coverPreview)
      setCoverPreview(null)
      setCoverFile(null)
      setCoverSizeLabel(null)
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar la playlist.")
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    return () => {
      if (coverPreview) URL.revokeObjectURL(coverPreview)
    }
  }, [coverPreview])

  const cover =
    coverPreview || playlist?.cover_image || tracks[0]?.coverUrl || "/abstract-soundscape.png"

  return (
    <div className="mx-auto min-w-0 max-w-6xl pb-28">
      <Button
        variant="ghost"
        className="mb-4 min-h-[44px] text-white hover:bg-white/10"
        onClick={() => router.push("/playlists")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Volver a playlists
      </Button>

      {error && (
        <div className="mb-4 rounded border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-16 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-purple-500" />
          <p className="mt-4 text-gray-400">Cargando playlist…</p>
        </div>
      ) : !playlist ? (
        <div className="py-16 text-center">
          <ListMusic className="mx-auto mb-4 h-16 w-16 text-gray-500" />
          <h3 className="mb-2 text-xl font-semibold text-white">Playlist no disponible</h3>
          <p className="text-gray-400">Puede ser privada o haber sido eliminada.</p>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col items-center gap-6 sm:mb-8 sm:flex-row sm:items-end">
            <div className="relative shrink-0">
              <img
                src={cover}
                alt={playlist.name}
                className="h-36 w-36 rounded-lg object-cover sm:h-48 sm:w-48 md:h-60 md:w-60"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = "/abstract-soundscape.png"
                }}
              />
              {isOwner && editing && (
                <>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/*"
                    className="hidden"
                    onChange={(event) => void handleCoverSelected(event.target.files?.[0])}
                  />
                  <Button
                    type="button"
                    size="sm"
                    className="absolute inset-x-1 bottom-1 min-h-[48px] touch-manipulation bg-black/80 text-white hover:bg-black/90 active:bg-black"
                    disabled={compressingCover || saving}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <ImageIcon className="mr-2 h-4 w-4 shrink-0" />
                    {compressingCover ? "…" : "Cambiar"}
                  </Button>
                </>
              )}
            </div>

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <Badge className="mb-2 bg-white/10 text-white">
                {playlist.is_public ? "Pública" : "Privada"}
              </Badge>
              <h1 className="mb-2 break-words text-3xl font-bold text-white sm:text-5xl">
                {playlist.name}
              </h1>
              {playlist.description && (
                <p className="mb-3 break-words text-gray-300">{playlist.description}</p>
              )}
              <p className="mb-4 text-gray-400">
                {tracks.length} canciones
                {totalSeconds > 0 ? ` · ${formatDuration(totalSeconds)}` : ""}
                {isOwner ? " · Creada por ti" : ""}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                <Button
                  size="lg"
                  className="h-14 w-14 touch-manipulation rounded-full bg-green-500 text-white hover:bg-green-600"
                  onClick={() => tracks.length > 0 && handlePlay(tracks[0])}
                  disabled={tracks.length === 0}
                  aria-label="Reproducir playlist"
                >
                  <Play className="ml-1 h-6 w-6" />
                </Button>
                {isOwner && !editing && (
                  <Button
                    variant="outline"
                    className="min-h-[44px] touch-manipulation border-slate-600 bg-transparent text-white hover:bg-white/10"
                    onClick={startEditing}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                )}
                {isOwner && (
                  <Button
                    variant="ghost"
                    className="min-h-[44px] touch-manipulation text-red-300 hover:bg-red-900/30 hover:text-red-200"
                    disabled={deleting}
                    onClick={() => void handleDeletePlaylist()}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    {deleting
                      ? "Eliminando…"
                      : confirmDelete
                        ? "¿Confirmar eliminar?"
                        : "Eliminar playlist"}
                  </Button>
                )}
                {isOwner && confirmDelete && !deleting && (
                  <Button
                    variant="ghost"
                    className="min-h-[44px] touch-manipulation text-slate-300"
                    onClick={() => setConfirmDelete(false)}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          </div>

          {isOwner && editing && (
            <Card
              id="playlist-edit-form"
              className="mb-6 scroll-mt-4 border-slate-700 bg-slate-800/70 p-4 sm:p-5"
            >
              <h2 className="mb-4 text-lg font-semibold text-white">Editar playlist</h2>
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="playlist-edit-name"
                    className="mb-1 block text-sm font-medium text-slate-200"
                  >
                    Nombre
                  </label>
                  <Input
                    id="playlist-edit-name"
                    value={editName}
                    onChange={(event) => setEditName(event.target.value)}
                    maxLength={100}
                    autoCapitalize="sentences"
                    enterKeyHint="next"
                    className="min-h-[48px] touch-manipulation border-slate-600 bg-slate-900/70 text-base text-white"
                    placeholder="Nombre de la playlist"
                  />
                </div>
                <div>
                  <label
                    htmlFor="playlist-edit-description"
                    className="mb-1 block text-sm font-medium text-slate-200"
                  >
                    Descripción
                  </label>
                  <Textarea
                    id="playlist-edit-description"
                    value={editDescription}
                    onChange={(event) => setEditDescription(event.target.value)}
                    maxLength={500}
                    className="min-h-28 touch-manipulation border-slate-600 bg-slate-900/70 text-base text-white"
                    placeholder="Descripción opcional"
                  />
                </div>
                <div className="flex min-h-[56px] items-center justify-between gap-4 rounded-md border border-slate-700 px-3 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white">Playlist pública</p>
                    <p className="text-xs text-slate-400">
                      Otros usuarios podrán verla. Solo tú podrás editarla.
                    </p>
                  </div>
                  <Switch
                    checked={editIsPublic}
                    onCheckedChange={setEditIsPublic}
                    aria-label="Hacer playlist pública"
                    className="scale-125 touch-manipulation"
                  />
                </div>
                <div className="rounded-md border border-slate-700 p-3">
                  <p className="mb-2 text-sm font-medium text-white">Portada</p>
                  <p className="mb-3 text-xs text-slate-400">
                    Cualquier foto de la galería. Se comprime automáticamente en el móvil
                    (≈400 KB) antes de subirla.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-[48px] w-full touch-manipulation border-slate-600 bg-transparent text-white hover:bg-white/10 sm:w-auto"
                    disabled={compressingCover || saving}
                    onClick={() => coverInputRef.current?.click()}
                  >
                    <ImageIcon className="mr-2 h-4 w-4" />
                    {compressingCover
                      ? "Comprimiendo…"
                      : coverFile
                        ? "Cambiar imagen seleccionada"
                        : "Elegir imagen de la galería"}
                  </Button>
                  {compressingCover && (
                    <p className="mt-2 text-xs text-amber-200">
                      Reduciendo tamaño de la imagen…
                    </p>
                  )}
                  {coverFile && !compressingCover && (
                    <p className="mt-2 truncate text-xs text-emerald-300">
                      Lista para subir
                      {coverSizeLabel ? ` · ${coverSizeLabel}` : ""}
                      {coverFile.name ? ` · ${coverFile.name}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex flex-col-reverse gap-2 pb-[env(safe-area-inset-bottom)] sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-[48px] touch-manipulation text-slate-200"
                    disabled={saving || compressingCover}
                    onClick={cancelEdit}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="button"
                    className="min-h-[48px] touch-manipulation bg-purple-600 hover:bg-purple-700"
                    disabled={saving || compressingCover || !editName.trim()}
                    onClick={() => void handleSaveDetails()}
                  >
                    {saving ? "Guardando…" : "Guardar cambios"}
                  </Button>
                </div>
              </div>
            </Card>
          )}

          <div className="mb-6">
            <Input
              placeholder="Buscar en esta playlist…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="min-h-[44px] max-w-md border-white/20 bg-white/10 text-white placeholder:text-gray-400"
            />
          </div>

          <div className="space-y-2">
            {filteredTracks.map((song, index) => (
              <Card
                key={song.id}
                className="border-white/10 bg-white/5 p-3 transition-colors active:bg-white/10 sm:p-4"
              >
                <div className="flex items-center gap-2 sm:gap-4">
                  <div className="hidden w-8 text-center sm:block sm:w-12">
                    <span className="text-sm text-gray-400">{index + 1}</span>
                  </div>

                  <button
                    type="button"
                    className="relative shrink-0 touch-manipulation"
                    onClick={() => handlePlay(song)}
                    disabled={!song.audioUrl}
                    aria-label={`Reproducir ${song.title}`}
                  >
                    <img
                      src={song.coverUrl || "/placeholder.svg"}
                      alt=""
                      className="h-12 w-12 rounded object-cover"
                      onError={(e) => {
                        ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                      }}
                    />
                  </button>

                  <button
                    type="button"
                    className="min-w-0 flex-1 touch-manipulation text-left"
                    onClick={() => handlePlay(song)}
                    disabled={!song.audioUrl}
                  >
                    <h3 className="truncate font-medium text-white">{song.title}</h3>
                    <p className="truncate text-sm text-gray-400">
                      {song.artist}
                      {song.duration > 0 ? ` · ${formatDuration(song.duration)}` : ""}
                    </p>
                  </button>

                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] min-w-[44px] text-white hover:bg-white/10"
                      onClick={() => handlePlay(song)}
                      disabled={!song.audioUrl}
                      aria-label="Reproducir"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="min-h-[44px] min-w-[44px] text-white hover:bg-white/10"
                      onClick={() => addToQueue(song)}
                      disabled={!song.audioUrl}
                      aria-label="Añadir a la cola"
                      title="Añadir a la cola"
                    >
                      <ListMusic className="h-4 w-4" />
                    </Button>
                    {isOwner && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="min-h-[44px] min-w-[44px] text-red-300 hover:bg-red-900/30 hover:text-red-200"
                        onClick={() => void handleRemove(song.id)}
                        aria-label="Quitar de la playlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {filteredTracks.length === 0 && (
            <div className="py-12 text-center">
              <ListMusic className="mx-auto mb-4 h-16 w-16 text-gray-500" />
              <h3 className="mb-2 text-xl font-semibold text-white">
                {searchTerm ? "No se encontraron canciones" : "Esta playlist está vacía"}
              </h3>
              <p className="px-4 text-gray-400">
                {searchTerm
                  ? "Intenta con otros términos de búsqueda"
                  : isOwner
                    ? "Desde Buscar, toca “Añadir a playlist” en cualquier canción."
                    : "El propietario aún no ha añadido canciones."}
              </p>
              {isOwner && !searchTerm && (
                <Button
                  className="mt-4 min-h-[44px] bg-purple-600 hover:bg-purple-700"
                  onClick={() => router.push("/search")}
                >
                  Buscar canciones
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
