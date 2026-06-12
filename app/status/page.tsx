import Link from "next/link"
import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Music, CheckCircle, AlertCircle, XCircle } from "lucide-react"

export default function StatusPage() {
  const services = [
    { name: "Streaming de Audio", status: "operational", uptime: "99.9%" },
    { name: "API de Usuario", status: "operational", uptime: "99.8%" },
    { name: "Descargas Offline", status: "degraded", uptime: "98.5%" },
    { name: "Pagos y Suscripciones", status: "operational", uptime: "99.9%" },
    { name: "Subida de Contenido", status: "operational", uptime: "99.7%" },
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "degraded":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      case "outage":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Operativo</Badge>
      case "degraded":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Degradado</Badge>
      case "outage":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Fuera de Servicio</Badge>
      default:
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Operativo</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
<main className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Estado del Servicio</h1>
          <p className="text-slate-300">Monitoreo en tiempo real de todos nuestros servicios</p>
        </div>

        {/* Overall Status */}
        <Card className="bg-black/40 border-white/20 backdrop-blur-sm mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Todos los Sistemas Operativos
              </CardTitle>
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Estado: Normal</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Services Status */}
        <Card className="bg-black/40 border-white/20 backdrop-blur-sm mb-8">
          <CardHeader>
            <CardTitle className="text-white">Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(service.status)}
                    <span className="text-white font-medium">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-300 text-sm">Uptime: {service.uptime}</span>
                    {getStatusBadge(service.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Incidentes Recientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium">Mantenimiento Programado</h3>
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Resuelto</Badge>
                </div>
                <p className="text-slate-300 text-sm mb-2">
                  Mantenimiento de rutina en los servidores de streaming. Algunos usuarios experimentaron interrupciones
                  menores.
                </p>
                <p className="text-slate-400 text-xs">15 de Enero, 2024 - 02:00 AM UTC</p>
              </div>

              <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-white font-medium">Lentitud en Descargas</h3>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Resuelto</Badge>
                </div>
                <p className="text-slate-300 text-sm mb-2">
                  Algunos usuarios reportaron velocidades de descarga más lentas de lo normal.
                </p>
                <p className="text-slate-400 text-xs">12 de Enero, 2024 - 14:30 PM UTC</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
      </div>
    </div>
  )
}
