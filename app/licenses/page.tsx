import Link from "next/link"
import { PublicSiteHeader } from "@/components/layout/public-site-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Music } from "lucide-react"

export default function LicensesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <PublicSiteHeader showBack />
      <div className="site-header-offset">
<main className="container mx-auto px-4 py-16 max-w-4xl">
        <Card className="bg-black/40 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-3xl text-white text-center">Licencias de Software</CardTitle>
            <p className="text-slate-300 text-center">Información sobre las licencias de terceros utilizadas</p>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="space-y-6 text-slate-200">
              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Licencias de Código Abierto</h2>
                <p>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. MusicStream utiliza varios componentes de
                  código abierto bajo diferentes licencias.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">React y Next.js</h2>
                <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                  <p className="font-medium text-white mb-2">MIT License</p>
                  <p className="text-sm">Copyright (c) Meta Platforms, Inc. and affiliates.</p>
                  <p className="text-sm mt-2">
                    Permission is hereby granted, free of charge, to any person obtaining a copy of this software...
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Tailwind CSS</h2>
                <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                  <p className="font-medium text-white mb-2">MIT License</p>
                  <p className="text-sm">Copyright (c) Tailwind Labs, Inc.</p>
                  <p className="text-sm mt-2">
                    Permission is hereby granted, free of charge, to any person obtaining a copy...
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Lucide Icons</h2>
                <div className="bg-black/20 p-4 rounded-lg border border-white/10">
                  <p className="font-medium text-white mb-2">ISC License</p>
                  <p className="text-sm">
                    Copyright (c) for portions of Lucide are held by Cole Bemis 2013-2022 as part of Feather (MIT).
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Otras Dependencias</h2>
                <div className="space-y-3">
                  <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                    <p className="font-medium text-white text-sm">@radix-ui/react-* - MIT License</p>
                    <p className="text-xs text-slate-300">Componentes de UI accesibles</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                    <p className="font-medium text-white text-sm">clsx - MIT License</p>
                    <p className="text-xs text-slate-300">Utilidad para clases CSS condicionales</p>
                  </div>
                  <div className="bg-black/20 p-3 rounded-lg border border-white/10">
                    <p className="font-medium text-white text-sm">class-variance-authority - Apache 2.0</p>
                    <p className="text-xs text-slate-300">Utilidad para variantes de componentes</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Licencias de Contenido</h2>
                <p>
                  Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. El contenido musical está sujeto a
                  diferentes tipos de licencias:
                </p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Licencias de sincronización</li>
                  <li>Licencias mecánicas</li>
                  <li>Licencias de ejecución pública</li>
                  <li>Licencias Creative Commons (contenido seleccionado)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-white mb-3">Contacto</h2>
                <p>Para consultas sobre licencias:</p>
                <ul className="list-none mt-2 space-y-1">
                  <li>Email: licenses@musicstream.com</li>
                  <li>Teléfono: +34 900 123 456</li>
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
