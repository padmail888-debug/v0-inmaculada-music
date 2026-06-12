"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"

function isMobileUserAgent() {
  if (typeof navigator === "undefined") return false
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export function DashboardSuccessBanner() {
  const searchParams = useSearchParams()
  const { refreshUserFromSupabase, setUserRole } = useAuth()
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    setIsMobile(isMobileUserAgent())
  }, [])

  useEffect(() => {
    const success = searchParams.get("success")
    const plan = searchParams.get("plan")
    if (success === "true") {
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
      setUserRole(plan === "artist-pro" ? "artist-pro" : "premium")
      // Short delay so webhook has time to update Supabase, then sync
      const t = setTimeout(() => void refreshUserFromSupabase(), 800)
      return () => clearTimeout(t)
    }
  }, [searchParams, setUserRole, refreshUserFromSupabase])

  if (!showSuccessMessage) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm w-full pr-4">
      <Card className="bg-green-800/90 border-green-600 backdrop-blur-sm">
        <CardContent className="p-4 flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium">¡Suscripción exitosa!</p>
              <p className="text-green-200 text-sm">
                {searchParams.get("plan") === "artist-pro"
                  ? "Tu plan Artist Pro ya está activo."
                  : isMobile
                    ? "Tu plan Premium ya está activo. Si realizaste el pago desde el navegador del móvil, puedes volver a la app."
                    : "Tu plan Premium ya está activo."}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSuccessMessage(false)}
              className="text-green-200 hover:text-white hover:bg-green-700/50 flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          {isMobile && (
            <div className="flex justify-end">
              <a
                href="inmaculada://dashboard"
                className="text-xs font-medium text-green-100 underline-offset-2 hover:underline"
              >
                Abrir en la app
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
