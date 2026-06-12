import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Music, ArrowLeft } from "lucide-react"
import type { ReactNode } from "react"

type PublicSiteHeaderProps = {
  trailing?: ReactNode
  showBack?: boolean
  backHref?: string
  title?: string
}

export function PublicSiteHeader({
  trailing,
  showBack = false,
  backHref = "/",
  title = "MusicStream",
}: PublicSiteHeaderProps) {
  return (
    <header className="site-header-fixed top-bar-safe flex items-center border-b border-white/10 bg-black/20 backdrop-blur-xl">
      <div className="container mx-auto flex w-full min-w-0 items-center justify-between gap-3 px-3 sm:px-6">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-4">
          {showBack ? (
            <Link href={backHref} className="shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="min-h-[44px] min-w-[44px] p-0 text-white hover:bg-white/10 sm:min-h-9 sm:min-w-9"
                aria-label="Volver"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
          ) : null}
          <Link href="/" className="flex min-w-0 items-center gap-2 min-h-[44px]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
              <Music className="h-5 w-5 text-white" />
            </div>
            <span className="truncate font-bold text-white text-base sm:text-lg">{title}</span>
          </Link>
        </div>
        {trailing ? <div className="flex shrink-0 items-center gap-2">{trailing}</div> : null}
      </div>
    </header>
  )
}
