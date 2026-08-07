"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import {
  fetchActiveFeaturedContent,
  type FeaturedContent,
} from "@/lib/featured-content"

interface FeaturedCarouselProps {
  content?: FeaturedContent[]
  showInProfile?: boolean
}

function featuredHref(linkUrl?: string | null): string | null {
  const href = (linkUrl || "").trim()
  if (!href || href === "/") return null
  return href
}

export function FeaturedCarousel({ content, showInProfile = false }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
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
        console.warn("[featured-carousel] load failed:", err)
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

  if (loading || activeItems.length === 0) return null

  const itemsPerPage = showInProfile ? 1 : 2
  const totalPages = Math.ceil(activeItems.length / itemsPerPage)
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < totalPages - 1

  const goToPrev = () => {
    if (canGoPrev) setCurrentIndex(currentIndex - 1)
  }

  const goToNext = () => {
    if (canGoNext) setCurrentIndex(currentIndex + 1)
  }

  const getCurrentItems = () => {
    const startIndex = currentIndex * itemsPerPage
    return activeItems.slice(startIndex, startIndex + itemsPerPage)
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Destacados</h3>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={goToPrev}
              disabled={!canGoPrev}
              className="h-10 w-10 p-0 text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-400">
              {currentIndex + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={goToNext}
              disabled={!canGoNext}
              className="h-10 w-10 p-0 text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className={`grid gap-4 ${showInProfile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        {getCurrentItems().map((item) => {
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

      {totalPages > 1 && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentIndex(index)}
              className={`h-2 w-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-gray-600"
              }`}
              aria-label={`Ir a página ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
