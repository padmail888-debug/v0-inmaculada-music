"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Music, Play, Heart, Share2, Calendar, MapPin, ArrowLeft } from "lucide-react"
import { useLikes } from "@/hooks/use-likes"
import { useMusicPlayer } from "@/hooks/use-music-player"

interface ArtistTrack {
  id: string
  title: string
  album: string
  duration: number
  plays: number
  likes: number
  audioUrl: string
  coverUrl: string
}

interface Concert {
  id: number
  title: string
  venue: string
  city: string
  date: string
  time: string
  status: "confirmed" | "cancelled"
}

interface PublicArtistProfile {
  id: string
  name: string
  bio: string
  location: string
  genres: string[]
  followers: number
  monthlyListeners: number
  totalTracks: number
}

export default function ArtistProfileClient({ params }: { params: { artistId: string } }) {
  const router = useRouter()
  const { likedTracks, toggleLike } = useLikes()
  const { playTrack } = useMusicPlayer()

  const [artist, setArtist] = useState<PublicArtistProfile | null>(null)
  const [tracks, setTracks] = useState<ArtistTrack[]>([])
  const [concerts, setConcerts] = useState<Concert[]>([])

  useEffect(() => {
    const mockArtist: PublicArtistProfile = {
      id: params.artistId,
      name: "Luna Serenade",
      bio: "Artista indie pop con influencias folk y acústicas.",
      location: "Barcelona, España",
      genres: ["Indie Pop", "Acoustic", "Folk"],
      followers: 15420,
      monthlyListeners: 45680,
      totalTracks: 12,
    }

    const mockTracks: ArtistTrack[] = [
      {
        id: "1",
        title: "Midnight Dreams",
        album: "Nocturnal Vibes",
        duration: 245,
        plays: 15420,
        likes: 892,
        audioUrl: "/audio/midnight-dreams.mp3",
        coverUrl: "/abstract-music-album-cover.png",
      },
      {
        id: "2",
        title: "Electric Pulse",
        album: "Digital Waves",
        duration: 198,
        plays: 8750,
        likes: 456,
        audioUrl: "/audio/electric-pulse.mp3",
        coverUrl: "/electronic-music-album.png",
      },
      {
        id: "3",
        title: "Acoustic Soul",
        album: "Unplugged Sessions",
        duration: 320,
        plays: 12300,
        likes: 678,
        audioUrl: "/audio/acoustic-soul.mp3",
        coverUrl: "/acoustic-guitar-album.png",
      },
    ]

    const mockConcerts: Concert[] = [
      {
        id: 1,
        title: "Nocturnal Vibes Tour",
        venue: "Sala Apolo",
        city: "Barcelona",
        date: "2024-03-15",
        time: "21:00",
        status: "confirmed",
      },
      {
        id: 2,
        title: "Electronic Nights",
        venue: "WiZink Center",
        city: "Madrid",
        date: "2024-04-20",
        time: "20:30",
        status: "confirmed",
      },
    ]

    setArtist(mockArtist)
    setTracks(mockTracks)
    setConcerts(mockConcerts)
  }, [params.artistId])

  const isLiked = (trackId: string) => likedTracks.includes(trackId)

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
        Cargando artista...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <Button
          variant="ghost"
          className="text-white mb-2"
          onClick={() => {
            router.back()
          }}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Button>

        <Card className="bg-slate-900/60 border-slate-700">
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarImage src="/artist-avatar.png" alt={artist.name} />
              <AvatarFallback>
                <Music className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <CardTitle className="text-3xl font-bold">{artist.name}</CardTitle>
              <p className="text-slate-300">{artist.bio}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="border-slate-600 text-slate-200">
                  <MapPin className="w-3 h-3 mr-1" />
                  {artist.location}
                </Badge>
                {artist.genres.map((genre) => (
                  <Badge key={genre} className="bg-purple-700/60">
                    {genre}
                  </Badge>
                ))}
              </div>
            </div>
          </CardHeader>
        </Card>

        <Tabs defaultValue="tracks" className="space-y-4">
          <TabsList className="bg-slate-900/60 border border-slate-700">
            <TabsTrigger value="tracks">Canciones</TabsTrigger>
            <TabsTrigger value="concerts">Conciertos</TabsTrigger>
          </TabsList>

          <TabsContent value="tracks" className="space-y-3">
            {tracks.map((track) => (
              <Card
                key={track.id}
                className="bg-slate-900/60 border-slate-700 hover:bg-slate-800/80 transition-colors"
              >
                <CardContent className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-4">
                    <Button
                      size="icon"
                      className="rounded-full bg-purple-600 hover:bg-purple-700"
                      onClick={() =>
                        playTrack({
                          id: track.id,
                          title: track.title,
                          artist: artist.name,
                          album: track.album,
                          duration: track.duration,
                          audioUrl: track.audioUrl,
                          coverUrl: track.coverUrl,
                          isPremium: false,
                        })
                      }
                    >
                      <Play className="w-4 h-4" />
                    </Button>
                    <div>
                      <div className="font-semibold">{track.title}</div>
                      <div className="text-sm text-slate-400">
                        {track.album} • {formatDuration(track.duration)}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={isLiked(track.id) ? "text-pink-400" : "text-slate-300"}
                      onClick={() => toggleLike(track.id)}
                    >
                      <Heart className={isLiked(track.id) ? "fill-current" : ""} />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-slate-300">
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="concerts" className="space-y-3">
            {concerts.map((concert) => (
              <Card key={concert.id} className="bg-slate-900/60 border-slate-700">
                <CardContent className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <div className="font-semibold">{concert.title}</div>
                    <div className="text-sm text-slate-400 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {concert.date} • {concert.time}
                      </span>
                      <MapPin className="w-3 h-3 ml-2" />
                      <span>
                        {concert.venue}, {concert.city}
                      </span>
                    </div>
                  </div>
                  <Badge className={concert.status === "confirmed" ? "bg-green-600" : "bg-slate-600"}>
                    {concert.status === "confirmed" ? "Confirmado" : "Cancelado"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

