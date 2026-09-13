import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BRAND_NAME, LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/brand"

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl text-white text-center">Política de Cookies</CardTitle>
              <p className="text-slate-300 text-center">
                Cómo usa {BRAND_NAME} cookies y almacenamiento local. Última actualización: {LEGAL_UPDATED}
              </p>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <div className="space-y-6 text-slate-200">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">¿Qué son las Cookies?</h2>
                  <p>
                    Las cookies y el almacenamiento local son pequeños datos que el navegador o la app guardan en tu
                    dispositivo para recordar la sesión y tus preferencias.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Tipos que utilizamos</h2>
                  <div className="space-y-4">
                    <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                      <h4 className="text-white font-medium mb-2">Esenciales</h4>
                      <p className="text-sm">
                        Sesión de usuario (Supabase Auth), preferencias de la app y protección de formularios. Sin ellas
                        no puedes iniciar sesión ni reproducir música con tu cuenta.
                      </p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                      <h4 className="text-white font-medium mb-2">Funcionalidad</h4>
                      <p className="text-sm">
                        Calidad de audio, cola de reproducción, descargas offline y estado del reproductor.
                      </p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                      <h4 className="text-white font-medium mb-2">Pagos</h4>
                      <p className="text-sm">
                        Stripe puede colocar cookies propias en su página de checkout para procesar el pago de forma
                        segura.
                      </p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                      <h4 className="text-white font-medium mb-2">Analítica (solo web)</h4>
                      <p className="text-sm">
                        Vercel Analytics nos ayuda a entender el uso agregado de la web. No usamos publicidad de
                        terceros ni remarketing.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Gestión</h2>
                  <p>
                    Puedes borrar cookies y datos del sitio desde la configuración del navegador. Si las bloqueas por
                    completo, es posible que debas iniciar sesión en cada visita.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Contacto</h2>
                  <p>
                    Preguntas sobre cookies:{" "}
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
