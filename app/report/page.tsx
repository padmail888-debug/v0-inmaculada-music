import Link from "next/link"
import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowLeft, Music, Bug, AlertTriangle, HelpCircle } from "lucide-react"

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
<main className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">Reportar un Problema</h1>
          <p className="text-slate-300">Ayúdanos a mejorar reportando cualquier problema que encuentres</p>
        </div>

        <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Formulario de Reporte</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">
                  Email de Contacto
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  className="bg-black/30 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category" className="text-white">
                  Tipo de Problema
                </Label>
                <Select>
                  <SelectTrigger className="bg-black/30 border-white/20 text-white">
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="bug" className="text-white">
                      <div className="flex items-center gap-2">
                        <Bug className="h-4 w-4" />
                        Error o Bug
                      </div>
                    </SelectItem>
                    <SelectItem value="performance" className="text-white">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Problema de Rendimiento
                      </div>
                    </SelectItem>
                    <SelectItem value="feature" className="text-white">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4" />
                        Solicitud de Función
                      </div>
                    </SelectItem>
                    <SelectItem value="other" className="text-white">
                      Otro
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="subject" className="text-white">
                  Asunto
                </Label>
                <Input
                  id="subject"
                  placeholder="Breve descripción del problema"
                  className="bg-black/30 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-white">
                  Descripción Detallada
                </Label>
                <Textarea
                  id="description"
                  placeholder="Describe el problema con el mayor detalle posible. Incluye pasos para reproducirlo si es aplicable."
                  rows={6}
                  className="bg-black/30 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="device" className="text-white">
                  Información del Dispositivo
                </Label>
                <Input
                  id="device"
                  placeholder="Ej: iPhone 14, Chrome 120, Windows 11"
                  className="bg-black/30 border-white/20 text-white placeholder:text-slate-400"
                />
              </div>

              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Enviar Reporte</Button>
            </form>

            <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <h3 className="text-white font-medium mb-2">Información Adicional</h3>
              <ul className="text-slate-300 text-sm space-y-1">
                <li>• Responderemos a tu reporte en un plazo de 24-48 horas</li>
                <li>• Para problemas urgentes, contacta: soporte@musicstream.com</li>
                <li>• Incluye capturas de pantalla si es posible</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </main>
      </div>
    </div>
  )
}
