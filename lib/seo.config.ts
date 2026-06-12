export const defaultSEO = {
  title: "Inmaculada Music - Tu música, en cualquier lugar",
  description:
    "Plataforma de streaming musical con millones de canciones. Crea playlists personalizadas, descubre nuevos artistas y disfruta de música sin límites. Modo offline disponible.",
  canonical: "https://inmaculadamusic.com",
  openGraph: {
    type: "website",
    locale: "es_ES",
    url: "https://inmaculadamusic.com",
    site_name: "Inmaculada Music",
    title: "Inmaculada Music - Streaming Musical Sin Límites",
    description:
      "Descubre, escucha y comparte música con la mejor plataforma de streaming. Artistas independientes, playlists personalizadas y modo offline.",
    images: [
      {
        url: "https://inmaculadamusic.com/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Inmaculada Music - Plataforma de Streaming Musical",
      },
    ],
  },
  twitter: {
    handle: "@inmaculadamusic",
    site: "@inmaculadamusic",
    cardType: "summary_large_image",
  },
  additionalMetaTags: [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1",
    },
    {
      name: "theme-color",
      content: "#1e293b",
    },
    {
      name: "apple-mobile-web-app-capable",
      content: "yes",
    },
    {
      name: "apple-mobile-web-app-status-bar-style",
      content: "black-translucent",
    },
  ],
  additionalLinkTags: [
    {
      rel: "icon",
      href: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      href: "/apple-touch-icon.jpg",
      sizes: "180x180",
    },
    {
      rel: "manifest",
      href: "/manifest.json",
    },
  ],
}

export const pageSEO = {
  dashboard: {
    title: "Dashboard - Inmaculada Music",
    description: "Tu biblioteca musical personal. Accede a tus playlists, canciones favoritas y descubre nueva música.",
  },
  search: {
    title: "Buscar Música - Inmaculada Music",
    description:
      "Busca canciones, artistas y álbumes. Filtra por género y encuentra exactamente lo que quieres escuchar.",
  },
  playlists: {
    title: "Mis Playlists - Inmaculada Music",
    description: "Gestiona tus playlists personalizadas. Crea, edita y organiza tu música favorita.",
  },
  artist: {
    title: "Perfil de Artista - Inmaculada Music",
    description: "Sube tu música, gestiona tu perfil y conecta con tus fans en Inmaculada Music.",
  },
  admin: {
    title: "Panel de Administración - Inmaculada Music",
    description: "Gestiona usuarios, contenido y configuraciones de la plataforma Inmaculada Music.",
  },
}
