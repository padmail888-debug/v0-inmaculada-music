"use client"
export const dynamic = 'force-dynamic'


import { useState, useEffect, Suspense } from "react"
import dynamicImport from "next/dynamic"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Music, Crown, CheckCircle } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { AppShell } from "@/components/layout/app-shell"
import { STRIPE_CONFIG } from "@/lib/stripe-config"

const StripeCheckout = dynamicImport(() => import("@/components/payment/stripe-checkout"), { ssr: false })

function SubscriptionContent() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const [showCheckout, setShowCheckout] = useState<string | null>(null)
  const [showStripeSuccess, setShowStripeSuccess] = useState(false)

  useEffect(() => {
    if (typeof window === "undefined") return
    if (searchParams.get("success") === "true") {
      setShowStripeSuccess(true)
      const url = new URL(window.location.href)
      url.searchParams.delete("success")
      url.searchParams.delete("session_id")
      window.history.replaceState({}, "", url.pathname)
    }
  }, [searchParams])

  const plans = [
    {
      name: "Gratuito",
      price: "0",
      period: "siempre",
      description: "Perfecto para empezar",
      features: ["Previews de 30 segundos", "Compra canciones individuales", "Playlists básicas", "Calidad estándar"],
      limitations: ["Anuncios entre canciones", "Sin modo offline", "Saltos limitados"],
      buttonText: user?.subscription === "free" ? "Plan Actual" : "Cambiar a Gratuito",
      buttonVariant: "outline" as const,
      icon: Music,
      current: user?.subscription === "free",
      priceId: null,
    },
    {
      name: "Premium",
      price: "9.99",
      period: "mes",
      description: "La experiencia completa",
      features: [
        "Acceso ilimitado al catálogo",
        "Sin anuncios",
        "Modo offline",
        "Calidad alta (320kbps)",
        "Saltos ilimitados",
        "Playlists colaborativas",
      ],
      buttonText: user?.subscription === "premium" ? "Plan Actual" : "Suscribirse",
      buttonVariant: "default" as const,
      icon: Crown,
      popular: true,
      current: user?.subscription === "premium",
      priceId: STRIPE_CONFIG.prices.premium_monthly, // Added Stripe price ID
    },
    {
      name: "Artist Pro",
      price: "19.99",
      period: "mes",
      description: "Para creadores de contenido",
      features: [
        "Todo lo de Premium",
        "Subir música ilimitada",
        "Análisis detallados de reproducciones",
        "Promoción en sección destacados",
        "Soporte prioritario",
        "Monetización de contenido",
        "Herramientas de marketing",
      ],
      buttonText: user?.subscription === "artist-pro" ? "Plan Actual" : "Suscribirse",
      buttonVariant: "default" as const,
      icon: Crown,
      current: user?.subscription === "artist-pro",
      priceId: STRIPE_CONFIG.prices.artist_pro_monthly,
    },
  ]

  const handleSubscribe = (plan: (typeof plans)[0]) => {
    if (plan.priceId) {
      if (!user?.id) {
        window.location.href = "/login?redirect=/subscription"
        return
      }
      setShowCheckout(plan.name)
    }
  }

  const handlePaymentSuccess = () => {
    setShowCheckout(null)
    // Redirect to dashboard or show success message
    window.location.href = "/dashboard?success=true"
  }

  if (showCheckout) {
    const selectedPlan = plans.find((p) => p.name === showCheckout)
    if (selectedPlan) {
      return (
        <AppShell>
          <div className="max-w-2xl mx-auto min-w-0">
            <div className="mb-6">
              <Button
                variant="outline"
                onClick={() => setShowCheckout(null)}
                className="text-white border-slate-600 hover:bg-slate-700"
              >
                ← Volver a planes
              </Button>
            </div>
            <StripeCheckout
              planName={selectedPlan.name}
              price={selectedPlan.price}
              priceId={selectedPlan.priceId!}
              userId={user?.id}
              customerEmail={user?.email}
              onSuccess={handlePaymentSuccess}
            />
          </div>
        </AppShell>
      )
    }
  }

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto min-w-0">
        {showStripeSuccess && (
          <Card className="mb-8 border-green-500/50 bg-green-900/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-7 h-7 text-green-400" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h2 className="text-xl font-semibold text-white">¡Pago completado!</h2>
                  <p className="text-slate-300">
                    Tu suscripción está activa. Cierra sesión y vuelve a entrar para que se actualice tu plan, o ve al inicio.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-end">
                  <Link href="/dashboard">
                    <Button className="bg-green-600 hover:bg-green-700 text-white">Ir al Dashboard</Button>
                  </Link>
                  <Link href="/">
                    <Button variant="outline" className="border-slate-500 text-white hover:bg-slate-700">Ir al Inicio</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-4">Elige tu plan musical</h1>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto px-2">
            Desde previews gratuitas hasta acceso completo sin límites. Encuentra el plan perfecto para tu experiencia
            musical.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon
            return (
              <Card
                key={plan.name}
                className={`relative bg-slate-800/50 border-slate-700 backdrop-blur-sm ${
                  plan.popular ? "ring-2 ring-purple-500" : ""
                } ${plan.current ? "ring-2 ring-green-500" : ""}`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white">
                    Más Popular
                  </Badge>
                )}
                {plan.current && <Badge className="absolute -top-3 right-4 bg-green-600 text-white">Actual</Badge>}

                <CardHeader className="text-center pb-4">
                  <div className="flex justify-center mb-4">
                    <div className="p-3 bg-purple-600/20 rounded-full">
                      <Icon className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                  <div className="flex items-baseline justify-center gap-1 mt-4">
                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                    <span className="text-slate-400">/{plan.period}</span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      Incluye:
                    </h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-slate-300">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {plan.limitations && (
                    <div>
                      <h4 className="font-semibold text-slate-400 mb-2">Limitaciones:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, index) => (
                          <li key={index} className="text-slate-500 text-sm">
                            • {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>

                <CardFooter>
                  <Button
                    className="w-full"
                    variant={plan.buttonVariant}
                    disabled={plan.current}
                    onClick={() => handleSubscribe(plan)} // Added click handler
                  >
                    {plan.buttonText}
                  </Button>
                </CardFooter>
              </Card>
            )
          })}
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-white mb-8">Preguntas Frecuentes</h2>
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <Card className="bg-slate-800/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">¿Puedo cancelar en cualquier momento?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Sí, puedes cancelar tu suscripción Premium en cualquier momento. Seguirás teniendo acceso hasta el
                  final de tu período de facturación.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/30 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">¿Qué pasa con mis descargas offline?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                  Las canciones descargadas permanecen disponibles mientras mantengas tu suscripción Premium activa.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

function SubscriptionFallback() {
  return (
    <AppShell>
      <div className="flex items-center justify-center min-h-[50vh]">
      <p className="text-slate-400">Cargando...</p>
      </div>
    </AppShell>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<SubscriptionFallback />}>
      <SubscriptionContent />
    </Suspense>
  )
}
