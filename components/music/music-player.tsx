"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Download, Repeat1, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/hooks/use-auth"
import { useOffline } from "@/hooks/use-offline"
import { useMusicPlayer } from "@/hooks/use-music-player"

interface Track {
  id: string
  title: string
  artist: string
  album: string
  duration: number
  audioUrl: string
  coverUrl: string
  isPremium: boolean
  lyrics?: string // Added lyrics property to Track interface
}

export function MusicPlayer() {
  const { user } = useAuth()
  const { downloadTrack, isTrackDownloaded, getOfflineTrack, removeDownload, isOnline } = useOffline()
  const {
    currentTrack,
    isPlaying,
    isShuffled,
    repeatMode,
    playPause,
    nextTrack,
    previousTrack,
    toggleShuffle,
    toggleRepeat,
  } = useMusicPlayer()

  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [volume, setVolume] = useState(70)
  const [isDownloaded, setIsDownloaded] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [audioSrc, setAudioSrc] = useState<string>("")
  const [showLyrics, setShowLyrics] = useState(false) // Added state for lyrics modal

  const mockLyrics = {
    "1": `Verse 1:
Walking through the midnight streets
City lights beneath my feet
Dreams are calling out my name
Nothing will ever be the same

Chorus:
Midnight dreams are calling me
To a place I've never been
In the darkness I can see
All the light that lies within

Verse 2:
Stars are dancing in the sky
Time keeps passing by and by
Every moment feels so real
This is how I want to feel

Chorus:
Midnight dreams are calling me
To a place I've never been
In the darkness I can see
All the light that lies within

Bridge:
When the world gets too heavy
And the road seems too long
I remember this feeling
And it makes me strong

Final Chorus:
Midnight dreams are calling me
To a place I've never been
In the darkness I can see
All the light that lies within
All the light that lies within`,
    "2": `Verse 1:
Sitting by the window pane
Watching drops of summer rain
Guitar strings beneath my hands
Playing songs from distant lands

Chorus:
Acoustic soul, it speaks to me
In melodies so pure and free
Every note tells a story
Of love and pain and glory

Verse 2:
Coffee shop on Sunday morning
Life outside is slowly dawning
Music flows like gentle streams
Carrying all my hopes and dreams

Chorus:
Acoustic soul, it speaks to me
In melodies so pure and free
Every note tells a story
Of love and pain and glory

Bridge:
No need for amplifiers loud
Just me and music, nothing proud
Simple chords that touch the heart
That's where real music starts

Final Chorus:
Acoustic soul, it speaks to me
In melodies so pure and free
Every note tells a story
Of love and pain and glory
Of love and pain and glory`,
    "3": `Verse 1:
Coffee brewing in the morning light
Jazz piano playing soft and bright
Conversations blend with saxophone
In this place I call my second home

Chorus:
Coffee shop jazz, smooth and warm
Like a shelter from the storm
Every sip and every note
Makes my weary spirit float

Verse 2:
Newspapers and laptop screens
People chasing all their dreams
But the music keeps me grounded
In this moment, I'm surrounded

Chorus:
Coffee shop jazz, smooth and warm
Like a shelter from the storm
Every sip and every note
Makes my weary spirit float

Bridge:
When the world moves way too fast
And I need something that will last
I come here to find my peace
Where the music never cease

Final Chorus:
Coffee shop jazz, smooth and warm
Like a shelter from the storm
Every sip and every note
Makes my weary spirit float
Makes my weary spirit float`,
  }

  const getCurrentLyrics = () => {
    if (currentTrack?.lyrics) {
      return currentTrack.lyrics
    }
    return mockLyrics[currentTrack?.id as keyof typeof mockLyrics] || "Letras no disponibles para esta canción."
  }

  useEffect(() => {
    if (!currentTrack) return

    const checkDownloadStatus = async () => {
      const downloaded = await isTrackDownloaded(currentTrack.id)
      setIsDownloaded(downloaded)

      if (downloaded) {
        const offlineTrack = await getOfflineTrack(currentTrack.id)
        if (offlineTrack) {
          const audioUrl = URL.createObjectURL(offlineTrack.audioBlob)
          setAudioSrc(audioUrl)
          console.log("[v0] Using offline audio for:", currentTrack.title)
        }
      } else if (isOnline) {
        const validAudioUrl = currentTrack.audioUrl || "/placeholder-audio.mp3"
        setAudioSrc(validAudioUrl)
        console.log("[v0] Using online audio for:", currentTrack.title)
      } else {
        console.log("[v0] Track not available offline:", currentTrack.title)
        setAudioSrc("")
      }
    }

    checkDownloadStatus()
  }, [currentTrack, isTrackDownloaded, getOfflineTrack, isOnline])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const handleEnded = () => {
      if (repeatMode === "one") {
        audio.currentTime = 0
        audio.play()
      } else {
        nextTrack()
      }
    }

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("ended", handleEnded)

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("ended", handleEnded)
    }
  }, [currentTrack, nextTrack, repeatMode])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.play()
    } else {
      audio.pause()
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (audio) {
      audio.volume = volume / 100
    }
  }, [volume])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (audio && currentTrack) {
      const newTime = (value[0] / 100) * currentTrack.duration
      audio.currentTime = newTime
      setCurrentTime(newTime)
    }
  }

  const handleDownload = async () => {
    if (!currentTrack || user?.role === "free" || isDownloading) return

    if (isDownloaded) {
      console.log("[v0] Removing download for:", currentTrack.title)
      const success = await removeDownload(currentTrack.id)
      if (success) {
        setIsDownloaded(false)
        setAudioSrc(currentTrack.audioUrl)
      }
    } else {
      setIsDownloading(true)
      console.log("[v0] Downloading track for offline:", currentTrack.title)

      const success = await downloadTrack(currentTrack)
      if (success) {
        setIsDownloaded(true)
        const offlineTrack = await getOfflineTrack(currentTrack.id)
        if (offlineTrack) {
          const audioUrl = URL.createObjectURL(offlineTrack.audioBlob)
          setAudioSrc(audioUrl)
        }
      }
      setIsDownloading(false)
    }
  }

  if (!currentTrack) {
    return null
  }

  const progress = currentTrack.duration > 0 ? (currentTime / currentTrack.duration) * 100 : 0

  return (
    <>
      <div className="h-20 bg-black/40 backdrop-blur-xl border-t border-white/10 flex items-center px-4">
        <audio ref={audioRef} src={audioSrc && audioSrc.trim() !== "" ? audioSrc : null} />

        {!isOnline && (
          <div className="absolute top-2 left-4 bg-orange-500 text-white text-xs px-2 py-1 rounded-full">
            Modo Offline
          </div>
        )}

        <div className="flex items-center space-x-3 w-1/4">
          <img
            src={
              currentTrack.coverUrl && currentTrack.coverUrl.trim() !== ""
                ? currentTrack.coverUrl
                : "/abstract-soundscape.png"
            }
            alt={currentTrack.album}
            className="w-12 h-12 rounded object-cover"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = "/abstract-soundscape.png"
            }}
          />
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentTrack.title}</p>
            <p className="text-slate-400 text-xs truncate">{currentTrack.artist}</p>
            {isDownloaded && <p className="text-green-400 text-xs">Descargado</p>}
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center space-y-2">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleShuffle}
              className={`${isShuffled ? "text-green-400" : "text-slate-400"} hover:text-white`}
            >
              <Shuffle className="h-4 w-4" />
            </Button>

            <Button variant="ghost" size="sm" onClick={previousTrack} className="text-slate-400 hover:text-white">
              <SkipBack className="h-4 w-4" />
            </Button>

            <Button onClick={playPause} className="bg-white text-black hover:bg-white/90 rounded-full w-8 h-8">
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </Button>

            <Button variant="ghost" size="sm" onClick={nextTrack} className="text-slate-400 hover:text-white">
              <SkipForward className="h-4 w-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleRepeat}
              className={`${repeatMode !== "none" ? "text-green-400" : "text-slate-400"} hover:text-white`}
            >
              {repeatMode === "one" ? <Repeat1 className="h-4 w-4" /> : <Repeat className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex items-center space-x-2 w-full max-w-md">
            <span className="text-xs text-slate-400 w-10 text-right">{formatTime(currentTime)}</span>

            <Slider value={[progress]} onValueChange={handleSeek} max={100} step={1} className="flex-1" />

            <span className="text-xs text-slate-400 w-10">{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-1/4 justify-end">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowLyrics(true)}
            className="text-slate-400 hover:text-white"
            title="Ver letras"
          >
            <FileText className="h-4 w-4" />
          </Button>

          {(user?.role === "premium" || user?.role === "artist") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={isDownloading || (!isOnline && !isDownloaded)}
              className={`${isDownloaded ? "text-green-400" : isDownloading ? "text-yellow-400" : "text-slate-400"} hover:text-white disabled:opacity-50`}
            >
              <Download className={`${isDownloading ? "animate-pulse" : ""} h-4 w-4`} />
            </Button>
          )}

          <div className="flex items-center space-x-2">
            <Volume2 className="h-4 w-4 text-slate-400" />
            <Slider
              value={[volume]}
              onValueChange={(value) => setVolume(value[0])}
              max={100}
              step={1}
              className="w-20"
            />
          </div>
        </div>
      </div>

      <Dialog open={showLyrics} onOpenChange={setShowLyrics}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              <div>
                <h3 className="text-xl font-bold">{currentTrack.title}</h3>
                <p className="text-slate-400 text-sm">{currentTrack.artist}</p>
              </div>
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh] pr-4">
            <div className="whitespace-pre-line text-slate-200 leading-relaxed">{getCurrentLyrics()}</div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  )
}
