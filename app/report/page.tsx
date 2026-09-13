"use client"

import type React from "react"
import { useState } from "react"
import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bug, AlertTriangle, HelpCircle } from "lucide-react"
import { SUPPORT_EMAIL } from "@/lib/brand"
import { submitSupportMessage } from "@/lib/support-client"

export default function ReportPage() {
  const [email, setEmail] = useState("")
  const [category, setCategory] = useState("")
  const [subject, setSubject] = useState("")
  const [description, setDescription] = useState("")
  const [device, setDevice] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !subject || !description) return
    setSending(true)
    try {
      await submitSupportMessage({
        email,
        category: category || "reporte",
        subject: `[Reporte] ${subject}`,
        message: description,
        device,
      })
      setSent(true)
    } finally {
      setSending(false)
    }
  }

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
              {sent ? (
                <p className="text-slate-200">
                  Se abrió tu cliente de correo para enviar el reporte a {SUPPORT_EMAIL}. Si no se abrió, escríbenos
                  directamente a esa dirección.
                </p>
              ) : (
                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-white">
                      Email de Contacto
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="bg-black/30 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category" className="text-white">
                      Tipo de Problema
                    </Label>
                    <Select value={category} onValueChange={setCategory}>
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
                      required
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
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
                      required
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
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
                      value={device}
                      onChange={(e) => setDevice(e.target.value)}
                      placeholder="Ej: iPhone 14, Chrome 120, Windows 11"
                      className="bg-black/30 border-white/20 text-white placeholder:text-slate-400"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={sending}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {sending ? "Preparando…" : "Enviar Reporte"}
                  </Button>
                </form>
              )}

              <div className="mt-8 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h3 className="text-white font-medium mb-2">Información Adicional</h3>
                <ul className="text-slate-300 text-sm space-y-1">
                  <li>• Responderemos a tu reporte en un plazo de 24-48 horas</li>
                  <li>
                    • Para problemas urgentes, contacta:{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-300 underline">
                      {SUPPORT_EMAIL}
                    </a>
                  </li>
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
