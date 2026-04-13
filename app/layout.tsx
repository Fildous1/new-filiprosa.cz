import type { Metadata, Viewport } from 'next'
import './globals.css'
import { Providers } from '@/components/Providers'

const SITE_URL = 'https://filiprosa.cz'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export const metadata: Metadata = {
  title: {
    default: 'Filip Rosa - Fotografie s du\u0161\u00ed',
    template: '%s | Filip Rosa',
  },
  description: 'Portr\u00e9tov\u00e9 focen\u00ed, produktov\u00e1 fotografie, vyvol\u00e1v\u00e1n\u00ed film\u016f a\u00a0darkroom tisky. Filip Rosa - \u0159emesln\u00e1 fotografie s\u00a0du\u0161\u00ed.',
  metadataBase: new URL(SITE_URL),
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    type: 'website',
    locale: 'cs_CZ',
    alternateLocale: 'en_US',
    url: SITE_URL,
    siteName: 'Filip Rosa',
    title: 'Filip Rosa - Fotografie s du\u0161\u00ed',
    description: 'Portr\u00e9ty, produktov\u00e1 fotografie, vyvol\u00e1v\u00e1n\u00ed film\u016f a\u00a0darkroom tisky. Ka\u017ed\u00fd sn\u00edmek vypr\u00e1v\u00ed p\u0159\u00edb\u011bh.',
    images: [
      {
        url: '/images/profile.jpg',
        width: 1200,
        height: 630,
        alt: 'Filip Rosa - fotograf',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filip Rosa - Fotografie s du\u0161\u00ed',
    description: 'Portr\u00e9ty, produktov\u00e1 fotografie, vyvol\u00e1v\u00e1n\u00ed film\u016f a\u00a0darkroom tisky.',
    images: ['/images/profile.jpg'],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="cs" suppressHydrationWarning className="scroll-pt-24">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,800;1,400;1,600;1,700&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Person',
              name: 'Filip Rosa',
              url: SITE_URL,
              image: `${SITE_URL}/images/profile.jpg`,
              jobTitle: 'Fotograf',
              description: 'Portr\u00e9tov\u00e9 focen\u00ed, produktov\u00e1 fotografie, vyvol\u00e1v\u00e1n\u00ed film\u016f a darkroom tisky.',
              sameAs: [],
              knowsAbout: [
                'Portrait photography',
                'Product photography',
                'Film development',
                'Darkroom printing',
                'Analog photography',
              ],
            }),
          }}
        />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
