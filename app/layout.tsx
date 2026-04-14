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
    default: 'Filip Rosa – Analogová fotografie, Vyškov',
    template: '%s | Filip Rosa',
  },
  description:
    'Mladý fotograf z Vyškova specializující se na analogovou fotografii. Portrétní focení, vyvolávání filmů, darkroom tisky a skenování pro celou jižní Moravu.',
  keywords: [
    'fotograf Vyškov',
    'analogová fotografie',
    'vyvolávání filmů',
    'darkroom tisky',
    'portrétní fotograf',
    'produktová fotografie',
    'jižní Morava',
    'Jihomoravský kraj',
    'film photography',
    'Filip Rosa',
  ],
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
    title: 'Filip Rosa – Analogová fotografie, Vyškov',
    description:
      'Portrétní focení, produktová fotografie, vyvolávání filmů a darkroom tisky. Fotograf z Vyškova pro celou jižní Moravu.',
    images: [
      {
        url: `${SITE_URL}/images/profile.jpg`,
        width: 1200,
        height: 630,
        alt: 'Filip Rosa – fotograf, Vyškov',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Filip Rosa – Analogová fotografie, Vyškov',
    description:
      'Portrétní focení, vyvolávání filmů a darkroom tisky. Fotograf z Vyškova pro celou jižní Moravu.',
    images: [`${SITE_URL}/images/profile.jpg`],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
    languages: {
      'cs-CZ': SITE_URL,
      'en-US': `${SITE_URL}?lang=en`,
    },
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
              description:
                'Mladý fotograf z Vyškova specializující se na analogovou fotografii – portréty, produkty, vyvolávání filmů a darkroom tisky pro celou jižní Moravu.',
              address: {
                '@type': 'PostalAddress',
                addressLocality: 'Vyškov',
                addressRegion: 'Jihomoravský kraj',
                addressCountry: 'CZ',
              },
              areaServed: {
                '@type': 'AdministrativeArea',
                name: 'Jihomoravský kraj',
              },
              sameAs: [],
              knowsAbout: [
                'Analogová fotografie',
                'Portrétní fotografie',
                'Produktová fotografie',
                'Vyvolávání filmů',
                'Darkroom tisky',
                'Skenování negativů',
                'Portrait photography',
                'Film development',
                'Darkroom printing',
                'Analog photography',
              ],
              offers: [
                {
                  '@type': 'Offer',
                  name: 'Portrétní a produktová fotografie',
                  description: 'Focení pro jednotlivce, firmy a události v digitálním i analogovém stylu.',
                  areaServed: 'Jihomoravský kraj',
                },
                {
                  '@type': 'Offer',
                  name: 'Vyvolávání černobílých filmů',
                  description: 'Individuální vyvolávání černobílých negativů.',
                },
                {
                  '@type': 'Offer',
                  name: 'Darkroom tisky',
                  description: 'Ručně vyrobené zvětšeniny z negativů v temné komoře.',
                },
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
