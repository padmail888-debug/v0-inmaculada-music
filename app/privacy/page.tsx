import Link from "next/link"
import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Music } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
<main className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-white text-center">Política de Privacidad</CardTitle>
            <p className="text-slate-300 text-center">Última actualización: Enero 2024</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="space-y-6 text-slate-200">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Información que Recopilamos</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Recopilamos información que nos proporcionas
                  directamente, como cuando creas una cuenta, te suscribes a nuestros servicios o nos contactas.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Información de cuenta (nombre, email, contraseña)</li>
                  <li>Preferencias musicales y historial de reproducción</li>
                  <li>Información de pago y facturación</li>
                  <li>Datos de uso y navegación</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. Cómo Usamos tu Información</h2>
                <p>
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Utilizamos la información
                  recopilada para:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Proporcionar y mejorar nuestros servicios</li>
                  <li>Personalizar tu experiencia musical</li>
                  <li>Procesar pagos y suscripciones</li>
                  <li>Comunicarnos contigo sobre el servicio</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. Compartir Información</h2>
                <p>
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. No vendemos ni alquilamos tu
                  información personal a terceros.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Cookies y Tecnologías Similares</h2>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                  Utilizamos cookies para mejorar tu experiencia.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Seguridad de Datos</h2>
                <p>
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
                  laborum. Implementamos medidas de seguridad técnicas y organizativas.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Tus Derechos</h2>
                <p>
                  Tienes derecho a acceder, rectificar, eliminar y portar tus datos personales. También puedes oponerte
                  al procesamiento en ciertas circunstancias.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Contacto</h2>
                <p>Para ejercer tus derechos o hacer consultas sobre privacidad:</p>
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
