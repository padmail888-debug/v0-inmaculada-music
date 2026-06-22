import React from "react"
import type { Metadata, Viewport } from "next"
import dynamic from "next/dynamic"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { AuthProvider } from "@/hooks/use-auth"

class ErrorBoundaryWrapper extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error) {
    console.error("[v0] Layout error boundary caught:", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold mb-4">Error en la aplicación</h1>
            <p className="text-slate-400 mb-6">Ocurrió un error al cargar. Por favor, recarga la página.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-6 rounded-lg"
            >
              Recargar página
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

const Analytics = dynamic(
  () => import("@vercel/analytics/next").then((m) => ({ default: m.Analytics })),
  { ssr: false }
)
import { OfflineProvider } from "@/hooks/use-offline"
import { MusicPlayerProvider } from "@/hooks/use-music-player"
import { LikesProvider } from "@/hooks/use-likes"
import { AdminSettingsProvider } from "@/hooks/use-admin-settings"
import { MusicPlayer } from "@/components/music/music-player"
import { DeepLinkHandler } from "@/components/deep-link-handler"
import "@/lib/init-firebase-web"
import { PushNotificationRegistrar } from "@/components/notifications/push-notification-registrar"
import { NativeApiBootstrap } from "@/components/mobile/native-api-bootstrap"
import { NativeApiMisconfigBanner } from "@/components/mobile/native-api-misconfig-banner"
import { NativeSafeArea } from "@/components/mobile/native-safe-area"
import "./globals.css"

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
}

export const metadata: Metadata = {
  title: "Inmaculada Music - Tu música, en cualquier lugar",
  description:
    "Plataforma de streaming musical con modo offline, contenido exclusivo de artistas y experiencia premium. Descubre millones de canciones, crea playlists personalizadas y disfruta de música sin límites.",
  generator: "v0.app",
  keywords: ["música", "streaming", "playlist", "artistas", "modo offline", "premium", "canciones"],
  authors: [{ name: "Inmaculada Music Team" }],
  creator: "Inmaculada Music",
  publisher: "Inmaculada Music",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://your-actual-domain.com"),
  alternates: {
    canonical: "/",
    languages: {
      "es-ES": "/es",
      "en-US": "/en",
    },
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://your-actual-domain.com",
    siteName: "Inmaculada Music",
    title: "Inmaculada Music - Tu música, en cualquier lugar",
    description:
      "Plataforma de streaming musical con modo offline, contenido exclusivo de artistas y experiencia premium.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Inmaculada Music - Plataforma de streaming musical",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inmaculada Music - Tu música, en cualquier lugar",
    description: "Plataforma de streaming musical con modo offline y contenido exclusivo.",
    images: ["/twitter-image.jpg"],
    creator: "@inmaculadamusic",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code", // Add real Google verification code
    yandex: "your-yandex-verification-code", // Add real Yandex verification code
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://api.inmaculadamusic.com" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Inmaculada Music",
              description: "Plataforma de streaming musical con modo offline y contenido exclusivo",
              url: "https://inmaculadamusic.com",
              applicationCategory: "MusicApplication",
              operatingSystem: "Web, iOS, Android",
              offers: {
                "@type": "Offer",
                category: "Subscription",
                price: "9.99",
                priceCurrency: "EUR",
              },
            }),
          }}
        />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} bg-slate-900 text-white`}>
        <ErrorBoundaryWrapper>
          {children}
        </ErrorBoundaryWrapper>
        <Analytics />
      </body>
    </html>
  )
}
