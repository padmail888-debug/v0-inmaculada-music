"use client"

import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { useAdminSettings } from "@/hooks/use-admin-settings"

/** Shown site-wide when Super Admin enables maintenance mode. */
export function MaintenanceBanner() {
  const { user } = useAuth()
  const { isMaintenanceMode } = useAdminSettings()

  if (!isMaintenanceMode) return null
  if (user?.role === "superadmin") {
    return (
      <div className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-100">
        Modo mantenimiento activo — solo visible para Super Admin. Los demás usuarios ven un aviso
        de servicio.
      </div>
    )
  }

  return (
    <div className="border-b border-amber-500/50 bg-amber-600/90 px-4 py-3 text-center text-sm text-white">
      <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-1 sm:flex-row sm:gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p>
          Estamos en mantenimiento. Algunas funciones pueden no estar disponibles.{" "}
          <Link href="/" className="underline underline-offset-2">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  )
}
