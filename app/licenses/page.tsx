import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BRAND_NAME, LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/brand"

export default function LicensesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl text-white text-center">Licencias de Software</CardTitle>
              <p className="text-slate-300 text-center">Última actualización: {LEGAL_UPDATED}</p>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <div className="space-y-6 text-slate-200">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Software de código abierto</h2>
                  <p>
                    {BRAND_NAME} se construye con bibliotecas de código abierto. Destacamos las principales; la lista
                    completa está en las dependencias del proyecto.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">React y Next.js</h2>
                  <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                    <p className="font-medium text-white mb-2">MIT License</p>
                    <p className="text-sm">Copyright Meta Platforms, Inc. y Vercel, Inc.</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Tailwind CSS</h2>
                  <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                    <p className="font-medium text-white mb-2">MIT License</p>
                    <p className="text-sm">Copyright Tailwind Labs, Inc.</p>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Otras dependencias</h2>
                  <div className="space-y-3">
                    <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                      <p className="font-medium text-white text-sm">@radix-ui/react-* — MIT</p>
                      <p className="text-xs text-slate-300">Componentes de interfaz accesibles</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                      <p className="font-medium text-white text-sm">lucide-react — ISC</p>
                      <p className="text-xs text-slate-300">Iconografía</p>
                    </div>
                    <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                      <p className="font-medium text-white text-sm">@supabase/supabase-js, stripe, firebase — según su licencia</p>
                      <p className="text-xs text-slate-300">Backend, pagos y notificaciones push</p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Contenido musical</h2>
                  <p>
                    Las canciones no se redistribuyen bajo estas licencias de software. Cada obra pertenece a su
                    titular y se escucha solo dentro del servicio, según el plan del usuario.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Contacto</h2>
                  <p>
                    Consultas sobre licencias:{" "}
                    <a href={`mailto:${SUPPORT_EMAIL}`} className="text-purple-300 underline">
                      {SUPPORT_EMAIL}
                    </a>
                  </p>
                </section>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
