import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BRAND_NAME, LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/brand"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl text-white text-center">Política de Privacidad</CardTitle>
              <p className="text-slate-300 text-center">Última actualización: {LEGAL_UPDATED}</p>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <div className="space-y-6 text-slate-200">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">1. Información que Recopilamos</h2>
                  <p>
                    {BRAND_NAME} recopila la información necesaria para operar la cuenta y el streaming:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Datos de cuenta (nombre, email y contraseña cifrada por el proveedor de autenticación)</li>
                    <li>Preferencias musicales, me gusta, playlists e historial de reproducción</li>
                    <li>Datos de pago gestionados por Stripe (nosotros no almacenamos el número de tarjeta)</li>
                    <li>Tokens de notificación y datos técnicos del dispositivo o navegador</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">2. Cómo Usamos tu Información</h2>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Autenticarte y prestar el servicio de música</li>
                    <li>Personalizar recomendaciones y playlists</li>
                    <li>Procesar suscripciones y compras a través de Stripe</li>
                    <li>Enviar avisos de la app (inicio de sesión, actividad de artista, incidencias)</li>
                    <li>Detectar abuso y mantener la seguridad de la plataforma</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">3. Compartir Información</h2>
                  <p>
                    No vendemos tu información personal. Solo la compartimos con proveedores que nos ayudan a operar el
                    servicio (Supabase, Stripe, Vercel, Firebase Cloud Messaging) y cuando la ley lo exija.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">4. Cookies y Tecnologías Similares</h2>
                  <p>
                    Usamos cookies y almacenamiento local para la sesión, preferencias de reproducción y, en la web,
                    analítica de Vercel. Más detalle en la{" "}
                    <a href="/cookies" className="text-purple-300 underline">
                      Política de Cookies
                    </a>
                    .
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">5. Seguridad de Datos</h2>
                  <p>
                    Aplicamos cifrado en tránsito (HTTPS), control de acceso por roles y claves de servicio solo en el
                    servidor. Ningún sistema es 100% seguro; notifícanos cualquier incidente en {SUPPORT_EMAIL}.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">6. Tus Derechos</h2>
                  <p>
                    Puedes acceder y actualizar tu perfil, exportar o borrar playlists, y eliminar tu cuenta de forma
                    permanente. Según tu jurisdicción también puedes solicitar acceso, rectificación u oposición al
                    tratamiento escribiendo a {SUPPORT_EMAIL}.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">7. Contacto</h2>
                  <p>
                    Privacidad:{" "}
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
