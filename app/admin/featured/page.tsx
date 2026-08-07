"use client"

import Link from "next/link"
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Star } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { Button } from "@/components/ui/button"
import { FeaturedContentManager } from "@/components/featured-content/featured-content-manager"

export default function AdminFeaturedListPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace("/login?redirect=/admin/featured")
      return
    }
    if (user.role !== "superadmin") {
      router.replace("/dashboard")
    }
  }, [authLoading, user, router])

  if (authLoading || !user || user.role !== "superadmin") {
    return (
      <AppShell>
        <div className="py-16 text-center text-slate-300">Cargando…</div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="mx-auto min-w-0 max-w-5xl pb-28">
        <div className="mb-6 sm:mb-8">
          <div className="mb-1 flex items-center gap-2 text-yellow-400">
            <Star className="h-5 w-5" />
            <span className="text-sm font-medium">Super Admin</span>
          </div>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Contenido Destacado</h1>
          <p className="mt-1 text-sm text-slate-300 sm:text-base">
            Gestiona anuncios y promociones. Los artistas los verán en su perfil.
          </p>
        </div>

        <FeaturedContentManager />

        <div className="mt-6">
          <Button asChild variant="ghost" className="min-h-[44px] text-slate-300">
            <Link href="/admin?tab=featured">Volver al panel admin</Link>
          </Button>
        </div>
      </div>
    </AppShell>
  )
}
