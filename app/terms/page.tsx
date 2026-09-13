import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BRAND_NAME, LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/brand"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl text-white text-center">Términos de Servicio</CardTitle>
              <p className="text-slate-300 text-center">Última actualización: {LEGAL_UPDATED}</p>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <div className="space-y-6 text-slate-200">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">1. Aceptación de los Términos</h2>
                  <p>
                    Al crear una cuenta o usar {BRAND_NAME} (web, Android o iOS) aceptas estos términos. Si no estás de
                    acuerdo, no uses el servicio.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">2. Descripción del Servicio</h2>
                  <p>
                    {BRAND_NAME} es una plataforma de streaming musical. Según tu plan puedes escuchar previews,
                    reproducir el catálogo, descargar para modo offline, crear playlists y, si eres artista, subir
                    música y gestionar tu perfil.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">3. Cuentas de Usuario</h2>
                  <p>
                    Debes proporcionar datos veraces y mantener segura tu contraseña. Eres responsable de la actividad
                    que ocurra en tu cuenta. Puedes eliminar tu cuenta en cualquier momento desde{" "}
                    <a href="/delete-account" className="text-purple-300 underline">
                      Eliminar cuenta
                    </a>
                    .
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">4. Suscripciones y Pagos</h2>
                  <p>
                    Los planes de pago se procesan a través de Stripe. Los precios se muestran antes de confirmar. Las
                    suscripciones se renuevan automáticamente hasta que las canceles. El acceso de pago continúa hasta
                    el final del período ya facturado.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">5. Propiedad Intelectual</h2>
                  <p>
                    El catálogo, marcas y software de {BRAND_NAME} están protegidos. Los artistas conservan los derechos
                    sobre su música original y nos conceden licencia para alojarla y reproducirla en la plataforma. No
                    subas contenido que no te pertenezca o para el que no tengas permiso.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">6. Uso Aceptable</h2>
                  <p>
                    No puedes eludir límites del plan gratuito, redistribuir audio fuera de la app, atacar el servicio
                    ni usar la plataforma para actividad ilegal. Podemos suspender cuentas que incumplan estas reglas.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">7. Limitación de Responsabilidad</h2>
                  <p>
                    El servicio se ofrece «tal cual». No garantizamos disponibilidad ininterrumpida. En la medida que
                    permita la ley, {BRAND_NAME} no responde por daños indirectos derivados del uso o la imposibilidad
                    de usar la plataforma.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">8. Modificaciones</h2>
                  <p>
                    Podemos actualizar estos términos. El uso continuado después de publicar un cambio implica su
                    aceptación. La fecha de la última actualización aparece al inicio de esta página.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">9. Contacto</h2>
                  <p>
                    Consultas sobre estos términos:{" "}
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
