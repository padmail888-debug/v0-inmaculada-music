"use client"

import {
  Home,
  Search,
  Library,
  Plus,
  Heart,
  Download,
  Upload,
  User,
  Settings,
  Shield,
  List,
  Menu,
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Suspense, useEffect, useState, type MouseEvent, type ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { hasPaidAccess, userShouldHideUpgradePrompt } from "@/lib/user-role"

type SidebarNavProps = {
  onNavigate?: () => void
}

const sidebarNavBtnClass = "w-full justify-start text-white hover:bg-white/10"

function SidebarNavLink({
  href,
  icon: Icon,
  children,
  onNavigate,
}: {
  href: string
  icon: LucideIcon
  children: ReactNode
  onNavigate?: () => void
}) {
  const router = useRouter()

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!onNavigate) return
    event.preventDefault()
    onNavigate()
    window.setTimeout(() => router.push(href), 100)
  }

  return (
    <Button asChild variant="ghost" className={sidebarNavBtnClass}>
      <Link href={href} onClick={handleClick}>
        <Icon className="mr-3 h-5 w-5" />
        {children}
      </Link>
    </Button>
  )
}

function SidebarNav({ onNavigate }: SidebarNavProps) {
  const router = useRouter()
  const { user, refreshUserFromSupabase } = useAuth()
  const searchParams = useSearchParams()
  const justPaid = searchParams.get("success") === "true"
  const planFromUrl = searchParams.get("plan")

  const showUpgradeBlock = !justPaid && !userShouldHideUpgradePrompt(user)

  const isPremiumOrPro =
    hasPaidAccess(user?.role) || user?.subscription?.status === "active" || justPaid

  const showArtistNav =
    user?.role === "artist" ||
    user?.role === "artist-pro" ||
    user?.subscription?.plan === "artist-pro" ||
    (justPaid && planFromUrl === "artist-pro")
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false)
  const [playlistName, setPlaylistName] = useState("")
  const [playlistDescription, setPlaylistDescription] = useState("")

  useEffect(() => {
    if (!user?.id || userShouldHideUpgradePrompt(user)) return
    void refreshUserFromSupabase()
  }, [user?.id, user?.role, user?.subscription?.status, refreshUserFromSupabase])

  const handleCreatePlaylist = () => {
    console.log("Creating playlist:", { name: playlistName, description: playlistDescription })
    setPlaylistName("")
    setPlaylistDescription("")
    setIsCreatePlaylistOpen(false)
    onNavigate?.()
  }

  const homeHref =
    user?.role === "artist" || user?.role === "artist-pro" ? "/artist/profile" : "/dashboard"

  return (
    <>
      <div className="mb-8">
        <h2 className="text-xl font-bold text-white">MusicStream</h2>
      </div>

      <nav className="space-y-2">
        <SidebarNavLink href={homeHref} icon={Home} onNavigate={onNavigate}>
          Inicio
        </SidebarNavLink>

        <SidebarNavLink href="/search" icon={Search} onNavigate={onNavigate}>
          Buscar
        </SidebarNavLink>

        <SidebarNavLink href="/playlists" icon={Library} onNavigate={onNavigate}>
          Tu biblioteca
        </SidebarNavLink>

        <SidebarNavLink href="/queue" icon={List} onNavigate={onNavigate}>
          Cola de reproducción
        </SidebarNavLink>

        {isPremiumOrPro && (
          <SidebarNavLink href="/offline" icon={Download} onNavigate={onNavigate}>
            Descargas
          </SidebarNavLink>
        )}

        {showArtistNav && (
          <SidebarNavLink href="/artist/profile" icon={User} onNavigate={onNavigate}>
            Mi Perfil de Artista
          </SidebarNavLink>
        )}

        {user?.role === "superadmin" && (
          <SidebarNavLink href="/admin" icon={Shield} onNavigate={onNavigate}>
            Panel Admin
          </SidebarNavLink>
        )}
      </nav>

      <div className="mt-8 border-t border-white/10 pt-4">
        <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" className="mb-2 w-full justify-start text-white hover:bg-white/10">
              <Plus className="mr-3 h-5 w-5" />
              Crear playlist
            </Button>
          </DialogTrigger>
          <DialogContent className="border-slate-700 bg-slate-800">
            <DialogHeader>
              <DialogTitle className="text-white">Crear nueva playlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Nombre de la playlist</label>
                <Input
                  placeholder="Mi playlist #1"
                  value={playlistName}
                  onChange={(e) => setPlaylistName(e.target.value)}
                  className="border-slate-600 bg-slate-700 text-white"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-white">Descripción (opcional)</label>
                <Textarea
                  placeholder="Describe tu playlist..."
                  value={playlistDescription}
                  onChange={(e) => setPlaylistDescription(e.target.value)}
                  className="border-slate-600 bg-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="ghost" onClick={() => setIsCreatePlaylistOpen(false)} className="text-white">
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={!playlistName.trim()}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Crear
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <SidebarNavLink href="/liked" icon={Heart} onNavigate={onNavigate}>
          Canciones que te gustan
        </SidebarNavLink>

        {showArtistNav && (
          <SidebarNavLink href="/artist/upload" icon={Upload} onNavigate={onNavigate}>
            Subir Música
          </SidebarNavLink>
        )}

        {user && (
          <SidebarNavLink href="/profile" icon={Settings} onNavigate={onNavigate}>
            Configuración
          </SidebarNavLink>
        )}
      </div>

      {showUpgradeBlock && (
        <div className="mt-8 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 p-4">
          <h3 className="mb-2 font-semibold">Actualiza a Premium</h3>
          <p className="mb-3 text-sm text-white/80">Escucha sin anuncios y descarga música</p>
          <Button asChild size="sm" className="w-full bg-white text-black hover:bg-white/90">
            <Link
              href="/subscription"
              onClick={(event) => {
                if (!onNavigate) return
                event.preventDefault()
                onNavigate()
                window.setTimeout(() => router.push("/subscription"), 100)
              }}
            >
              Actualizar
            </Link>
          </Button>
        </div>
      )}
    </>
  )
}

function SidebarShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <div className="flex shrink-0 items-center border-b border-white/10 bg-black/20 px-3 py-2 md:hidden">
        <Button
          type="button"
          variant="ghost"
          className="text-white hover:bg-white/10"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú de navegación"
        >
          <Menu className="mr-2 h-5 w-5" />
          Menú
        </Button>
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-[min(100vw-2rem,18rem)] overflow-y-auto border-slate-700 bg-slate-900 p-6 pt-8 text-white sm:max-w-xs"
        >
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black/20 p-6 backdrop-blur-xl md:block">
        <SidebarNav />
      </aside>
    </>
  )
}

export function Sidebar() {
  return (
    <Suspense
      fallback={
        <aside className="hidden w-64 shrink-0 border-r border-white/10 bg-black/20 md:block" aria-hidden />
      }
    >
      <SidebarShell />
    </Suspense>
  )
}
