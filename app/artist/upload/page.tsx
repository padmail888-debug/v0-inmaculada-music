"use client"
export const dynamic = 'force-dynamic'



import type React from "react"
import { useState, useEffect, useCallback, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Upload, Music, ImageIcon, X, CheckCircle, AlertCircle } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { getSupabase } from "@/lib/supabase/client"
import { emitNotificationEvent } from "@/lib/notification-client"
import { ArtistShell } from "@/components/layout/artist-shell"

interface UploadForm {
  title: string
  album: string
  genre: string
  description: string
  lyrics: string
  tags: string[]
  isExplicit: boolean
  duration: number
  releaseDate: string
}

export default function UploadMusicPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [artistId, setArtistId] = useState<string | null>(null)
  const [artistLoading, setArtistLoading] = useState(true)
  const [form, setForm] = useState<UploadForm>({
    title: "",
    album: "",
    genre: "",
    description: "",
    lyrics: "",
    tags: [],
    isExplicit: false,
    duration: 0,
    releaseDate: "",
  })
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploaded, setUploaded] = useState(false)
  const [newTag, setNewTag] = useState("")
  const [fileError, setFileError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [durationLoading, setDurationLoading] = useState(false)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!user?.id) {
      setArtistLoading(false)
      return
    }
    const supabase = getSupabase()
    supabase
      .from("artists")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        setArtistLoading(false)
        if (error) {
          console.error("Error fetching artist:", error)
          return
        }
        setArtistId(data?.id ?? null)
      })
  }, [user?.id])

  const validateAudioFile = async (file: File): Promise<boolean> => {
    const name = file.name.toLowerCase()
    const isMp3 = file.type.includes("mp3") || file.type.includes("mpeg") || name.endsWith(".mp3")
    const isWav = file.type.includes("wav") || file.type.includes("wave") || name.endsWith(".wav")
    if (!isMp3 && !isWav) {
      setFileError("Formato no válido. Usa MP3 o WAV.")
      return false
    }
    const fileSizeMB = file.size / (1024 * 1024)
    if (fileSizeMB > 500) {
      setFileError("El archivo no puede superar 500 MB.")
      return false
    }
    setFileError(null)
    return true
  }

  const getDurationFromFile = useCallback((file: File): Promise<number> => {
    return new Promise((resolve) => {
      const url = URL.createObjectURL(file)
      const audio = new Audio()
      audio.addEventListener("loadedmetadata", () => {
        URL.revokeObjectURL(url)
        resolve(Math.round(audio.duration))
      })
      audio.addEventListener("error", () => {
        URL.revokeObjectURL(url)
        resolve(0)
      })
      audio.src = url
    })
  }, [])

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const isValid = await validateAudioFile(file)
      if (isValid) {
        setAudioFile(file)
        setDurationLoading(true)
        const duration = await getDurationFromFile(file)
        setForm((prev) => ({ ...prev, duration }))
        setDurationLoading(false)
      } else {
        setAudioFile(null)
        e.target.value = ""
      }
    }
    e.target.value = ""
  }

  const handleAudioDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      const file = e.dataTransfer.files?.[0]
      if (file) {
        const isValid = await validateAudioFile(file)
        if (isValid) {
          setAudioFile(file)
          setDurationLoading(true)
          const duration = await getDurationFromFile(file)
          setForm((prev) => ({ ...prev, duration }))
          setDurationLoading(false)
        } else setAudioFile(null)
      }
    },
    [getDurationFromFile, validateAudioFile],
  )

  const handleCoverDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith("image/")) setCoverFile(file)
  }, [])

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) setCoverFile(file)
  }

  const addTag = () => {
    if (newTag.trim() && !form.tags.includes(newTag.trim())) {
      setForm((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError(null)
    if (!user?.id) {
      setSubmitError("Debes iniciar sesión para subir una canción.")
      return
    }
    if (!artistId) {
      setSubmitError("Necesitas un perfil de artista. Crea uno en tu perfil primero.")
      return
    }
    if (!audioFile || !form.title.trim()) {
      setSubmitError("Título y archivo de audio son obligatorios.")
      return
    }

    setUploading(true)
    const supabase = getSupabase()
    const prefix = `${user.id}/${Date.now()}`

    try {
      const audioPath = `${prefix}_${audioFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
      const { error: audioErr } = await supabase.storage.from("songs").upload(audioPath, audioFile, {
        contentType: audioFile.type || "audio/mpeg",
        upsert: false,
      })
      if (audioErr) {
        setSubmitError("Error al subir el audio: " + audioErr.message)
        setUploading(false)
        return
      }
      const { data: audioUrlData } = supabase.storage.from("songs").getPublicUrl(audioPath)
      const audioFileUrl = audioUrlData.publicUrl

      let coverImageUrl: string | null = null
      if (coverFile) {
        const coverPath = `${prefix}_${coverFile.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`
        const { error: coverErr } = await supabase.storage.from("covers").upload(coverPath, coverFile, {
          contentType: coverFile.type,
          upsert: false,
        })
        if (!coverErr) {
          const { data: coverUrlData } = supabase.storage.from("covers").getPublicUrl(coverPath)
          coverImageUrl = coverUrlData.publicUrl
        }
      }

      let albumId: string | null = null
      let albumWasCreated = false
      const albumTitle = form.album.trim()
      if (albumTitle) {
        const { data: existing } = await supabase
          .from("albums")
          .select("id")
          .eq("artist_id", artistId)
          .ilike("title", albumTitle)
          .limit(1)
          .maybeSingle()
        if (existing?.id) {
          albumId = existing.id
        } else {
          const { data: created, error: albumErr } = await supabase
            .from("albums")
            .insert({ artist_id: artistId, title: albumTitle })
            .select("id")
            .single()
          if (!albumErr && created?.id) {
            albumId = created.id
            albumWasCreated = true
          }
        }
      }

      const insertPayload: Record<string, unknown> = {
        artist_id: artistId,
        title: form.title.trim(),
        duration: form.duration >= 0 ? form.duration : 0,
        audio_file_url: audioFileUrl,
        cover_image: coverImageUrl,
      }
      if (albumId) insertPayload.album_id = albumId
      if (form.releaseDate) insertPayload.release_date = form.releaseDate

      const { error: insertErr } = await supabase.from("songs").insert(insertPayload)
      if (insertErr) {
        setSubmitError("Error al guardar la canción: " + insertErr.message)
        setUploading(false)
        return
      }

      // Emit release notifications for followers
      if (artistId) {
        if (albumWasCreated && albumId && albumTitle) {
          void emitNotificationEvent("new_album_release", {
            artistId,
            albumId,
            albumTitle,
          })
        }
        // New song release (always)
        // Fetch inserted song id by title + artist fallback to latest row
        const { data: latestSong } = await supabase
          .from("songs")
          .select("id")
          .eq("artist_id", artistId)
          .eq("title", form.title.trim())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()

        if (latestSong?.id) {
          void emitNotificationEvent("new_song_release", {
            artistId,
            songId: latestSong.id,
            songTitle: form.title.trim(),
          })
        }
      }

      setUploaded(true)
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Error al subir la canción.")
    } finally {
      setUploading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    if (!seconds || seconds < 0) return "0:00"
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, "0")}`
  }

  const resetForm = useCallback(() => {
    setUploaded(false)
    setForm({
      title: "",
      album: "",
      genre: "",
      description: "",
      lyrics: "",
      tags: [],
      isExplicit: false,
      duration: 0,
      releaseDate: "",
    })
    setAudioFile(null)
    setCoverFile(null)
    setFileError(null)
    setSubmitError(null)
  }, [])

  if (uploaded) {
    return (
      <ArtistShell>
        <div className="flex items-center justify-center min-h-[50vh] px-4">
        <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm max-w-md w-full">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">¡Subida exitosa!</h2>
            <p className="text-slate-300 mb-6">
              Tu canción "{form.title}" ha sido subida correctamente y está siendo procesada.
            </p>
            <div className="space-y-2">
              <Link href="/artist/profile">
                <Button type="button" className="w-full bg-purple-600 hover:bg-purple-700">
                  Ver mi perfil
                </Button>
              </Link>
              <Button
                type="button"
                variant="outline"
                className="w-full border-slate-600 text-white bg-transparent"
                onClick={resetForm}
              >
                Subir otra canción
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </ArtistShell>
    )
  }

  return (
    <ArtistShell>
          <div className="max-w-4xl mx-auto min-w-0">
        {artistLoading && (
          <div className="text-center py-12 text-slate-400">Cargando perfil de artista...</div>
        )}
        {!artistLoading && !user && (
          <div className="text-center py-12">
            <p className="text-slate-300 mb-4">Debes iniciar sesión para subir canciones.</p>
            <Link href="/login">
              <Button className="bg-purple-600 hover:bg-purple-700">Iniciar sesión</Button>
            </Link>
          </div>
        )}
        {!artistLoading && user && !artistId && (
          <div className="text-center py-12">
            <p className="text-slate-300 mb-4">Necesitas un perfil de artista antes de subir canciones.</p>
            <Link href="/artist/profile">
              <Button className="bg-purple-600 hover:bg-purple-700">Ir a mi perfil de artista</Button>
            </Link>
          </div>
        )}
        {!artistLoading && user && artistId && (
          <>
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Subir Nueva Canción</h1>
          <p className="text-slate-300">Comparte tu música con el mundo</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Audio Upload */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  Archivo de Audio
                </CardTitle>
                <CardDescription className="text-slate-400">
                  Sube tu canción en formato MP3 o WAV
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center transition-colors hover:border-slate-500"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.setAttribute("data-drag", "true") }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.removeAttribute("data-drag") }}
                  onDrop={handleAudioDrop}
                >
                  {audioFile ? (
                    <div>
                      <Music className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-white font-medium truncate max-w-full">{audioFile.name}</p>
                      <p className="text-slate-400 text-sm">{(audioFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                      {durationLoading ? (
                        <p className="text-slate-400 text-sm mt-1">Detectando duración…</p>
                      ) : form.duration > 0 ? (
                        <p className="text-slate-300 text-sm mt-1">Duración: {formatDuration(form.duration)}</p>
                      ) : null}
                    </div>
                  ) : (
                    <div>
                      <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-white mb-2">Arrastra tu archivo aquí</p>
                      <p className="text-slate-400 text-sm mb-4">o haz clic para seleccionar</p>
                    </div>
                  )}
                  <input
                    ref={audioInputRef}
                    type="file"
                    accept=".mp3,.wav,audio/mp3,audio/mpeg,audio/wav,audio/wave"
                    onChange={handleAudioUpload}
                    className="sr-only"
                    id="audio-upload"
                    tabIndex={-1}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-600 text-white bg-transparent cursor-pointer"
                    onClick={() => audioInputRef.current?.click()}
                  >
                    Seleccionar archivo
                  </Button>
                </div>
                <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                  <h4 className="text-white font-medium mb-2">Requisitos del archivo:</h4>
                  <ul className="text-slate-300 text-sm space-y-1">
                    <li>• Formatos: MP3 o WAV</li>
                    <li>• Tamaño máximo: 500 MB</li>
                  </ul>
                </div>
                {fileError && (
                  <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                    <p className="text-red-300 text-sm">{fileError}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cover Upload */}
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Portada del Álbum
                </CardTitle>
                <CardDescription className="text-slate-400">Imagen cuadrada de al menos 1400x1400px</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center transition-colors hover:border-slate-500"
                  onDragOver={(e) => { e.preventDefault(); e.currentTarget.setAttribute("data-drag", "true") }}
                  onDragLeave={(e) => { e.preventDefault(); e.currentTarget.removeAttribute("data-drag") }}
                  onDrop={handleCoverDrop}
                >
                  {coverFile ? (
                    <div>
                      <img
                        src={URL.createObjectURL(coverFile) || "/placeholder.svg"}
                        alt="Cover preview"
                        className="w-24 h-24 object-cover rounded mx-auto mb-2"
                      />
                      <p className="text-white font-medium">{coverFile.name}</p>
                    </div>
                  ) : (
                    <div>
                      <ImageIcon className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                      <p className="text-white mb-2">Sube la portada</p>
                      <p className="text-slate-400 text-sm mb-4">JPG, PNG o GIF</p>
                    </div>
                  )}
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCoverUpload}
                    className="sr-only"
                    id="cover-upload"
                    tabIndex={-1}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="border-slate-600 text-white bg-transparent cursor-pointer"
                    onClick={() => coverInputRef.current?.click()}
                  >
                    Seleccionar imagen
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Song Information */}
          <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Información de la Canción</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-white">
                    Título *
                  </Label>
                  <Input
                    id="title"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                    placeholder="Nombre de la canción"
                  />
                </div>

                <div>
                  <Label htmlFor="duration" className="text-white">
                    Duración
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    min={0}
                    value={form.duration || ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, duration: parseInt(e.target.value, 10) || 0 }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Se detecta automáticamente"
                  />
                  {form.duration > 0 && (
                    <p className="text-slate-400 text-xs mt-1">{formatDuration(form.duration)}</p>
                  )}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="album" className="text-white">
                    Álbum
                  </Label>
                  <Input
                    id="album"
                    value={form.album}
                    onChange={(e) => setForm((prev) => ({ ...prev, album: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="Opcional. Se crea o vincula si existe."
                  />
                </div>
                <div>
                  <Label htmlFor="releaseDate" className="text-white">
                    Fecha de lanzamiento
                  </Label>
                  <Input
                    id="releaseDate"
                    type="date"
                    value={form.releaseDate}
                    onChange={(e) => setForm((prev) => ({ ...prev, releaseDate: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="genre" className="text-white">
                  Género
                </Label>
                <select
                  id="genre"
                  value={form.genre}
                  onChange={(e) => setForm((prev) => ({ ...prev, genre: e.target.value }))}
                  className="flex h-9 w-full rounded-md border border-slate-600 bg-slate-700 px-3 py-2 text-sm text-white shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Opcional</option>
                  <option value="electronic">Electronic</option>
                  <option value="pop">Pop</option>
                  <option value="rock">Rock</option>
                  <option value="hip-hop">Hip Hop</option>
                  <option value="jazz">Jazz</option>
                  <option value="classical">Classical</option>
                  <option value="ambient">Ambient</option>
                  <option value="experimental">Experimental</option>
                </select>
              </div>

              <div>
                <Label htmlFor="description" className="text-white">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                  placeholder="Describe tu canción..."
                />
              </div>

              <div>
                <Label htmlFor="lyrics" className="text-white">
                  Letra de la Canción
                </Label>
                <Textarea
                  id="lyrics"
                  value={form.lyrics}
                  onChange={(e) => setForm((prev) => ({ ...prev, lyrics: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={8}
                  placeholder="Pega aquí la letra completa de tu canción..."
                />
                <p className="text-slate-400 text-sm mt-1">
                  Las letras aparecerán en el reproductor para que los oyentes puedan seguir la canción.
                </p>
              </div>

              <div>
                <Label htmlFor="tags" className="text-white">
                  Etiquetas
                </Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Agregar etiqueta"
                    className="bg-slate-700 border-slate-600 text-white"
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    variant="outline"
                    className="border-slate-600 text-white bg-transparent"
                  >
                    Agregar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-purple-600/20 text-purple-300">
                      {tag}
                      <button type="button" onClick={() => removeTag(tag)} className="ml-2 hover:text-red-400">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          {submitError && (
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-red-300 text-sm">{submitError}</p>
            </div>
          )}
          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={!audioFile || !form.title.trim() || uploading || !!fileError}
              className="bg-purple-600 hover:bg-purple-700 flex-1 min-h-[44px]"
            >
              {uploading ? "Subiendo…" : "Publicar Canción"}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="border-slate-600 text-white bg-transparent min-h-[44px]"
              onClick={() => router.push("/artist/profile")}
            >
              Cancelar
            </Button>
          </div>
        </form>
          </>
        )}
      </div>
    </ArtistShell>
  )
}
