"use client"

import type React from "react"

import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Star, Plus, Edit, Trash2, Eye, EyeOff, ArrowUp, ArrowDown } from "lucide-react"
import { redirect } from "next/navigation"
import { useState } from "react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"

interface FeaturedContent {
  id: string
  title: string
  description: string
  imageUrl: string
  linkUrl: string
  isActive: boolean
  priority: number
  type: "announcement" | "promotion" | "event"
  createdAt: string
  updatedAt: string
}

export default function AdminFeaturedPage() {
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [editingItem, setEditingItem] = useState<FeaturedContent | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    imageUrl: "",
    linkUrl: "",
    type: "announcement" as "announcement" | "promotion" | "event",
    isActive: true,
  })

  if (!user || user.role !== "superadmin") {
    redirect("/dashboard")
  }

  // Mock featured content data - in real app this would come from API
  const [featuredContent, setFeaturedContent] = useState<FeaturedContent[]>([
    {
      id: "1",
      title: "🎵 Nueva Función: Playlists Colaborativas",
      description:
        "Crea playlists con tus amigos y descubre nueva música juntos. Esta nueva función permite a los usuarios invitar a otros a colaborar en sus playlists.",
      imageUrl: "/collaborative-playlists-music.jpg",
      linkUrl: "/playlists/collaborative",
      isActive: true,
      priority: 1,
      type: "announcement",
      createdAt: "2024-01-15",
      updatedAt: "2024-01-20",
    },
    {
      id: "2",
      title: "🎤 Concurso de Talentos 2024",
      description:
        "Participa en nuestro concurso anual y gana increíbles premios. Inscripciones abiertas hasta el 31 de marzo.",
      imageUrl: "/music-talent-contest-stage.jpg",
      linkUrl: "/contest/2024",
      isActive: true,
      priority: 2,
      type: "event",
      createdAt: "2024-01-10",
      updatedAt: "2024-01-18",
    },
    {
      id: "3",
      title: "🎧 Descuento Premium 50%",
      description: "Obtén 3 meses de Premium con 50% de descuento. Oferta limitada por tiempo limitado.",
      imageUrl: "/premium-discount-headphones.jpg",
      linkUrl: "/premium/offer",
      isActive: false,
      priority: 3,
      type: "promotion",
      createdAt: "2024-01-05",
      updatedAt: "2024-01-15",
    },
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (editingItem) {
      // Update existing item
      setFeaturedContent((prev) =>
        prev.map((item) =>
          item.id === editingItem.id
            ? { ...item, ...formData, updatedAt: new Date().toISOString().split("T")[0] }
            : item,
        ),
      )
      setEditingItem(null)
    } else {
      // Create new item
      const newItem: FeaturedContent = {
        id: Date.now().toString(),
        ...formData,
        priority: featuredContent.length + 1,
        createdAt: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString().split("T")[0],
      }
      setFeaturedContent((prev) => [...prev, newItem])
    }

    setFormData({
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      type: "announcement",
      isActive: true,
    })
    setIsCreating(false)
  }

  const handleEdit = (item: FeaturedContent) => {
    setEditingItem(item)
    setFormData({
      title: item.title,
      description: item.description,
      imageUrl: item.imageUrl,
      linkUrl: item.linkUrl,
      type: item.type,
      isActive: item.isActive,
    })
    setIsCreating(true)
  }

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este contenido destacado?")) {
      setFeaturedContent((prev) => prev.filter((item) => item.id !== id))
    }
  }

  const toggleActive = (id: string) => {
    setFeaturedContent((prev) => prev.map((item) => (item.id === id ? { ...item, isActive: !item.isActive } : item)))
  }

  const movePriority = (id: string, direction: "up" | "down") => {
    setFeaturedContent((prev) => {
      const items = [...prev]
      const index = items.findIndex((item) => item.id === id)
      if (index === -1) return prev

      const newIndex = direction === "up" ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= items.length) return prev

      // Swap priorities
      const temp = items[index].priority
      items[index].priority = items[newIndex].priority
      items[newIndex].priority = temp

      return items.sort((a, b) => a.priority - b.priority)
    })
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
    <AppShell>
    <div className="max-w-7xl mx-auto min-w-0">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Link href="/admin" className="text-gray-400 hover:text-white">
            Admin
          </Link>
          <span className="text-gray-400">/</span>
          <span className="text-white">Contenido Destacado</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-400" />
              Gestión de Contenido Destacado
            </h1>
            <p className="text-gray-400">Administra los anuncios y promociones que aparecen en los perfiles</p>
          </div>
          <Button onClick={() => setIsCreating(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Contenido
          </Button>
        </div>
      </div>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card className="bg-slate-800 border-slate-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">
              {editingItem ? "Editar Contenido Destacado" : "Crear Nuevo Contenido Destacado"}
            </CardTitle>
            <CardDescription>
              {editingItem
                ? "Modifica la información del contenido destacado"
                : "Agrega nuevo contenido que aparecerá en los perfiles de usuarios"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="title" className="text-white">
                    Título
                  </Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Título del contenido destacado"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="type" className="text-white">
                    Tipo
                  </Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-700 border-slate-600">
                      <SelectItem value="announcement">Anuncio</SelectItem>
                      <SelectItem value="promotion">Promoción</SelectItem>
                      <SelectItem value="event">Evento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-white">
                  Descripción
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descripción del contenido destacado"
                  className="bg-slate-700 border-slate-600 text-white"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="imageUrl" className="text-white">
                    URL de Imagen
                  </Label>
                  <Input
                    id="imageUrl"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    placeholder="https://ejemplo.com/imagen.jpg"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="linkUrl" className="text-white">
                    URL de Enlace
                  </Label>
                  <Input
                    id="linkUrl"
                    value={formData.linkUrl}
                    onChange={(e) => setFormData({ ...formData, linkUrl: e.target.value })}
                    placeholder="/pagina-destino"
                    className="bg-slate-700 border-slate-600 text-white"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive" className="text-white">
                  Activo (visible en perfiles)
                </Label>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingItem ? "Actualizar" : "Crear"} Contenido
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreating(false)
                    setEditingItem(null)
                    setFormData({
                      title: "",
                      description: "",
                      imageUrl: "",
                      linkUrl: "",
                      type: "announcement",
                      isActive: true,
                    })
                  }}
                  className="border-slate-600 text-white bg-transparent"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Content List */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Contenido Destacado Actual</CardTitle>
          <CardDescription>
            Gestiona todo el contenido destacado que aparece en los perfiles de usuarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {featuredContent
              .sort((a, b) => a.priority - b.priority)
              .map((item) => (
                <div key={item.id} className="flex items-start gap-4 p-4 bg-slate-700 rounded-lg">
                  <img
                    src={item.imageUrl || "/placeholder.svg"}
                    alt={item.title}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-white truncate">{item.title}</h3>
                        <p className="text-sm text-gray-400 line-clamp-2">{item.description}</p>
                      </div>
                      <div className="flex items-center gap-2 ml-4">
                        <Badge className={`${getTypeColor(item.type)} text-white`}>{getTypeLabel(item.type)}</Badge>
                        {item.isActive ? (
                          <Badge className="bg-green-600 text-white">
                            <Eye className="h-3 w-3 mr-1" />
                            Activo
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-600 text-white">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Inactivo
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        <span>Creado: {item.createdAt}</span>
                        <span className="mx-2">•</span>
                        <span>Actualizado: {item.updatedAt}</span>
                        <span className="mx-2">•</span>
                        <span>Prioridad: #{item.priority}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => movePriority(item.id, "up")}
                          className="border-slate-600 text-white bg-transparent h-8 w-8 p-0"
                          disabled={item.priority === 1}
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => movePriority(item.id, "down")}
                          className="border-slate-600 text-white bg-transparent h-8 w-8 p-0"
                          disabled={item.priority === featuredContent.length}
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleActive(item.id)}
                          className={`h-8 w-8 p-0 ${
                            item.isActive
                              ? "border-green-600 text-green-400 bg-transparent"
                              : "border-gray-600 text-gray-400 bg-transparent"
                          }`}
                        >
                          {item.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                          className="border-blue-600 text-blue-400 bg-transparent h-8 w-8 p-0"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDelete(item.id)}
                          className="border-red-600 text-red-400 bg-transparent h-8 w-8 p-0"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>
    </div>
    </AppShell>
  )
}
