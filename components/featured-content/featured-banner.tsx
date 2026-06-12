"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Star, ExternalLink } from "lucide-react"
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

interface FeaturedBannerProps {
  content?: FeaturedContent[]
  showInProfile?: boolean
}

export function FeaturedBanner({ content = [], showInProfile = false }: FeaturedBannerProps) {
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
  ]

  const featuredItems = content.length > 0 ? content : defaultContent
  const activeItems = featuredItems.filter((item) => item.isActive).sort((a, b) => a.priority - b.priority)

  if (activeItems.length === 0) return null

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
        <div className="flex items-center gap-2 mb-4">
          <Star className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Contenido Destacado</h3>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {activeItems.slice(0, showInProfile ? 2 : 4).map((item) => (
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
    </div>
  )
}
