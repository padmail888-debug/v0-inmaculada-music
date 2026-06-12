import type { Metadata } from "next"

interface PageSEOProps {
  title: string
  description: string
  path?: string
  image?: string
  noindex?: boolean
}

export function generatePageMetadata({
  title,
  description,
  path = "",
  image = "/og-image.jpg",
  noindex = false,
}: PageSEOProps): Metadata {
  const fullTitle = `${title} | Inmaculada Music`
  const url = `https://inmaculadamusic.com${path}`

  return {
    title: fullTitle,
    description,
    openGraph: {
      title: fullTitle,
      description,
      url,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      title: fullTitle,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
    robots: noindex ? { index: false, follow: false } : undefined,
  }
}
