"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Music, Users, Headphones, Download } from "lucide-react"
import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { HomePricingCards } from "@/components/home/home-pricing-cards"
import { BrandLogo } from "@/components/brand-logo"
import { BRAND_NAME, SUPPORT_EMAIL } from "@/lib/brand"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader
        trailing={
          <>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="text-white hover:bg-white/10 min-h-[44px] px-3 text-sm sm:min-h-9 sm:text-base"
            >
              <Link href="/login">Iniciar Sesión</Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-purple-600 hover:bg-purple-700 text-white min-h-[44px] px-3 text-sm sm:min-h-9 sm:text-base"
            >
              <Link href="/register">Registrarse</Link>
            </Button>
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
                <Button
                  asChild
                  size="lg"
                  className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 text-lg w-full sm:w-auto"
                >
                  <Link href="/register">Empezar Gratis</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-white hover:bg-white/10 bg-transparent px-8 py-3 text-lg w-full sm:w-auto"
                >
                  <Link href="/login">Iniciar Sesión</Link>
                </Button>
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
        <HomePricingCards />
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-black/20 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BrandLogo className="h-6 w-6" />
                <span className="text-xl font-bold text-white">{BRAND_NAME}</span>
              </div>
              <p className="text-slate-300 text-sm mb-4">
                La plataforma de streaming musical que conecta artistas con sus fans de manera directa y auténtica.
              </p>
            </div>

            {/* Product */}
            <div>
              <h3 className="text-white font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/subscription" className="text-slate-300 hover:text-white transition-colors">
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
                  <Link href="/delete-account" className="text-slate-300 hover:text-white transition-colors">
                    Eliminar cuenta
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
              © {new Date().getFullYear()} {BRAND_NAME}. Todos los derechos reservados.
            </div>
            <div className="text-slate-400 text-sm">
              <span>Contacto: </span>
              <Link href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-white transition-colors">
                {SUPPORT_EMAIL}
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
