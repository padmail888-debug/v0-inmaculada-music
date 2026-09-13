"use client"

import { useEffect, useState } from "react"
import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, XCircle } from "lucide-react"
import { resolveApiUrl } from "@/lib/api-base"

type ServiceStatus = "operational" | "outage" | "checking"

export default function StatusPage() {
  const [apiStatus, setApiStatus] = useState<ServiceStatus>("checking")

  useEffect(() => {
    const url = resolveApiUrl("/api/health") || "/api/health"
    fetch(url, { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setApiStatus(data?.ok ? "operational" : "outage"))
      .catch(() => setApiStatus("outage"))
  }, [])

  const services: { name: string; status: ServiceStatus }[] = [
    { name: "Sitio web", status: "operational" },
    { name: "API", status: apiStatus },
    { name: "Autenticación", status: apiStatus === "outage" ? "outage" : "operational" },
    { name: "Pagos (Stripe)", status: "operational" },
  ]

  const overallDown = services.some((s) => s.status === "outage")
  const overallChecking = services.some((s) => s.status === "checking")

  const getStatusIcon = (status: ServiceStatus) => {
    if (status === "operational") return <CheckCircle className="h-4 w-4 text-green-500" />
    if (status === "outage") return <XCircle className="h-4 w-4 text-red-500" />
    return <AlertCircle className="h-4 w-4 text-yellow-500" />
  }

  const getStatusBadge = (status: ServiceStatus) => {
    if (status === "operational") {
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Operativo</Badge>
    }
    if (status === "outage") {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Incidencia</Badge>
    }
    return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Comprobando</Badge>
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-4">Estado del Servicio</h1>
            <p className="text-slate-300">Comprobación actual de los sistemas de Inmaculada Music</p>
          </div>

          <Card className="bg-black/40 border-white/20 backdrop-blur-sm mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white flex items-center gap-2">
                  {overallDown ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  {overallChecking
                    ? "Comprobando sistemas…"
                    : overallDown
                      ? "Hay una incidencia"
                      : "Todos los sistemas operativos"}
                </CardTitle>
                {getStatusBadge(overallChecking ? "checking" : overallDown ? "outage" : "operational")}
              </div>
            </CardHeader>
          </Card>

          <Card className="bg-black/40 border-white/20 backdrop-blur-sm mb-8">
            <CardHeader>
              <CardTitle className="text-white">Servicios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {services.map((service) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      {getStatusIcon(service.status)}
                      <span className="text-white font-medium">{service.name}</span>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-white">Incidentes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300 text-sm">No hay incidentes abiertos en este momento.</p>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
