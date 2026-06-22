"use client"
export const dynamic = 'force-dynamic'

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  HelpCircle,
  Book,
  Users,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { AppShell } from "@/components/layout/app-shell"

export default function HelpPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState("faq")
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  useEffect(() => {
    const hash = window.location.hash.replace("#", "")
    if (hash === "contact") {
      setActiveTab("contact")
    } else if (hash === "guides") {
      setActiveTab("guides")
    } else if (hash === "faq") {
      setActiveTab("faq")
    }
  }, [])

  const faqs = [
    {
      id: 1,
      question: "¿Cómo puedo cambiar mi plan de suscripción?",
      answer:
        "Puedes cambiar tu plan desde tu perfil > Suscripción. Los cambios se aplicarán inmediatamente y se prorrateará el costo.",
    },
    {
      id: 2,
      question: "¿Puedo descargar música para escuchar offline?",
      answer:
        "Sí, los usuarios Premium pueden descargar hasta 10,000 canciones para escuchar sin conexión. Ve a cualquier canción y toca el ícono de descarga.",
    },
    {
      id: 3,
      question: "¿Cómo subo mi música como artista?",
      answer:
        "Los artistas pueden subir música desde su perfil de artista > Subir música. Asegúrate de que tus archivos cumplan con nuestros requisitos técnicos (320 kbps CBR MP3, 48 kHz).",
    },
    {
      id: 4,
      question: "¿Cuál es la diferencia entre Artista y Artista Pro?",
      answer:
        "Los Artistas Pro reciben mayor porcentaje de regalías, pueden usar hasta 5 enlaces sociales, aparecen en destacados y tienen acceso a analíticas avanzadas.",
    },
    {
      id: 5,
      question: "¿Cómo cancelo mi suscripción?",
      answer:
        "Puedes cancelar tu suscripción desde Perfil > Suscripción > Cancelar. Tu acceso Premium continuará hasta el final del período facturado.",
    },
    {
      id: 6,
      question: "¿Puedo compartir mi cuenta con otros?",
      answer:
        "Las cuentas son para uso individual. Si necesitas múltiples usuarios, considera nuestros planes familiares (próximamente).",
    },
    {
      id: 7,
      question: "¿Qué calidad de audio ofrecen?",
      answer:
        "Ofrecemos hasta 320 kbps para usuarios Premium y 128 kbps para usuarios gratuitos. Los artistas pueden subir en calidad de hasta 320 kbps CBR.",
    },
    {
      id: 8,
      question: "¿Cómo reporto contenido inapropiado?",
      answer:
        "Usa el menú de tres puntos en cualquier canción y selecciona 'Reportar'. Nuestro equipo revisará el contenido en 24-48 horas.",
    },
  ]

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí iría la lógica para enviar el formulario
    alert("Mensaje enviado. Te responderemos en 24-48 horas.")
    setContactForm({ name: "", email: "", subject: "", message: "" })
  }

  return (
    <AppShell>
      <div className="container mx-auto max-w-full min-w-0 px-4 py-4 sm:px-6 sm:py-8">
        <div className="mb-4 sm:mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-4">¿En qué podemos ayudarte?</h1>
          <p className="text-slate-300 text-sm sm:text-lg">
            Encuentra respuestas rápidas a las preguntas más frecuentes o contáctanos directamente.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0">
          <TabsList className="flex w-full overflow-x-auto bg-slate-800 border-slate-700 p-1 gap-1 rounded-lg [&>button]:flex-shrink-0 [&>button]:min-h-[44px] sm:grid sm:grid-cols-3 sm:overflow-visible sm:[&>button]:min-h-0">
            <TabsTrigger value="faq" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm px-3 sm:px-4">
              <Book className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Preguntas Frecuentes</span>
              <span className="sm:hidden">FAQ</span>
            </TabsTrigger>
            <TabsTrigger value="contact" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm px-3 sm:px-4">
              <MessageCircle className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              Contacto
            </TabsTrigger>
            <TabsTrigger value="guides" className="data-[state=active]:bg-purple-600 text-xs sm:text-sm px-3 sm:px-4">
              <Users className="h-4 w-4 mr-1.5 sm:mr-2 shrink-0" />
              Guías
            </TabsTrigger>
          </TabsList>

          <TabsContent value="faq" className="mt-4 sm:mt-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-white text-lg sm:text-xl">Preguntas Frecuentes</CardTitle>
                <CardDescription className="text-slate-300 text-sm">
                  Las respuestas a las preguntas más comunes de nuestros usuarios.
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                <div className="space-y-3 sm:space-y-4">
                  {faqs.map((faq) => (
                    <div key={faq.id} className="border border-slate-700 rounded-lg overflow-hidden">
                      <button
                        type="button"
                        className="w-full p-3 sm:p-4 text-left flex items-center justify-between gap-3 hover:bg-slate-700/50 active:bg-slate-700/50 transition-colors min-h-[48px] sm:min-h-0 touch-manipulation"
                        onClick={() => setExpandedFaq(expandedFaq === faq.id ? null : faq.id)}
                      >
                        <span className="text-white font-medium text-sm sm:text-base flex-1 text-left">
                          {faq.question}
                        </span>
                        {expandedFaq === faq.id ? (
                          <ChevronDown className="h-5 w-5 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                        )}
                      </button>
                      {expandedFaq === faq.id && (
                        <div className="px-3 pb-3 pt-0 sm:p-4 sm:pt-0 border-t border-slate-700">
                          <p className="text-slate-300 text-sm sm:text-base">{faq.answer}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact" className="mt-4 sm:mt-6">
            <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
              {/* Contact Form */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="text-white text-lg sm:text-xl">Envíanos un mensaje</CardTitle>
                  <CardDescription className="text-slate-300 text-sm">
                    Completa el formulario y te responderemos en 24-48 horas.
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                  <form onSubmit={handleContactSubmit} className="space-y-3 sm:space-y-4">
                    <div>
                      <Input
                        placeholder="Tu nombre"
                        value={contactForm.name}
                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white min-h-[44px] sm:min-h-[40px] text-base"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        type="email"
                        placeholder="Tu email"
                        value={contactForm.email}
                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white min-h-[44px] sm:min-h-[40px] text-base"
                        required
                      />
                    </div>
                    <div>
                      <Input
                        placeholder="Asunto"
                        value={contactForm.subject}
                        onChange={(e) => setContactForm({ ...contactForm, subject: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white min-h-[44px] sm:min-h-[40px] text-base"
                        required
                      />
                    </div>
                    <div>
                      <Textarea
                        placeholder="Describe tu consulta o problema..."
                        value={contactForm.message}
                        onChange={(e) => setContactForm({ ...contactForm, message: e.target.value })}
                        className="bg-slate-700 border-slate-600 text-white min-h-[120px] text-base resize-y"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-purple-600 hover:bg-purple-700 min-h-[44px] sm:min-h-[40px] text-base"
                    >
                      Enviar Mensaje
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-4 sm:space-y-6">
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-white text-lg sm:text-xl">Información de Contacto</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                    <div className="flex items-center gap-3 min-h-[44px] sm:min-h-0">
                      <Mail className="h-5 w-5 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm sm:text-base">Email</p>
                        <p className="text-slate-300 text-sm sm:text-base truncate">soporte@musicstream.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 min-h-[44px] sm:min-h-0">
                      <Phone className="h-5 w-5 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm sm:text-base">Teléfono</p>
                        <p className="text-slate-300 text-sm sm:text-base">+34 900 123 456</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 min-h-[44px] sm:min-h-0">
                      <Clock className="h-5 w-5 text-purple-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white font-medium text-sm sm:text-base">Horario de Atención</p>
                        <p className="text-slate-300 text-sm sm:text-base">Lun - Vie: 9:00 - 18:00 CET</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader className="p-4 sm:p-6">
                    <CardTitle className="text-white text-lg sm:text-xl">Tiempo de Respuesta</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6 pt-0">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center gap-2 min-h-[44px] sm:min-h-0 py-1">
                        <span className="text-slate-300 text-sm sm:text-base">Consultas generales</span>
                        <Badge className="bg-green-600 shrink-0">24-48h</Badge>
                      </div>
                      <div className="flex justify-between items-center gap-2 min-h-[44px] sm:min-h-0 py-1">
                        <span className="text-slate-300 text-sm sm:text-base">Problemas técnicos</span>
                        <Badge className="bg-yellow-600 shrink-0">12-24h</Badge>
                      </div>
                      <div className="flex justify-between items-center gap-2 min-h-[44px] sm:min-h-0 py-1">
                        <span className="text-slate-300 text-sm sm:text-base">Problemas de pago</span>
                        <Badge className="bg-red-600 shrink-0">2-6h</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="guides" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 active:border-purple-500 transition-colors cursor-pointer touch-manipulation min-h-[44px]">
                <CardHeader className="p-4 sm:p-6">
                  <Settings className="h-7 w-7 sm:h-8 sm:w-8 text-purple-400 mb-2 shrink-0" />
                  <CardTitle className="text-white text-base sm:text-lg">Primeros Pasos</CardTitle>
                  <CardDescription className="text-slate-300 text-sm">
                    Aprende a configurar tu cuenta y empezar a usar MusicStream.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 active:border-purple-500 transition-colors cursor-pointer touch-manipulation min-h-[44px]">
                <CardHeader className="p-4 sm:p-6">
                  <Users className="h-7 w-7 sm:h-8 sm:w-8 text-purple-400 mb-2 shrink-0" />
                  <CardTitle className="text-white text-base sm:text-lg">Para Artistas</CardTitle>
                  <CardDescription className="text-slate-300 text-sm">
                    Guía completa para artistas: subir música, gestionar perfil y más.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="bg-slate-800 border-slate-700 hover:border-purple-500 active:border-purple-500 transition-colors cursor-pointer touch-manipulation min-h-[44px]">
                <CardHeader className="p-4 sm:p-6">
                  <HelpCircle className="h-7 w-7 sm:h-8 sm:w-8 text-purple-400 mb-2 shrink-0" />
                  <CardTitle className="text-white text-base sm:text-lg">Solución de Problemas</CardTitle>
                  <CardDescription className="text-slate-300 text-sm">
                    Resuelve los problemas más comunes de reproducción y descarga.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}
