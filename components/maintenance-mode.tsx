"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, Wrench } from "lucide-react"

export default function MaintenanceMode() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <Card className="bg-slate-800 border-slate-700 max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Wrench className="h-8 w-8 text-yellow-500" />
          </div>
          <CardTitle className="text-white text-2xl">Modo Mantenimiento</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="flex items-center justify-center gap-2 text-yellow-500">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">Sitio en Mantenimiento</span>
          </div>
          <p className="text-gray-400">
            Estamos realizando mejoras en la plataforma. Volveremos pronto con nuevas funcionalidades.
          </p>
          <p className="text-sm text-gray-500">Gracias por tu paciencia.</p>
          <div className="pt-4">
            <div className="text-xs text-gray-600">MusicStream Team</div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
