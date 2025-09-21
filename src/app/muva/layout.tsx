import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'MUVA - Asistente Turístico de San Andrés | InnPilot',
  description: 'Descubre San Andrés con MUVA, tu asistente turístico inteligente. Encuentra los mejores restaurantes, playas, hoteles y experiencias en el paraíso caribeño colombiano.',
  keywords: [
    'San Andrés',
    'turismo',
    'Colombia',
    'Caribe',
    'restaurantes',
    'hoteles',
    'playas',
    'asistente turístico',
    'viajes',
    'isla',
    'MUVA',
    'InnPilot'
  ].join(', '),
  openGraph: {
    title: 'MUVA - Asistente Turístico de San Andrés',
    description: 'Tu guía inteligente para explorar San Andrés. Descubre restaurantes, playas, hoteles y experiencias únicas en el Caribe colombiano.',
    type: 'website',
    locale: 'es_CO',
    siteName: 'InnPilot'
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MUVA - Asistente Turístico de San Andrés',
    description: 'Descubre San Andrés con tu asistente turístico inteligente'
  },
  alternates: {
    canonical: '/muva'
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
}

export default function MuvaLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}