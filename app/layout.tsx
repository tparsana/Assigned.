import type { Metadata, Viewport } from 'next'
import { Hanken_Grotesk, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Providers } from '@/components/providers'
import './globals.css'

const hankenGrotesk = Hanken_Grotesk({ 
  subsets: ["latin"],
  variable: '--font-sans',
  display: 'swap',
})

const geistMono = Geist_Mono({ 
  subsets: ["latin"],
  variable: '--font-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Tasked. | Turn Chaos Into Clear Daily Action',
  description: 'A sophisticated personal planning system that helps you capture, organize, and execute daily tasks using multiple productivity methods in one calm, minimal interface.',
  generator: 'v0.app',
  manifest: '/site.webmanifest',
  icons: {
    icon: [
      {
        url: '/favicon.ico',
      },
      {
        url: '/favicon-32x32.png',
        sizes: '32x32',
        type: 'image/png',
      },
      {
        url: '/favicon-16x16.png',
        sizes: '16x16',
        type: 'image/png',
      },
    ],
    apple: [
      {
        url: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: '#FAFAFF',
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${hankenGrotesk.variable} ${geistMono.variable} font-sans antialiased`}>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  )
}
