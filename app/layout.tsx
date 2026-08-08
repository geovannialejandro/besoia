import type { Metadata, Viewport } from 'next'
import { Playfair_Display, Inter } from 'next/font/google'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'BESOIA · IA Generator',
  description: 'Genera imágenes y videos ultra realistas en segundos.',
}

export const viewport: Viewport = {
  themeColor: '#030712',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className={`${playfair.variable} ${inter.variable} dark`}>
      <body className="bg-gray-950 text-white font-sans antialiased selection:bg-amber-500 selection:text-gray-950">
        {children}
      </body>
    </html>
  )
}
