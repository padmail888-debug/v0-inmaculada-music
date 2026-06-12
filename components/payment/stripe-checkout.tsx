"use client"

import type React from "react"
import { useState } from "react"
import { loadStripe } from "@stripe/stripe-js"
import { Elements, useStripe } from "@stripe/react-stripe-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Lock } from "lucide-react"
import { nativeCrossOriginFetchInit, resolveApiUrl } from "@/lib/api-base"
import { STRIPE_CONFIG } from "@/lib/stripe-config"

const stripePromise = loadStripe(STRIPE_CONFIG.publishableKey)

interface StripeCheckoutProps {
  planName: string
  price: string
  priceId: string
  userId?: string | null
  customerEmail?: string | null
  onSuccess?: () => void
}

function CheckoutForm({ planName, price, priceId, userId, customerEmail }: StripeCheckoutProps) {
  const stripe = useStripe()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe) return

    setLoading(true)
    setError(null)

    try {
      const url = resolveApiUrl("/api/create-checkout-session")
      if (!url) {
        setError("NEXT_PUBLIC_APP_URL no está configurado para esta compilación.")
        setLoading(false)
        return
      }
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          planName,
          userId: userId || undefined,
          customerEmail: customerEmail || undefined,
        }),
        ...nativeCrossOriginFetchInit,
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Error al crear la sesión de pago")
        return
      }

      if (data.url) {
        window.location.href = data.url
        return
      }

      if (data.sessionId) {
        const { error: redirectError } = await stripe.redirectToCheckout({ sessionId: data.sessionId })
        if (redirectError) setError(redirectError.message || "Error al redirigir a Stripe")
      } else {
        setError("No se recibió URL de pago")
      }
    } catch (err) {
      console.error("Payment error:", err)
      setError("Error al procesar el pago. Inténtalo de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          Ir a pagar con Stripe
        </CardTitle>
        <CardDescription className="text-slate-400">
          Suscripción a {planName} – ${price}/mes. Serás redirigido a la pasarela segura de Stripe.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-3 rounded-md">{error}</div>
          )}

          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Lock className="w-4 h-4 flex-shrink-0" />
            <span>Tus datos están protegidos con encriptación SSL (Stripe)</span>
          </div>

          <Button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700"
            disabled={loading || !stripe}
          >
            {loading ? "Redirigiendo..." : `Suscribirse por $${price}/mes`}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export function StripeCheckout(props: StripeCheckoutProps) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm {...props} />
    </Elements>
  )
}

export default StripeCheckout
