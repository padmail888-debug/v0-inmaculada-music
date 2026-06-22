export const dynamic = 'force-dynamic'

import Link from "next/link"
import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Music } from "lucide-react"

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
<main className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-white text-center">Política de Cookies</CardTitle>
            <p className="text-slate-300 text-center">Información sobre el uso de cookies en MusicStream</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="space-y-6 text-slate-200">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">¿Qué son las Cookies?</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Las cookies son pequeños archivos de texto
                  que se almacenan en tu dispositivo cuando visitas nuestro sitio web.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Tipos de Cookies que Utilizamos</h2>

                <div className="space-y-4">
                  <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                    <h4 className="text-white font-medium mb-2">Cookies Esenciales</h4>
                    <p className="text-sm">
                      Necesarias para el funcionamiento básico del sitio web. No se pueden desactivar.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      <li>Autenticación de usuario</li>
                      <li>Preferencias de idioma</li>
                      <li>Carrito de compras</li>
                    </ul>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                    <h4 className="text-white font-medium mb-2">Cookies de Rendimiento</h4>
                    <p className="text-sm">
                      Nos ayudan a entender cómo los visitantes interactúan con nuestro sitio web.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      <li>Google Analytics</li>
                      <li>Métricas de velocidad de carga</li>
                      <li>Análisis de errores</li>
                    </ul>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                    <h4 className="text-white font-medium mb-2">Cookies de Funcionalidad</h4>
                    <p className="text-sm">
                      Permiten que el sitio web recuerde las elecciones que haces para mejorar tu experiencia.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      <li>Preferencias de reproducción</li>
                      <li>Configuración de calidad de audio</li>
                      <li>Historial de búsqueda</li>
                    </ul>
                  </div>

                  <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                    <h4 className="text-white font-medium mb-2">Cookies de Marketing</h4>
                    <p className="text-sm">
                      Se utilizan para rastrear a los visitantes en los sitios web para mostrar anuncios relevantes.
                    </p>
                    <ul className="list-disc list-inside mt-2 text-sm space-y-1">
                      <li>Publicidad personalizada</li>
                      <li>Seguimiento de conversiones</li>
                      <li>Remarketing</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Gestión de Cookies</h2>
                <p>
                  Puedes controlar y/o eliminar las cookies como desees. Puedes eliminar todas las cookies que ya están
                  en tu ordenador y puedes configurar la mayoría de navegadores para evitar que se coloquen.
                </p>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mt-4">
                  <h4 className="text-white font-medium mb-2">Configuración del Navegador</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Chrome: Configuración → Privacidad y seguridad → Cookies</li>
                    <li>• Firefox: Opciones → Privacidad y seguridad → Cookies</li>
                    <li>• Safari: Preferencias → Privacidad → Cookies</li>
                    <li>• Edge: Configuración → Cookies y permisos del sitio</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Cookies de Terceros</h2>
                <p>Algunos de nuestros socios pueden colocar cookies en tu dispositivo cuando visitas nuestro sitio:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Google Analytics (análisis web)</li>
                  <li>Stripe (procesamiento de pagos)</li>
                  <li>Vercel (hosting y análisis)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Contacto</h2>
                <p>Si tienes preguntas sobre nuestra política de cookies:</p>
                <ul className="list-none mt-2 space-y-1">
                  <li>Email: privacy@musicstream.com</li>
                  <li>Teléfono: +34 900 123 456</li>
                </ul>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
      </div>
    </div>
  )
}
