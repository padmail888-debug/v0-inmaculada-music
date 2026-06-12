"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { CreditCard, Shield, Check, ArrowLeft, Crown } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"

export default function PaymentPage() {
  const { user } = useAuth()
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("monthly")
  const [paymentMethod, setPaymentMethod] = useState<"card" | "paypal">("card")
  const [loading, setLoading] = useState(false)

  const plans = {
    monthly: {
      price: 9.99,
      period: "mes",
      savings: null,
    },
    yearly: {
      price: 99.99,
      period: "año",
      savings: "Ahorra $19.89",
    },
  }

  const handlePayment = async () => {
    setLoading(true)
    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setLoading(false)
    // Redirect to success page or update user status
  }

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto min-w-0">
        <div className="mb-8">
          <Link href="/subscription">
            <Button variant="ghost" className="text-slate-400 hover:text-white mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a planes
            </Button>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2">Finalizar suscripción</h1>
          <p className="text-slate-400">Completa tu pago para acceder a todas las funciones Premium</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Plan Summary */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Crown className="w-5 h-5 mr-2 text-yellow-500" />
                Resumen del plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Plan Selection */}
              <div className="space-y-3">
                <Label className="text-slate-300">Selecciona tu plan</Label>
                <div className="space-y-2">
                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedPlan === "monthly"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                    onClick={() => setSelectedPlan("monthly")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Plan Mensual</p>
                        <p className="text-slate-400 text-sm">Facturación mensual</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">${plans.monthly.price}</p>
                        <p className="text-slate-400 text-sm">por mes</p>
                      </div>
                    </div>
                  </div>

                  <div
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedPlan === "yearly"
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-slate-600 hover:border-slate-500"
                    }`}
                    onClick={() => setSelectedPlan("yearly")}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-white font-medium">Plan Anual</p>
                          <Badge className="bg-green-600 text-xs">Mejor valor</Badge>
                        </div>
                        <p className="text-slate-400 text-sm">Facturación anual</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">${plans.yearly.price}</p>
                        <p className="text-slate-400 text-sm">por año</p>
                        <p className="text-green-400 text-xs">{plans.yearly.savings}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {/* Features */}
              <div>
                <h3 className="text-white font-medium mb-3">Incluye:</h3>
                <div className="space-y-2">
                  {[
                    "Música sin anuncios",
                    "Descarga para escuchar offline",
                    "Calidad de audio superior",
                    "Playlists ilimitadas",
                    "Saltar canciones ilimitado",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-green-400" />
                      <span className="text-slate-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Separator className="bg-slate-700" />

              {/* Total */}
              <div className="bg-slate-700/50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-slate-300">Total a pagar:</span>
                  <span className="text-white font-bold text-xl">
                    ${plans[selectedPlan].price} / {plans[selectedPlan].period}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Información de pago
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Payment Method */}
              <div className="space-y-3">
                <Label className="text-slate-300">Método de pago</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === "card" ? "default" : "outline"}
                    className={paymentMethod === "card" ? "bg-purple-600" : "border-slate-600 text-slate-300"}
                    onClick={() => setPaymentMethod("card")}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Tarjeta
                  </Button>
                  <Button
                    variant={paymentMethod === "paypal" ? "default" : "outline"}
                    className={paymentMethod === "paypal" ? "bg-purple-600" : "border-slate-600 text-slate-300"}
                    onClick={() => setPaymentMethod("paypal")}
                  >
                    PayPal
                  </Button>
                </div>
              </div>

              {paymentMethod === "card" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber" className="text-slate-300">
                      Número de tarjeta
                    </Label>
                    <Input
                      id="cardNumber"
                      placeholder="1234 5678 9012 3456"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiry" className="text-slate-300">
                        Vencimiento
                      </Label>
                      <Input id="expiry" placeholder="MM/AA" className="bg-slate-700/50 border-slate-600 text-white" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvv" className="text-slate-300">
                        CVV
                      </Label>
                      <Input id="cvv" placeholder="123" className="bg-slate-700/50 border-slate-600 text-white" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cardName" className="text-slate-300">
                      Nombre en la tarjeta
                    </Label>
                    <Input
                      id="cardName"
                      placeholder="Juan Pérez"
                      className="bg-slate-700/50 border-slate-600 text-white"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "paypal" && (
                <div className="text-center py-8">
                  <div className="bg-slate-700/50 p-6 rounded-lg">
                    <p className="text-slate-300 mb-4">Serás redirigido a PayPal para completar el pago</p>
                    <Button className="bg-blue-600 hover:bg-blue-700">Continuar con PayPal</Button>
                  </div>
                </div>
              )}

              {/* Security Notice */}
              <div className="flex items-start gap-3 p-4 bg-slate-700/30 rounded-lg">
                <Shield className="w-5 h-5 text-green-400 mt-0.5" />
                <div>
                  <p className="text-slate-300 text-sm font-medium">Pago seguro</p>
                  <p className="text-slate-400 text-xs">
                    Tu información está protegida con encriptación SSL de 256 bits
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-purple-600 hover:bg-purple-700 h-12 text-lg"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Procesando...
                  </div>
                ) : (
                  `Pagar $${plans[selectedPlan].price}`
                )}
              </Button>

              <p className="text-slate-500 text-xs text-center">
                Al continuar, aceptas nuestros términos de servicio y política de privacidad. Puedes cancelar en
                cualquier momento.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}
