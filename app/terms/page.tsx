import Link from "next/link"
import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Music } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
<main className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-white text-center">Términos de Servicio</CardTitle>
            <p className="text-slate-300 text-center">Última actualización: Enero 2024</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="space-y-6 text-slate-200">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">1. Aceptación de los Términos</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et
                  dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut
                  aliquip ex ea commodo consequat.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">2. Descripción del Servicio</h2>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
                  laborum.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Streaming de música en alta calidad</li>
                  <li>Descargas para modo offline</li>
                  <li>Playlists personalizadas</li>
                  <li>Contenido exclusivo de artistas</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">3. Cuentas de Usuario</h2>
                <p>
                  Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium,
                  totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta
                  sunt explicabo.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">4. Suscripciones y Pagos</h2>
                <p>
                  Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur
                  magni dolores eos qui ratione voluptatem sequi nesciunt.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">5. Propiedad Intelectual</h2>
                <p>
                  Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia
                  non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">6. Limitaciones de Responsabilidad</h2>
                <p>
                  Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut
                  aliquid ex ea commodi consequatur.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">7. Modificaciones</h2>
                <p>
                  Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur,
                  vel illum qui dolorem eum fugiat quo voluptas nulla pariatur.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">8. Contacto</h2>
                <p>Para cualquier consulta sobre estos términos, puedes contactarnos en:</p>
                <ul className="list-none mt-2 space-y-1">
                  <li>Email: legal@musicstream.com</li>
                  <li>Teléfono: +34 900 123 456</li>
                  <li>Dirección: Calle Música 123, Madrid, España</li>
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
