"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowUp,
  Edit,
  Eye,
  EyeOff,
  Plus,
  RefreshCw,
  Star,
  Trash2,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  deleteFeaturedContent,
  featuredEditHref,
  fetchAllFeaturedContent,
  moveFeaturedContentPriority,
  setFeaturedContentActive,
  type FeaturedContent,
} from "@/lib/featured-content"

function typeLabel(type: string) {
  if (type === "promotion") return "Promoción"
  if (type === "event") return "Evento"
  return "Anuncio"
}

function typeColor(type: string) {
  if (type === "promotion") return "bg-green-600"
  if (type === "event") return "bg-purple-600"
  return "bg-blue-600"
}

type FeaturedContentManagerProps = {
  /** When true, auto-load on mount. When false, parent controls loading via `reloadKey`. */
  autoLoad?: boolean
  /** Increment to force a reload (e.g. when switching to the Destacados tab). */
  reloadKey?: number
  compact?: boolean
}

export function FeaturedContentManager({
  autoLoad = true,
  reloadKey = 0,
  compact = false,
}: FeaturedContentManagerProps) {
  const [items, setItems] = useState<FeaturedContent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setError(null)
    try {
      const rows = await fetchAllFeaturedContent()
      setItems(rows)
    } catch (err) {
      const raw = err instanceof Error ? err.message : String(err)
      const missingTable = /featured_content|schema cache|does not exist|relation/i.test(raw)
      setError(
        missingTable
          ? "Falta la tabla featured_content en Supabase. Abre el SQL Editor y ejecuta el archivo docs/supabase-featured-content-table.sql, luego pulsa Actualizar."
          : raw || "Error al cargar. ¿Ejecutaste docs/supabase-featured-content-table.sql?",
      )
      if (!opts?.silent) setItems([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!autoLoad && reloadKey === 0) return
    void load()
  }, [autoLoad, reloadKey, load])

  const onToggle = async (item: FeaturedContent) => {
    if (busyId) return
    const next = !item.isActive
    setBusyId(item.id)
    setError(null)
    // Optimistic UI — avoid remounting the whole list (prevents DOM insertBefore crashes)
    setItems((prev) =>
      prev.map((row) => (row.id === item.id ? { ...row, isActive: next } : row)),
    )
    try {
      await setFeaturedContentActive(item.id, next)
    } catch (err) {
      setItems((prev) =>
        prev.map((row) => (row.id === item.id ? { ...row, isActive: item.isActive } : row)),
      )
      setError(err instanceof Error ? err.message : "No se pudo actualizar")
    } finally {
      setBusyId(null)
    }
  }

  const onMove = async (id: string, direction: "up" | "down") => {
    if (busyId) return
    setBusyId(id)
    setError(null)
    const index = items.findIndex((item) => item.id === id)
    const swapWith = direction === "up" ? index - 1 : index + 1
    if (index < 0 || swapWith < 0 || swapWith >= items.length) {
      setBusyId(null)
      return
    }

    const snapshot = items
    const next = [...items]
    const a = next[index]
    const b = next[swapWith]
    next[index] = { ...b, priority: a.priority }
    next[swapWith] = { ...a, priority: b.priority }
    // Keep visual order in sync with swapped priorities
    next.sort((x, y) => x.priority - y.priority)
    setItems(next)

    try {
      await moveFeaturedContentPriority(id, direction)
      await load({ silent: true })
    } catch (err) {
      setItems(snapshot)
      setError(err instanceof Error ? err.message : "No se pudo reordenar")
    } finally {
      setBusyId(null)
    }
  }

  const onDelete = async (id: string) => {
    if (busyId) return
    if (!window.confirm("¿Eliminar este contenido destacado?")) return
    setBusyId(id)
    setError(null)
    const snapshot = items
    setItems((prev) => prev.filter((item) => item.id !== id))
    try {
      await deleteFeaturedContent(id)
    } catch (err) {
      setItems(snapshot)
      setError(err instanceof Error ? err.message : "No se pudo eliminar")
    } finally {
      setBusyId(null)
    }
  }

  const activeCount = items.filter((i) => i.isActive).length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {!compact && (
            <div className="mb-1 flex items-center gap-2 text-yellow-400">
              <Star className="h-5 w-5" />
              <span className="text-sm font-medium">Contenido Destacado</span>
            </div>
          )}
          <p className="text-sm text-slate-400">
            {items.length} total · {activeCount} activos · visibles en perfil de artista y
            dashboard
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-[44px] border-slate-600 bg-transparent text-white"
            disabled={loading || !!busyId}
            onClick={() => void load()}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Link
            href="/admin/featured/new"
            className="inline-flex min-h-[44px] items-center justify-center rounded-md bg-yellow-600 px-4 text-sm font-medium text-white hover:bg-yellow-700"
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo
          </Link>
        </div>
      </div>

      {error && (
        <div className="rounded-md border border-red-700 bg-red-900/40 p-3 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading && items.length === 0 ? (
        <p className="py-10 text-center text-slate-400">Cargando contenidos destacados…</p>
      ) : items.length === 0 ? (
        <Card className="border-slate-700 bg-slate-800">
          <CardHeader>
            <CardTitle className="text-white">Aún no hay contenidos</CardTitle>
            <CardDescription className="text-slate-400">
              Crea anuncios, promociones o eventos. Si ves un error de tabla, ejecuta{" "}
              <code className="text-xs">docs/supabase-featured-content-table.sql</code> en
              Supabase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link
              href="/admin/featured/new"
              className="inline-flex min-h-[48px] items-center justify-center rounded-md bg-yellow-600 px-4 text-sm font-medium text-white hover:bg-yellow-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              Crear contenido
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item, index) => (
            <Card key={item.id} className="border-slate-700 bg-slate-800">
              <CardContent className="p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt=""
                    className="h-28 w-full rounded-md object-cover sm:h-20 sm:w-28 sm:shrink-0"
                    onError={(e) => {
                      ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                    }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <Badge className={`${typeColor(item.type)} text-white`}>
                        {typeLabel(item.type)}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          item.isActive
                            ? "border-green-600 text-green-300"
                            : "border-slate-500 text-slate-400"
                        }
                      >
                        {item.isActive ? "Activo" : "Inactivo"}
                      </Badge>
                      <span className="text-xs text-slate-500">Prioridad {item.priority}</span>
                    </div>
                    <h2 className="truncate font-semibold text-white">{item.title}</h2>
                    <p className="line-clamp-2 text-sm text-slate-400">{item.description}</p>
                    {item.linkUrl && item.linkUrl !== "/" && (
                      <p className="mt-1 truncate text-xs text-slate-500">{item.linkUrl}</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:flex sm:shrink-0 sm:flex-wrap">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] border-slate-600 text-white"
                      disabled={busyId === item.id || index === 0}
                      onClick={() => void onMove(item.id, "up")}
                      aria-label="Subir prioridad"
                    >
                      <ArrowUp className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] border-slate-600 text-white"
                      disabled={busyId === item.id || index === items.length - 1}
                      onClick={() => void onMove(item.id, "down")}
                      aria-label="Bajar prioridad"
                    >
                      <ArrowDown className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="min-h-[44px] border-slate-600 text-white"
                      disabled={busyId === item.id}
                      onClick={() => void onToggle(item)}
                    >
                      <span className="inline-flex items-center">
                        {item.isActive ? (
                          <EyeOff className="mr-1 h-4 w-4" aria-hidden />
                        ) : (
                          <Eye className="mr-1 h-4 w-4" aria-hidden />
                        )}
                        <span>{item.isActive ? "Ocultar" : "Activar"}</span>
                      </span>
                    </Button>
                    <Link
                      href={featuredEditHref(item.id)}
                      className="inline-flex min-h-[44px] items-center justify-center rounded-md border border-slate-600 bg-transparent px-3 text-sm text-white hover:bg-slate-700"
                    >
                      <Edit className="mr-1 h-4 w-4" />
                      Editar
                    </Link>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="col-span-2 min-h-[44px] text-red-300 hover:bg-red-900/30 sm:col-span-1"
                      disabled={busyId === item.id}
                      onClick={() => void onDelete(item.id)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
