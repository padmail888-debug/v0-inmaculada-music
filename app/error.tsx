"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-white">
      <h2 className="text-xl font-semibold mb-2">Algo ha fallado</h2>
      <p className="text-slate-400 text-center mb-6 max-w-md">
        Ha ocurrido un error. Puedes intentar de nuevo o volver al inicio.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset} className="bg-purple-600 hover:bg-purple-700">
          Intentar de nuevo
        </Button>
        <Button variant="outline" className="border-slate-600" asChild>
          <a href="/">Ir al Inicio</a>
        </Button>
      </div>
    </div>
  )
}
