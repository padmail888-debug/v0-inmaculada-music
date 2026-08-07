"use client"

import { Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { FeaturedContentForm } from "@/components/featured-content/featured-content-form"
import { AppShell } from "@/components/layout/app-shell"

function EditInner() {
  const searchParams = useSearchParams()
  const id = searchParams.get("id")?.trim() || ""
  return <FeaturedContentForm mode="edit" itemId={id} />
}

export default function AdminFeaturedEditPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <div className="py-16 text-center text-slate-300">Cargando…</div>
        </AppShell>
      }
    >
      <EditInner />
    </Suspense>
  )
}
