"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Download, Heart, Share2, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"

const StripeCheckout = dynamic(() => import("@/components/payment/stripe-checkout"), { ssr: false })

export default function PurchasePageClient({ params }: { params: { songId: string } }) {
  const { user } = useAuth()
  const [showCheckout, setShowCheckout] = useState(false)
  const [purchased, setPurchased] = useState(false)

  const song = {
    id: params.songId,
    title: "Midnight Dreams",
    artist: "Luna Rodriguez",
    album: "Nocturnal Vibes",
    duration: "3:45",
    price: "1.99",
    cover: "/abstract-music-album-cover.png",
    preview: "/api/songs/preview/" + params.songId,
    genre: "Electronic",
    releaseDate: "2024",
    description:
      "Una mezcla hipnótica de sonidos electrónicos y melodías oníricas que te transportará a un mundo de ensueño nocturno.",
  }

  const handlePurchase = () => {
    if (user?.subscription === "premium") {
      return
    }
    setShowCheckout(true)
  }

  const handlePurchaseSuccess = () => {
    setPurchased(true)
    setShowCheckout(false)
  }

  if (showCheckout) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto min-w-0">
          <div className="mb-6">
            <Link href={`/purchase/${song.id}`}>
              <Button variant="outline" className="text-white border-slate-600 hover:bg-slate-700">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver a la página de compra
              </Button>
            </Link>
          </div>
          <StripeCheckout
            planName={`Compra: ${song.title}`}
            price={song.price}
            priceId={"price_single_purchase"}
            onSuccess={handlePurchaseSuccess}
          />
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto min-w-0">
        <Link href="/dashboard">
          <Button variant="ghost" className="text-white mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al Dashboard
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
              <CardContent className="p-6">
                <div className="aspect-square mb-6 relative overflow-hidden rounded-lg">
                  <img
                    src={song.cover || "/placeholder.svg"}
                    alt={`${song.title} cover`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button size="lg" className="rounded-full">
                      <Play className="w-6 h-6" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h1 className="text-2xl font-bold text-white">{song.title}</h1>
                    <p className="text-purple-400 text-lg">{song.artist}</p>
                    <p className="text-slate-400">
                      {song.album} • {song.releaseDate}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <Badge variant="secondary" className="bg-purple-600/20 text-purple-300">
                      {song.genre}
                    </Badge>
                    <span className="text-slate-400">{song.duration}</span>
                  </div>

                  <p className="text-slate-300 leading-relaxed">{song.description}</p>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="border-slate-600 text-white bg-transparent">
                      <Heart className="w-4 h-4 mr-2" />
                      Me gusta
                    </Button>
                    <Button variant="outline" size="sm" className="border-slate-600 text-white bg-transparent">
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {user?.subscription === "premium" ? (
              <Card className="bg-green-900/20 border-green-700">
                <CardHeader>
                  <CardTitle className="text-green-400">¡Ya tienes acceso!</CardTitle>
                  <CardDescription className="text-green-300">
                    Como usuario Premium, puedes escuchar esta canción sin límites
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Reproducir
                    </Button>
                    <Button className="flex-1 bg-green-600 hover:bg-green-700">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : purchased ? (
              <Card className="bg-blue-900/20 border-blue-700">
                <CardHeader>
                  <CardTitle className="text-blue-400">¡Compra exitosa!</CardTitle>
                  <CardDescription className="text-blue-300">Ya puedes disfrutar de esta canción</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Play className="w-4 h-4 mr-2" />
                      Reproducir
                    </Button>
                    <Button className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <Download className="w-4 h-4 mr-2" />
                      Descargar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-white">Compra Individual</CardTitle>
                    <CardDescription className="text-slate-400">
                      Compra esta canción y tenla para siempre
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-white">${song.price}</span>
                      <Badge className="bg-purple-600">Compra única</Badge>
                    </div>
                    <ul className="space-y-2 text-slate-300 mb-4">
                      <li>• Acceso permanente</li>
                      <li>• Descarga en alta calidad</li>
                      <li>• Sin anuncios</li>
                    </ul>
                    <Button onClick={handlePurchase} className="w-full bg-purple-600 hover:bg-purple-700">
                      Comprar por ${song.price}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 border-purple-700">
                  <CardHeader>
                    <CardTitle className="text-white">¿Por qué no Premium?</CardTitle>
                    <CardDescription className="text-purple-200">
                      Acceso ilimitado a todo el catálogo por solo $9.99/mes
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-purple-100 mb-4">
                      <li>• Millones de canciones</li>
                      <li>• Sin anuncios</li>
                      <li>• Modo offline</li>
                      <li>• Calidad premium</li>
                    </ul>
                    <Link href="/subscription">
                      <Button
                        variant="outline"
                        className="w-full border-purple-400 text-purple-300 hover:bg-purple-800 bg-transparent"
                      >
                        Ver planes Premium
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}

