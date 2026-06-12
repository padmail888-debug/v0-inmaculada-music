"use client"

import type { ReactNode } from "react"
import { Sidebar } from "@/components/layout/sidebar"
import { TopBar } from "@/components/layout/top-bar"

type AppShellProps = {
  children: ReactNode
  mainClassName?: string
}

export function AppShell({ children, mainClassName = "" }: AppShellProps) {
  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <TopBar />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
        <Sidebar />
        <main className={`page-main-scroll min-w-0 overflow-x-hidden ${mainClassName}`.trim()}>{children}</main>
      </div>
    </div>
  )
}
