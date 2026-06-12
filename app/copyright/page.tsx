import Link from "next/link"
import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Music } from "lucide-react"

export default function CopyrightPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
<main className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-white text-center">Derechos de Autor</CardTitle>
            <p className="text-slate-300 text-center">Información sobre propiedad intelectual y derechos de autor</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="space-y-6 text-slate-200">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Política de Derechos de Autor</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. MusicStream respeta los derechos de propiedad
                  intelectual y espera que nuestros usuarios hagan lo mismo.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Contenido Protegido</h2>
                <p>
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Todo el contenido musical en
                  nuestra plataforma está protegido por derechos de autor.
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Grabaciones musicales originales</li>
                  <li>Composiciones y letras</li>
                  <li>Artwork y material gráfico</li>
                  <li>Contenido generado por usuarios</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Notificación DMCA</h2>
                <p>
                  Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris. Si crees que tu trabajo protegido
                  por derechos de autor ha sido copiado de manera que constituye una infracción, puedes notificarnos.
                </p>

                <div className="bg-black/20 p-4 rounded-lg border border-white/10 mt-4">
                  <h4 className="text-white font-medium mb-2">Información requerida para notificaciones DMCA:</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Identificación del trabajo protegido por derechos de autor</li>
                    <li>Identificación del material infractor</li>
                    <li>Información de contacto del reclamante</li>
                    <li>Declaración de buena fe</li>
                    <li>Declaración de veracidad</li>
                    <li>Firma física o electrónica</li>
                  </ul>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Licencias y Permisos</h2>
                <p>
                  Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
                  MusicStream obtiene las licencias necesarias para el contenido disponible en la plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Para Artistas</h2>
                <p>
                  Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est
                  laborum. Los artistas mantienen los derechos sobre su contenido original.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Contacto para Derechos de Autor</h2>
                <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                  <p className="font-medium text-white mb-2">Agente de Derechos de Autor:</p>
                  <ul className="list-none space-y-1 text-sm">
                    <li>Email: copyright@musicstream.com</li>
                    <li>Teléfono: +34 900 123 456</li>
                    <li>Dirección: Calle Música 123, Madrid, España</li>
                  </ul>
                </div>
              </section>
            </div>
          </CardContent>
        </Card>
      </main>
      </div>
    </div>
  )
}
