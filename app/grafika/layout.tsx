import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Grafika ke stažení',
  description: 'Tapety, podklady a další grafické soubory od Filipa Rosy zdarma ke stažení.',
  openGraph: {
    title: 'Grafika ke stažení | Filip Rosa',
    description: 'Tapety a další grafiky zdarma ke stažení.',
    url: '/grafika',
    images: [{ url: '/images/profile.jpg', width: 1200, height: 630, alt: 'Filip Rosa — Grafika ke stažení' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Grafika ke stažení | Filip Rosa',
    description: 'Tapety a další grafiky zdarma ke stažení.',
  },
  alternates: { canonical: '/grafika' },
}

export default function GrafikaLayout({ children }: { children: React.ReactNode }) {
  return children
}
