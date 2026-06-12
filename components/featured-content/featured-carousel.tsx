"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Star, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"

interface FeaturedContent {
  id: string
  title: string
  description: string
  imageUrl: string
  linkUrl: string
  isActive: boolean
  priority: number
  type: "announcement" | "promotion" | "event"
}

interface FeaturedCarouselProps {
  content?: FeaturedContent[]
  showInProfile?: boolean
}

export function FeaturedCarousel({ content = [], showInProfile = false }: FeaturedCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)

  // Mock featured content - in real app this would come from API/database
  const defaultContent: FeaturedContent[] = [
    {
      id: "1",
      title: "🎵 Nueva Función: Playlists Colaborativas",
      description: "Crea playlists con tus amigos y descubre nueva música juntos",
      imageUrl: "/collaborative-playlists-music.jpg",
      linkUrl: "/playlists/collaborative",
      isActive: true,
      priority: 1,
      type: "announcement",
    },
    {
      id: "2",
      title: "🎤 Concurso de Talentos 2024",
      description: "Participa en nuestro concurso anual y gana increíbles premios",
      imageUrl: "/music-talent-contest-stage.jpg",
      linkUrl: "/contest/2024",
      isActive: true,
      priority: 2,
      type: "event",
    },
    {
      id: "3",
      title: "🎧 Descuento Premium 50%",
      description: "Obtén acceso premium con 50% de descuento por tiempo limitado",
      imageUrl: "/premium-discount-headphones.jpg",
      linkUrl: "/premium/offer",
      isActive: true,
      priority: 3,
      type: "promotion",
    },
  ]

  const featuredItems = content.length > 0 ? content : defaultContent
  const activeItems = featuredItems.filter((item) => item.isActive).sort((a, b) => a.priority - b.priority)

  if (activeItems.length === 0) return null

  const itemsPerPage = showInProfile ? 1 : 2
  const totalPages = Math.ceil(activeItems.length / itemsPerPage)
  const canGoPrev = currentIndex > 0
  const canGoNext = currentIndex < totalPages - 1

  const goToPrev = () => {
    if (canGoPrev) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  const goToNext = () => {
    if (canGoNext) {
      setCurrentIndex(currentIndex + 1)
    }
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
              className="h-8 w-8 p-0 text-gray-400 hover:text-white disabled:opacity-30"
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
              className="h-8 w-8 p-0 text-gray-400 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      <div className={`grid gap-4 ${showInProfile ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
        {getCurrentItems().map((item) => (
          <Card key={item.id} className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors group">
            <CardContent className="p-0">
              <Link href={item.linkUrl} className="block">
                <div className="relative">
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.title}
                    className="w-full h-32 object-cover rounded-t-lg"
                  />
                  <Badge className={`absolute top-2 left-2 ${getTypeColor(item.type)} text-white`}>
                    {getTypeLabel(item.type)}
                  </Badge>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ExternalLink className="h-4 w-4 text-white" />
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="font-semibold text-white mb-2 line-clamp-1">{item.title}</h4>
                  <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                </div>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentIndex ? "bg-white" : "bg-gray-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
