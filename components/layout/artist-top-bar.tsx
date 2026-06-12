"use client"

import { Bell, LogOut, Music, Upload, User, Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useNotificationInboxPreview } from "@/hooks/use-notification-inbox-preview"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import type { UserRole } from "@/lib/auth-types"

function formatRoleLabel(role: UserRole | undefined): string {
  switch (role) {
    case "artist-pro":
      return "Artist Pro"
    case "artist":
      return "Artista"
    case "premium":
      return "Premium"
    case "free":
      return "Gratis"
    case "superadmin":
      return "Admin"
    default:
      return "Artista"
  }
}

function roleBadgeClass(role: UserRole | undefined): string {
  switch (role) {
    case "artist-pro":
      return "bg-gradient-to-r from-yellow-500 to-orange-500"
    case "premium":
      return "bg-blue-500"
    case "superadmin":
      return "bg-yellow-500"
    case "free":
      return "bg-slate-500"
    default:
      return "bg-purple-500"
  }
}

const navBtnClass =
  "touch-manipulation text-white hover:bg-white/10 min-h-[44px] min-w-[44px] p-0 sm:min-h-9 sm:min-w-9 sm:px-3"

const sheetNavClass = (active: boolean) =>
  `flex min-h-[48px] touch-manipulation items-center gap-3 rounded-lg px-3 py-3 text-base transition-colors ${
    active ? "bg-white/15 text-white" : "text-slate-200 active:bg-white/10"
  }`

export function ArtistTopBar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const { unreadCount, liveBanner } = useNotificationInboxPreview(user?.id, "artist-topbar")

  const roleLabel = formatRoleLabel(user?.role)

  const navLinks = [
    { href: "/artist/profile", label: "Mi Perfil", icon: User },
    { href: "/artist/upload", label: "Subir Música", icon: Upload },
  ]

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const linkClass = (href: string) =>
    `flex min-h-[44px] touch-manipulation items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
      isActive(href) ? "bg-white/15 text-white" : "text-slate-300 hover:bg-white/10 hover:text-white"
    }`

  const closeAllMenus = () => {
    setIsUserMenuOpen(false)
    setMobileNavOpen(false)
  }

  useEffect(() => {
    closeAllMenus()
  }, [pathname])

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

  const goToNotifications = () => {
    closeAllMenus()
    router.push("/artist/notifications")
  }

  const handleLogout = () => {
    closeAllMenus()
    logout()
    window.location.href = "/login"
  }

  return (
    <>
      {liveBanner && (
        <div
          role="status"
          className="fixed z-50 max-w-[min(20rem,calc(100vw-2rem))] rounded-md border border-purple-400/30 bg-slate-900/95 px-4 py-3 shadow-lg top-[calc(var(--site-header-offset,3.5rem)+0.5rem)] right-[max(0.75rem,env(safe-area-inset-right,0px))] left-[max(0.75rem,env(safe-area-inset-left,0px))] sm:left-auto"
        >
          <p className="text-sm font-semibold text-white">{liveBanner.title}</p>
          <p className="mt-1 text-xs text-slate-300 line-clamp-2">{liveBanner.message}</p>
        </div>
      )}

      <header
        className="top-bar-safe relative z-40 flex shrink-0 items-center justify-between gap-1 border-b border-white/10 bg-black/30 px-[max(0.75rem,env(safe-area-inset-left,0px))] backdrop-blur-xl sm:gap-2 sm:px-6"
        style={{ paddingRight: "max(0.75rem, env(safe-area-inset-right, 0px))" }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-4">
          <Button
            type="button"
            variant="ghost"
            className={`md:hidden ${navBtnClass}`}
            onClick={() => setMobileNavOpen(true)}
            aria-label="Menú de artista"
          >
            <Menu className="h-5 w-5 shrink-0" />
          </Button>

          <Link
            href="/artist/profile"
            className="flex min-h-[44px] min-w-0 shrink items-center gap-1.5 touch-manipulation sm:gap-2"
            onClick={closeAllMenus}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-orange-500">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="max-w-[7rem] truncate text-sm font-bold text-white sm:max-w-none sm:text-lg">
              Panel Artista
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className={linkClass(href)}>
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={`relative ${navBtnClass}`}
            onClick={goToNotifications}
            aria-label={`Notificaciones${unreadCount > 0 ? `, ${unreadCount} sin leer` : ""}`}
          >
            <Bell className="h-5 w-5 sm:h-4 sm:w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold leading-none text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Button>

          <div ref={menuRef} className="relative z-50">
            <Button
              variant="ghost"
              className="flex h-11 min-h-[44px] min-w-[44px] touch-manipulation items-center gap-2 px-1.5 text-white hover:bg-white/10 md:min-w-0 md:h-10 md:px-2"
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              aria-expanded={isUserMenuOpen}
              aria-haspopup="menu"
              aria-label={`Menú de cuenta${roleLabel ? `, ${roleLabel}` : ""}`}
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-orange-500 text-sm text-white">
                  {user?.name?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="hidden min-w-0 max-w-[8rem] flex-col items-start leading-tight md:flex">
                <span className="w-full truncate text-sm font-medium text-white">
                  {user?.name ?? "Cuenta"}
                </span>
                <Badge className={`mt-0.5 h-4 shrink-0 text-xs text-white ${roleBadgeClass(user?.role)}`}>
                  {roleLabel}
                </Badge>
              </div>
            </Button>

            {isUserMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 top-full z-[100] mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-md border border-slate-700 bg-slate-800 shadow-lg"
              >
                <div className="border-b border-slate-700 px-3 py-2">
                  <p className="text-xs text-slate-400">Mi Cuenta</p>
                  <p className="truncate text-sm font-medium text-white">{user?.name}</p>
                  <p className="truncate text-xs text-slate-400">{user?.email}</p>
                  <Badge className={`mt-2 h-5 text-[10px] text-white md:hidden ${roleBadgeClass(user?.role)}`}>
                    {roleLabel}
                  </Badge>
                </div>

                <div className="py-1">
                  <Link href="/artist/profile" onClick={() => setIsUserMenuOpen(false)} role="menuitem">
                    <div className="flex min-h-[44px] cursor-pointer items-center px-3 py-2 text-sm text-white hover:bg-slate-700 sm:min-h-0">
                      <User className="mr-2 h-4 w-4 shrink-0" />
                      <span>Perfil</span>
                    </div>
                  </Link>

                  <div className="mt-1 border-t border-slate-700">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className="flex min-h-[44px] w-full cursor-pointer items-center px-3 py-2 text-sm text-red-400 hover:bg-slate-700 sm:min-h-0"
                    >
                      <LogOut className="mr-2 h-4 w-4 shrink-0" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile navigation drawer */}
      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent
          side="left"
          className="flex w-[min(100vw-2rem,20rem)] flex-col border-slate-700 bg-slate-900 p-0 text-white sm:max-w-xs [&>button]:right-3 [&>button]:top-[max(1rem,env(safe-area-inset-top,0px))] [&>button]:min-h-11 [&>button]:min-w-11 [&>button]:touch-manipulation"
        >
          <SheetTitle className="sr-only">Navegación de artista</SheetTitle>
          <div className="border-b border-slate-700 px-4 pb-4 pt-[max(1.25rem,env(safe-area-inset-top,0px))] pr-14">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Panel Artista</p>
            <div className="mt-3 flex items-center gap-3">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={user?.avatar || "/placeholder.svg"} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-orange-500 text-white">
                  {user?.name?.charAt(0).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{user?.name}</p>
                <Badge className={`mt-1 h-5 text-[10px] text-white ${roleBadgeClass(user?.role)}`}>
                  {roleLabel}
                </Badge>
              </div>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 py-3">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={sheetNavClass(isActive(href))}
                onClick={closeAllMenus}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span>{label}</span>
              </Link>
            ))}
            <button
              type="button"
              className={`${sheetNavClass(isActive("/artist/notifications"))} w-full text-left`}
              onClick={goToNotifications}
            >
              <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-semibold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              <span>Notificaciones</span>
            </button>
          </nav>

          <div className="border-t border-slate-700 px-3 py-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))]">
            <button
              type="button"
              className="flex min-h-[48px] w-full touch-manipulation items-center gap-3 rounded-lg px-3 py-3 text-base text-red-400 active:bg-white/10"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5 shrink-0" />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
