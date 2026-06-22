"use client"

export const dynamic = 'force-dynamic'

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Users, Headphones, Download } from "lucide-react"
import { PublicSiteHeader } from "@/components/layout/public-site-header"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader
        trailing={
          <>
            <Link href="/login">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/10 min-h-[44px] px-3 text-sm sm:min-h-9 sm:text-base"
              >
                Iniciar Sesión
              </Button>
            </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white min-h-[44px] px-3 text-sm sm:min-h-9 sm:text-base"
              >
                Registrarse
              </Button>
            </Link>
          </>
        }
      />

      <div className="site-header-offset">
      <main className="container mx-auto px-4 py-10 sm:py-16">
        <div className="relative bg-black/30 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden mb-12 sm:mb-16">
          <div className="grid lg:grid-cols-2 min-h-[500px]">
            {/* Left side - Content */}
            <div className="flex flex-col justify-center p-8 lg:p-12">
              <h1 className="text-4xl lg:text-5xl font-bold text-white mb-6 text-balance">
                Tu música, en cualquier lugar
              </h1>
              <p className="text-xl text-slate-200 mb-8 text-pretty max-w-lg">
                Descubre millones de canciones, crea playlists personalizadas y disfruta de música sin límites
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/register">
                  <Button
                    size="lg"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg w-full sm:w-auto"
                  >
                    Empezar Gratis
                  </Button>
                </Link>
                <Link href="/login">
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-white hover:bg-white/10 bg-transparent px-8 py-3 text-lg w-full sm:w-auto"
                  >
                    Iniciar Sesión
                  </Button>
                </Link>
              </div>
            </div>

            {/* Right side - Image */}
            <div className="relative hidden lg:block">
              <img
                src="/guitarist-performing.jpg"
                alt="Guitarrista cantando con efectos musicales visuales"
                className="absolute inset-0 w-full h-full object-cover"
                onError={(e) => {
                  ;(e.target as HTMLImageElement).src = "/guitarist-singing-with-musical-notes-and-sound-wav.jpg"
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent via-purple-900/20 to-black/60"></div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader className="text-center">
              <Music className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <CardTitle className="text-white">Catálogo Extenso</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-100 text-center">
                Millones de canciones de artistas independientes y contenido exclusivo
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader className="text-center">
              <Download className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <CardTitle className="text-white">Modo Offline</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-100 text-center">
                Descarga tu música favorita y escúchala sin conexión
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader className="text-center">
              <Headphones className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <CardTitle className="text-white">Alta Calidad</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-100 text-center">
                Audio de alta fidelidad para la mejor experiencia de escucha
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader className="text-center">
              <Users className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <CardTitle className="text-white">Para Artistas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-100 text-center">
                Plataforma para que artistas suban y moneticen su música
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Pricing */}
        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Gratuito</CardTitle>
              <CardDescription className="text-slate-100">Perfecto para empezar</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-white mb-4">$0</div>
              <ul className="text-slate-100 space-y-2 mb-6">
                <li>• Previews de 30 segundos</li>
                <li>• Compra canciones individuales</li>
                <li>• Playlists básicas</li>
                <li>• Con anuncios</li>
              </ul>
              <Link href="/register">
                <Button
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10 bg-transparent"
                >
                  Empezar Gratis
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-600/30 to-blue-600/30 border-purple-400/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">Premium</CardTitle>
              <CardDescription className="text-slate-100">Experiencia completa</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <div className="text-4xl font-bold text-white mb-4">
                $9.99<span className="text-lg">/mes</span>
              </div>
              <ul className="text-slate-100 space-y-2 mb-6">
                <li>• Acceso completo al catálogo</li>
                <li>• Descargas offline ilimitadas</li>
                <li>• Sin anuncios</li>
                <li>• Calidad de audio superior</li>
              </ul>
              <Link href="/register?plan=premium">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">Suscribirse</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Music className="h-6 w-6 text-purple-400" />
                <span className="text-xl font-bold text-white">MusicStream</span>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                La plataforma de streaming musical que conecta artistas con sus fans de manera directa y auténtica.
              </p>
              <div className="flex gap-4">
                <Link
                  href="https://twitter.com/musicstream"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                  </svg>
                </Link>
                <Link
                  href="https://facebook.com/musicstream"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                  </svg>
                </Link>
                <Link
                  href="https://instagram.com/musicstream"
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.748-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z.017 0z" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/register" className="text-slate-300 hover:text-white transition-colors">
                    Planes y Precios
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="/artist" className="text-slate-300 hover:text-white transition-colors">
                    Para Artistas
                  </Link>
                </li>
                <li>
                  <Link href="/offline" className="text-slate-300 hover:text-white transition-colors">
                    Modo Offline
                  </Link>
                </li>
                <li>
                  <Link href="/search" className="text-slate-300 hover:text-white transition-colors">
                    Explorar Música
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h3 className="text-white font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/help" className="text-slate-300 hover:text-white transition-colors">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link href="/help#contact" className="text-slate-300 hover:text-white transition-colors">
                    Contacto
                  </Link>
                </li>
                <li>
                  <Link href="/help#faq" className="text-slate-300 hover:text-white transition-colors">
                    Preguntas Frecuentes
                  </Link>
                </li>
                <li>
                  <Link href="/status" className="text-slate-300 hover:text-white transition-colors">
                    Estado del Servicio
                  </Link>
                </li>
                <li>
                  <Link href="/report" className="text-slate-300 hover:text-white transition-colors">
                    Reportar Problema
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/terms" className="text-slate-300 hover:text-white transition-colors">
                    Términos de Servicio
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="text-slate-300 hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
                <li>
                  <Link href="/copyright" className="text-slate-300 hover:text-white transition-colors">
                    Derechos de Autor
                  </Link>
                </li>
                <li>
                  <Link href="/licenses" className="text-slate-300 hover:text-white transition-colors">
                    Licencias
                  </Link>
                </li>
                <li>
                  <Link href="/cookies" className="text-slate-300 hover:text-white transition-colors">
                    Cookies
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <div className="text-slate-400 text-sm mb-4 md:mb-0">
              © 2024 MusicStream. Todos los derechos reservados.
            </div>
            <div className="text-slate-400 text-sm">
              <span>Contacto: </span>
              <Link href="mailto:info@musicstream.com" className="hover:text-white transition-colors">
                info@musicstream.com
              </Link>
              <span className="mx-2">|</span>
              <Link href="tel:+34900123456" className="hover:text-white transition-colors">
                +34 900 123 456
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
