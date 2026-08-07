"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, ImageIcon, Upload, X } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  createFeaturedContent,
  fetchFeaturedContentById,
  updateFeaturedContent,
  type FeaturedContentType,
} from "@/lib/featured-content"
import { uploadFeaturedImage } from "@/lib/featured-cover-upload"
import { preparePlaylistCover } from "@/lib/playlist-cover-prepare"

const FEATURED_LIST_HREF = "/admin?tab=featured"

type FeaturedContentFormProps = {
  mode: "create" | "edit"
  itemId?: string
}

export function FeaturedContentForm({ mode, itemId }: FeaturedContentFormProps) {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState("")
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [linkUrl, setLinkUrl] = useState("/")
  const [type, setType] = useState<FeaturedContentType>("announcement")
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(mode === "edit")
  const [saving, setSaving] = useState(false)
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showUrlFallback, setShowUrlFallback] = useState(false)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login?redirect=/admin/featured")
      return
    }
    if (user.role !== "superadmin") {
      router.replace("/dashboard")
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (mode !== "edit" || !itemId || !user || user.role !== "superadmin") return
    let cancelled = false
    setLoading(true)
    void fetchFeaturedContentById(itemId)
      .then((row) => {
        if (cancelled) return
        if (!row) {
          setError("Contenido no encontrado")
          return
        }
        setTitle(row.title)
        setDescription(row.description)
        setImageUrl(row.imageUrl)
        setLinkUrl(row.linkUrl)
        setType(row.type)
        setIsActive(row.isActive)
        if (row.imageUrl && row.imageUrl !== "/placeholder.svg") {
          setShowUrlFallback(true)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Error al cargar")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [mode, itemId, user])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const clearPendingImage = () => {
    if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    setPendingFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const onPickImage = async (file: File | null) => {
    if (!file) return
    setError(null)
    setCompressing(true)
    try {
      const prepared = await preparePlaylistCover(file)
      const compressed = new File([prepared.blob], prepared.fileName, {
        type: prepared.contentType,
      })
      if (previewUrl?.startsWith("blob:")) URL.revokeObjectURL(previewUrl)
      const localPreview = URL.createObjectURL(prepared.blob)
      setPreviewUrl(localPreview)
      setPendingFile(compressed)
      setImageUrl("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la imagen")
      clearPendingImage()
    } finally {
      setCompressing(false)
    }
  }

  const goBackToList = () => {
    router.push(FEATURED_LIST_HREF)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || saving || compressing) return
    setSaving(true)
    setError(null)
    try {
      let finalImageUrl = imageUrl.trim() || "/placeholder.svg"

      if (pendingFile) {
        finalImageUrl = await uploadFeaturedImage(pendingFile)
      }

      const payload = {
        title,
        description,
        imageUrl: finalImageUrl,
        linkUrl: linkUrl || "/",
        type,
        isActive,
      }
      if (mode === "edit" && itemId) {
        await updateFeaturedContent(itemId, payload)
      } else {
        await createFeaturedContent(payload, user.id)
      }
      goBackToList()
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar")
      setSaving(false)
    }
  }

  const displayPreview = previewUrl || (imageUrl && imageUrl !== "/placeholder.svg" ? imageUrl : null)

  if (authLoading || !user || user.role !== "superadmin") {
    return (
      <AppShell>
        <div className="py-16 text-center text-slate-300">Cargando…</div>
      </AppShell>
    )
  }

  if (mode === "edit" && !itemId) {
    return (
      <AppShell>
        <div className="mx-auto max-w-xl px-4 py-10 text-center text-red-200">
          Falta el id del contenido.{" "}
          <Link href={FEATURED_LIST_HREF} className="underline">
            Volver al listado
          </Link>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto min-w-0 max-w-2xl pb-28">
        <Link
          href={FEATURED_LIST_HREF}
          className="mb-4 inline-flex min-h-[44px] items-center rounded-md px-3 text-sm text-white hover:bg-white/10"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al listado
        </Link>

        <Card className="border-slate-700 bg-slate-800/70">
          <CardHeader>
            <CardTitle className="text-white">
              {mode === "create" ? "Nuevo contenido destacado" : "Editar contenido destacado"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-slate-400">Cargando…</p>
            ) : (
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                {error && (
                  <div className="rounded-md border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <div>
                  <Label htmlFor="featured-title" className="text-slate-200">
                    Título
                  </Label>
                  <Input
                    id="featured-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={120}
                    className="mt-1 min-h-[48px] border-slate-600 bg-slate-900/70 text-base text-white"
                    placeholder="Ej: Nueva función para artistas"
                  />
                </div>

                <div>
                  <Label htmlFor="featured-description" className="text-slate-200">
                    Descripción
                  </Label>
                  <Textarea
                    id="featured-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    className="mt-1 min-h-28 border-slate-600 bg-slate-900/70 text-base text-white"
                    placeholder="Texto corto que verán los artistas"
                  />
                </div>

                <div>
                  <Label className="text-slate-200">Imagen</Label>
                  <p className="mt-0.5 text-xs text-slate-400">
                    Sube una foto; se redimensiona y comprime automáticamente (~400 KB JPEG).
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null
                      void onPickImage(file)
                    }}
                  />

                  {displayPreview ? (
                    <div className="relative mt-3 overflow-hidden rounded-md border border-slate-600">
                      <img
                        src={displayPreview}
                        alt="Vista previa"
                        className="h-44 w-full object-cover"
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                        }}
                      />
                      <div className="absolute inset-x-0 bottom-0 flex gap-2 bg-gradient-to-t from-black/80 to-transparent p-3">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="min-h-[40px] border-slate-500 bg-black/40 text-white"
                          disabled={compressing || saving}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <Upload className="mr-1 h-4 w-4" />
                          <span>Cambiar</span>
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="min-h-[40px] text-red-200 hover:bg-red-900/40"
                          disabled={compressing || saving}
                          onClick={() => {
                            clearPendingImage()
                            setImageUrl("")
                          }}
                        >
                          <X className="mr-1 h-4 w-4" />
                          <span>Quitar</span>
                        </Button>
                      </div>
                      {pendingFile && (
                        <p className="absolute right-2 top-2 rounded bg-black/60 px-2 py-0.5 text-xs text-green-300">
                          Lista para subir ({Math.round(pendingFile.size / 1024)} KB)
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={compressing || saving}
                      onClick={() => fileInputRef.current?.click()}
                      className="mt-3 flex min-h-[140px] w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed border-slate-600 bg-slate-900/50 px-4 py-6 text-slate-300 transition hover:border-yellow-500/50 hover:bg-slate-900"
                    >
                      {compressing ? (
                        <p className="text-sm">Redimensionando imagen…</p>
                      ) : (
                        <>
                          <ImageIcon className="h-8 w-8 text-slate-400" />
                          <span className="text-sm font-medium">Subir imagen</span>
                          <span className="text-xs text-slate-500">JPG, PNG o WebP</span>
                        </>
                      )}
                    </button>
                  )}

                  <button
                    type="button"
                    className="mt-2 text-xs text-slate-400 underline underline-offset-2 hover:text-slate-200"
                    onClick={() => setShowUrlFallback((v) => !v)}
                  >
                    {showUrlFallback ? "Ocultar URL manual" : "Usar URL en lugar de archivo"}
                  </button>

                  {showUrlFallback && (
                    <Input
                      id="featured-image"
                      value={imageUrl}
                      onChange={(e) => {
                        clearPendingImage()
                        setImageUrl(e.target.value)
                      }}
                      className="mt-2 min-h-[48px] border-slate-600 bg-slate-900/70 text-base text-white"
                      placeholder="https://… o /placeholder.svg"
                      disabled={compressing || saving}
                    />
                  )}
                </div>

                <div>
                  <Label htmlFor="featured-link" className="text-slate-200">
                    Enlace (ruta o URL)
                  </Label>
                  <Input
                    id="featured-link"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="mt-1 min-h-[48px] border-slate-600 bg-slate-900/70 text-base text-white"
                    placeholder="/subscription o https://…"
                  />
                </div>

                <div>
                  <Label htmlFor="featured-type" className="text-slate-200">
                    Tipo
                  </Label>
                  <select
                    id="featured-type"
                    value={type}
                    onChange={(e) => setType(e.target.value as FeaturedContentType)}
                    className="mt-1 flex min-h-[48px] w-full rounded-md border border-slate-600 bg-slate-900/70 px-3 text-base text-white outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <option value="announcement">Anuncio</option>
                    <option value="promotion">Promoción</option>
                    <option value="event">Evento</option>
                  </select>
                </div>

                <div className="flex min-h-[56px] items-center justify-between gap-3 rounded-md border border-slate-700 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-white">Activo</p>
                    <p className="text-xs text-slate-400">
                      Solo los activos se muestran a los artistas.
                    </p>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={setIsActive}
                    className="scale-125 touch-manipulation"
                    aria-label="Contenido activo"
                  />
                </div>

                <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="min-h-[48px] text-slate-200"
                    disabled={saving || compressing}
                    onClick={goBackToList}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="min-h-[48px] bg-purple-600 hover:bg-purple-700"
                    disabled={saving || compressing || !title.trim()}
                  >
                    {compressing
                      ? "Procesando imagen…"
                      : saving
                        ? "Guardando…"
                        : mode === "create"
                          ? "Crear"
                          : "Guardar cambios"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  )
}
