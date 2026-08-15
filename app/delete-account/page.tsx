import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DeleteAccountForm } from "@/components/account/delete-account-form"
import { DeleteAccountHeader } from "@/components/account/delete-account-header"

export default function DeleteAccountPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <DeleteAccountHeader />
      <div className="site-header-offset">
        <main className="container mx-auto px-4 py-12 max-w-2xl">
          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl text-white text-center">Eliminar cuenta</CardTitle>
              <CardDescription className="text-slate-300 text-center">
                Usa esta página en la web o en la app para borrar tu cuenta de Inmaculada Music.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-8 text-slate-200">
              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Qué se elimina</h2>
                <p>
                  La eliminación es permanente y se procesa de inmediato al confirmar. Se borra:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Tu cuenta de acceso (email y datos de perfil)</li>
                  <li>Playlists, me gusta, descargas y preferencias</li>
                  <li>Tokens de notificaciones y sesión</li>
                  <li>Si eres artista: canciones, álbumes y conciertos</li>
                  <li>Suscripciones activas (se cancelan en Stripe)</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-lg font-semibold text-white">Qué puede conservarse</h2>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li>Registros de reproducción anónimos (sin tu usuario)</li>
                  <li>Datos de facturación que la ley o el procesador de pagos deban conservar</li>
                </ul>
                <p className="text-sm text-slate-400">
                  No hay periodo de espera: al confirmar, la cuenta deja de existir.
                </p>
              </section>

              <DeleteAccountForm />
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  )
}
