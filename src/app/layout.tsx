import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PWAProvider } from "@/components/PWA";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InnPilot - Plataforma de Gestión SIRE para Hoteles en Colombia",
  description: "Plataforma integral de gestión SIRE para hoteles colombianos. Validación de documentos con IA, asistente turístico MUVA para San Andrés, y herramientas de cumplimiento normativo.",
  keywords: [
    'SIRE',
    'gestión hotelera',
    'Colombia',
    'cumplimiento normativo',
    'inteligencia artificial',
    'turismo',
    'San Andrés',
    'validación documentos',
    'InnPilot',
    'hoteles'
  ].join(', '),
  authors: [{ name: 'InnPilot Team' }],
  creator: 'InnPilot',
  publisher: 'InnPilot',
  openGraph: {
    type: 'website',
    locale: 'es_CO',
    url: 'https://innpilot.vercel.app',
    siteName: 'InnPilot',
    title: 'InnPilot - Plataforma de Gestión SIRE para Hoteles',
    description: 'Solución integral para hoteles colombianos: gestión SIRE, validación con IA, y asistente turístico MUVA.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'InnPilot - Gestión Hotelera Inteligente'
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    site: '@InnPilot',
    creator: '@InnPilot',
    title: 'InnPilot - Gestión Hotelera Inteligente',
    description: 'Plataforma SIRE con IA para hoteles colombianos'
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
  },
  verification: {
    google: 'your-google-verification-code',
  },
  category: 'technology',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="InnPilot" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <PWAProvider>
          {children}
        </PWAProvider>
      </body>
    </html>
  );
}
