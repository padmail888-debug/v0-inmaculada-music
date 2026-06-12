"use client"

import type { ReactNode } from "react"
import { ArtistTopBar } from "@/components/layout/artist-top-bar"

type ArtistShellProps = {
  children: ReactNode
  mainClassName?: string
}

/** Artist layout: dedicated top bar, no listener sidebar. */
export function ArtistShell({ children, mainClassName = "" }: ArtistShellProps) {
  return (
    <div className="flex min-h-screen min-h-[100dvh] flex-col bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="relative z-40 shrink-0 overflow-visible">
        <ArtistTopBar />
      </div>
      <main
        className={`page-main-scroll min-h-0 min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-4 sm:px-6 sm:py-6 ${mainClassName}`.trim()}
      >
        {children}
      </main>
    </div>
  )
}
