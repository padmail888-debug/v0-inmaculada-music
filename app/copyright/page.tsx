import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BRAND_NAME, LEGAL_UPDATED, SUPPORT_EMAIL } from "@/lib/brand"

export default function CopyrightPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
        <main className="container mx-auto px-4 py-16 max-w-4xl">
          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl text-white text-center">Derechos de Autor</CardTitle>
              <p className="text-slate-300 text-center">Última actualización: {LEGAL_UPDATED}</p>
            </CardHeader>
            <CardContent className="prose prose-invert max-w-none">
              <div className="space-y-6 text-slate-200">
                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Política de Derechos de Autor</h2>
                  <p>
                    {BRAND_NAME} respeta la propiedad intelectual. El catálogo se publica por los propios artistas o con
                    la autorización que ellos declaran al subir el contenido.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Contenido Protegido</h2>
                  <p>Está protegido, entre otros:</p>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Grabaciones y masters</li>
                    <li>Composiciones y letras</li>
                    <li>Portadas y material gráfico</li>
                    <li>Marca y diseño de {BRAND_NAME}</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Aviso de infracción</h2>
                  <p>
                    Si crees que un contenido en la plataforma infringe tus derechos, escríbenos a {SUPPORT_EMAIL} con:
                  </p>
                  <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                    <li>Identificación de la obra protegida</li>
                    <li>URL o título del material que consideras infractor</li>
                    <li>Tus datos de contacto</li>
                    <li>Declaración de que actúas de buena fe y de que la información es veraz</li>
                  </ul>
                  <p className="mt-3">
                    Revisaremos el aviso y, si procede, retiraremos el contenido y contactaremos al usuario que lo
                    publicó.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Para Artistas</h2>
                  <p>
                    Al subir música confirmas que tienes los derechos necesarios (o la autorización del titular) y
                    conservas la titularidad de tu obra. {BRAND_NAME} solo obtiene la licencia para alojarla,
                    reproducirla y promocionarla dentro del servicio.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-white mb-3">Contacto</h2>
                  <p>
                    Agente de derechos de autor:{" "}
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
