import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, JetBrains_Mono, Noto_Sans_JP } from 'next/font/google'
import { DemoBanner } from '@/components/demo-banner'
import './globals.css'

const bricolage = { variable: 'font-sans' }
const jetbrains = { variable: 'font-mono' }
const notoJp = { variable: 'font-sans' }

export const metadata: Metadata = {
  title: {
    default: 'Taurge — Atelier de localisation manga, manhwa, webtoon',
    template: '%s · Taurge',
  },
  description:
    'Importez un chapitre, laissez l’OCR et la traduction faire le premier jet, corrigez bulle par bulle, exportez. Taurge est la table de travail des traducteurs de contenu illustré.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f4efe6' },
    { media: '(prefers-color-scheme: dark)', color: '#1d1a17' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className="min-h-dvh font-sans antialiased">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-ink focus:px-3 focus:py-2 focus:text-paper"
        >
          Aller au contenu
        </a>
        <DemoBanner />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
