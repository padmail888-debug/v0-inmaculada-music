"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/hooks/use-auth"
import { useAdminSettings } from "@/hooks/use-admin-settings"
import { getPostLoginPath, hasPaidAccess } from "@/lib/user-role"

/** Landing-page Free / Premium CTAs wired to register + Stripe subscription. */
export function HomePricingCards() {
  const { user, isLoading } = useAuth()
  const { settings, loading: settingsLoading } = useAdminSettings()

  const premiumPrice = settings.premiumPrice.toFixed(2)
  const isLoggedIn = !!user
  const alreadyPremium = hasPaidAccess(user?.role)

  const freeHref = isLoggedIn ? getPostLoginPath(user.role) : "/register"
  const freeLabel = isLoggedIn ? "Ir a mi cuenta" : "Empezar Gratis"

  let premiumHref = "/register?plan=premium"
  let premiumLabel = "Suscribirse"
  if (isLoggedIn) {
    if (alreadyPremium) {
      premiumHref = getPostLoginPath(user.role)
      premiumLabel = "Plan activo"
    } else {
      premiumHref = "/subscription"
      premiumLabel = "Suscribirse"
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
      <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Gratuito</CardTitle>
          <CardDescription className="text-slate-100">Perfecto para empezar</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-white mb-4">$0</div>
          <ul className="text-slate-100 space-y-2 mb-6 text-left sm:text-center">
            <li>• Previews de 30 segundos</li>
            <li>• Compra canciones individuales</li>
            <li>• Playlists básicas</li>
            <li>• Con anuncios</li>
          </ul>
          <Button
            asChild
            variant="outline"
            className="w-full min-h-[44px] border-white/20 text-white hover:bg-white/10 bg-transparent"
            disabled={isLoading}
          >
            <Link href={freeHref}>{freeLabel}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 border-purple-400/50 backdrop-blur-sm">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-white">Premium</CardTitle>
          <CardDescription className="text-slate-100">Experiencia completa</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <div className="text-4xl font-bold text-white mb-4">
            {settingsLoading ? (
              <span className="text-2xl text-slate-300">…</span>
            ) : (
              <>
                ${premiumPrice}
                <span className="text-lg">/mes</span>
              </>
            )}
          </div>
          <ul className="text-slate-100 space-y-2 mb-6 text-left sm:text-center">
            <li>• Acceso completo al catálogo</li>
            <li>• Descargas offline ilimitadas</li>
            <li>• Sin anuncios</li>
            <li>• Calidad de audio superior</li>
          </ul>
          <Button
            asChild
            className="w-full min-h-[44px] bg-purple-600 hover:bg-purple-700 text-white"
            disabled={isLoading}
          >
            <Link href={premiumHref}>{premiumLabel}</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
