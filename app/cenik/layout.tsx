import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Ceník',
  description: 'Ceník služeb Filipa Rosy — focení, vyvolávání filmů, skenování a darkroom tisky.',
  openGraph: {
    title: 'Ceník | Filip Rosa',
    description: 'Přehled cen za focení, vyvolávání, skenování a tisky.',
    url: '/cenik',
    images: [{ url: '/images/profile.jpg', width: 1200, height: 630, alt: 'Filip Rosa — Ceník' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ceník | Filip Rosa',
    description: 'Přehled cen za focení, vyvolávání, skenování a tisky.',
  },
  alternates: { canonical: '/cenik' },
}

export default function CenikLayout({ children }: { children: React.ReactNode }) {
  return children
}
