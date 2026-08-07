"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star } from "lucide-react"
import Link from "next/link"
import {
  fetchActiveFeaturedContent,
  type FeaturedContent,
} from "@/lib/featured-content"

interface FeaturedBannerProps {
  content?: FeaturedContent[]
  showInProfile?: boolean
}

function featuredHref(linkUrl?: string | null): string | null {
  const href = (linkUrl || "").trim()
  if (!href || href === "/") return null
  return href
}

export function FeaturedBanner({ content, showInProfile = false }: FeaturedBannerProps) {
  const [items, setItems] = useState<FeaturedContent[]>(content ?? [])
  const [loading, setLoading] = useState(!content)

  useEffect(() => {
    if (content) {
      setItems(content)
      setLoading(false)
      return
    }
    let cancelled = false
    setLoading(true)
    void fetchActiveFeaturedContent()
      .then((rows) => {
        if (!cancelled) setItems(rows)
      })
      .catch((err) => {
        console.warn("[featured] load failed:", err)
        if (!cancelled) setItems([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [content])

  const activeItems = items
    .filter((item) => item.isActive)
    .sort((a, b) => a.priority - b.priority)

  if (loading) {
    return showInProfile ? (
      <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800/40 p-4 text-sm text-slate-400">
        Cargando contenido destacado…
      </div>
    ) : null
  }

  if (activeItems.length === 0) {
    return showInProfile ? (
      <div className="mb-6 rounded-lg border border-dashed border-slate-700 bg-slate-800/30 p-4">
        <div className="mb-1 flex items-center gap-2 text-slate-300">
          <Star className="h-4 w-4 text-yellow-400" />
          <h3 className="text-sm font-semibold">Contenido Destacado</h3>
        </div>
        <p className="text-xs text-slate-500">
          Aún no hay promociones activas. El Super Admin las publica desde el panel.
        </p>
      </div>
    ) : null
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "announcement":
        return "bg-blue-500"
      case "promotion":
        return "bg-green-500"
      case "event":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "announcement":
        return "Anuncio"
      case "promotion":
        return "Promoción"
      case "event":
        return "Evento"
      default:
        return "Destacado"
    }
  }

  return (
    <div className={`space-y-4 ${showInProfile ? "mb-6" : "mb-8"}`}>
      {showInProfile && (
        <div className="mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Contenido Destacado</h3>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {activeItems.slice(0, showInProfile ? 4 : 4).map((item) => {
          const href = featuredHref(item.linkUrl)
          const isExternal = !!href && href.startsWith("http")
          const body = (
            <>
              <div className="relative">
                <img
                  src={item.imageUrl || "/placeholder.svg"}
                  alt={item.title}
                  className="h-32 w-full rounded-t-lg object-cover"
                  onError={(e) => {
                    ;(e.target as HTMLImageElement).src = "/placeholder.svg"
                  }}
                />
                <Badge className={`absolute left-2 top-2 ${getTypeColor(item.type)} text-white`}>
                  {getTypeLabel(item.type)}
                </Badge>
              </div>
              <div className="p-4">
                <h4 className="mb-2 line-clamp-1 font-semibold text-white">{item.title}</h4>
                <p className="line-clamp-2 text-sm text-gray-400">{item.description}</p>
              </div>
            </>
          )
          return (
            <Card key={item.id} className="border-slate-700 bg-slate-800">
              <CardContent className="p-0">
                {href ? (
                  <Link
                    href={href}
                    className="block"
                    {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {body}
                  </Link>
                ) : (
                  <div>{body}</div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
