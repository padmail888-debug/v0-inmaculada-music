"use client"

import {
  Bell,
  Settings,
  User,
  LogOut,
  Crown,
  Music,
  ArrowLeft,
  ArrowRight,
  Home,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useNotificationInboxPreview } from "@/hooks/use-notification-inbox-preview"
import { getPostLoginPath } from "@/lib/user-role"

const navBtnClass =
  "text-white hover:bg-white/10 min-h-[44px] min-w-[44px] p-0 sm:min-h-9 sm:min-w-9 sm:px-3"

export function TopBar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const { unreadCount, liveBanner } = useNotificationInboxPreview(user?.id, "topbar")

  const isArtist = user?.role === "artist" || user?.role === "artist-pro"
  const showSubscriptionLink = user?.role === "free" || user?.role === "artist"

  useEffect(() => {
    if (!isUserMenuOpen) return
    const onPointerDown = (event: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsUserMenuOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [isUserMenuOpen])

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back()
    } else {
      router.push("/dashboard")
    }
  }

  const goForward = () => {
    window.history.forward()
  }

  const goHome = () => {
    router.push(user?.role ? getPostLoginPath(user.role) : "/dashboard")
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "artist":
      case "artist-pro":
        return <Music className="h-3 w-3" />
      case "premium":
        return <Crown className="h-3 w-3" />
      case "superadmin":
        return <Crown className="h-3 w-3 text-yellow-500" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "artist":
      case "artist-pro":
        return "bg-purple-500"
      case "premium":
        return "bg-blue-500"
      case "superadmin":
        return "bg-yellow-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <>
      {liveBanner && (
        <div
          role="status"
          className="fixed z-50 max-w-[min(20rem,calc(100vw-2rem))] rounded-md border border-purple-400/30 bg-slate-900/95 px-4 py-3 shadow-lg top-[calc(3.5rem+max(1rem,var(--app-safe-area-top,0px),env(safe-area-inset-top,0px))+0.5rem)] right-[max(1rem,env(safe-area-inset-right,0px))] sm:top-[calc(4rem+max(1rem,var(--app-safe-area-top,0px),env(safe-area-inset-top,0px))+0.5rem)]"
        >
          <p className="text-sm font-semibold text-white">{liveBanner.title}</p>
          <p className="mt-1 text-xs text-slate-300">{liveBanner.message}</p>
        </div>
      )}

      <header className="top-bar-safe flex shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-black/20 px-3 backdrop-blur-xl sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-6">
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2 min-h-[44px]">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="hidden truncate font-bold text-white text-base sm:inline sm:text-lg">MusicStream</span>
          </Link>

          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <Button variant="ghost" size="sm" className={navBtnClass} onClick={goBack} aria-label="Atrás">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={`hidden sm:inline-flex ${navBtnClass}`}
              onClick={goForward}
              aria-label="Adelante"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className={navBtnClass} onClick={goHome} aria-label="Inicio">
              <Home className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`relative ${navBtnClass}`}
            onClick={() => router.push("/notifications")}
            aria-label="Notificaciones"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[10px] font-medium text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>

          <div ref={menuRef} className="relative">
            <Button
              variant="ghost"
              className="flex h-11 min-h-[44px] items-center gap-2 px-1.5 text-white hover:bg-white/10 sm:h-10 sm:px-2"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              aria-label="Menú de cuenta"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-blue-500 text-sm text-white">
                  {user?.name?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden flex-col items-start sm:flex">
                <span className="max-w-[8rem] truncate text-sm font-medium">{user?.name}</span>
                <Badge className={`${getRoleColor(user?.role || "free")} h-4 text-xs text-white`}>
                  {getRoleIcon(user?.role || "free")}
                  <span className="ml-1 capitalize">{user?.role}</span>
                </Badge>
              </div>
            </Button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-md border border-slate-700 bg-slate-800 shadow-lg"
              >
                <div className="border-b border-slate-700 px-3 py-2">
                  <p className="text-xs text-slate-400">Mi Cuenta</p>
                  <p className="truncate text-sm font-medium text-white">{user?.email}</p>
                </div>

                <div className="py-1">
                  <Link href="/profile" onClick={() => setIsUserMenuOpen(false)} role="menuitem">
                    <div className="flex min-h-[44px] cursor-pointer items-center px-3 py-2 text-sm text-white hover:bg-slate-700 sm:min-h-0">
                      <User className="mr-2 h-4 w-4 shrink-0" />
                      <span>Perfil</span>
                    </div>
                  </Link>

                  {showSubscriptionLink ? (
                    <Link href="/subscription" onClick={() => setIsUserMenuOpen(false)} role="menuitem">
                      <div className="flex min-h-[44px] cursor-pointer items-center px-3 py-2 text-sm text-white hover:bg-slate-700 sm:min-h-0">
                        <Crown className="mr-2 h-4 w-4 shrink-0" />
                        <span>Suscripción</span>
                      </div>
                    </Link>
                  ) : null}

                  <Link href="/help" onClick={() => setIsUserMenuOpen(false)} role="menuitem">
                    <div className="flex min-h-[44px] cursor-pointer items-center px-3 py-2 text-sm text-white hover:bg-slate-700 sm:min-h-0">
                      <HelpCircle className="mr-2 h-4 w-4 shrink-0" />
                      <span>Ayuda</span>
                    </div>
                  </Link>

                  {isArtist ? (
                    <Link href="/artist/profile" onClick={() => setIsUserMenuOpen(false)} role="menuitem">
                      <div className="flex min-h-[44px] cursor-pointer items-center px-3 py-2 text-sm text-white hover:bg-slate-700 sm:min-h-0">
                        <Music className="mr-2 h-4 w-4 shrink-0" />
                        <span>Perfil de Artista</span>
                      </div>
                    </Link>
                  ) : null}

                  {user?.role === "superadmin" ? (
                    <Link href="/admin" onClick={() => setIsUserMenuOpen(false)} role="menuitem">
                      <div className="flex min-h-[44px] cursor-pointer items-center px-3 py-2 text-sm text-white hover:bg-slate-700 sm:min-h-0">
                        <Settings className="mr-2 h-4 w-4 shrink-0" />
                        <span>Panel Admin</span>
                      </div>
                    </Link>
                  ) : null}

                  <div className="mt-1 border-t border-slate-700">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsUserMenuOpen(false)
                        logout()
                        window.location.href = "/login"
                      }}
                      className="flex min-h-[44px] w-full cursor-pointer items-center px-3 py-2 text-sm text-red-400 hover:bg-slate-700 sm:min-h-0"
                    >
                      <LogOut className="mr-2 h-4 w-4 shrink-0" />
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
