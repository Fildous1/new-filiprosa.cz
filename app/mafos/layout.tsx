import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Mafoš — DIY Film Scanner',
  description: '3D tisknutý filmový skener pro 35mm a svitkové filmy. Od prvního kartonového prototypu po finální verzi.',
  openGraph: {
    title: 'Mafoš — DIY Film Scanner | Filip Rosa',
    description: '3D tisknutý filmový skener pro skenování 35mm a svitkových filmů.',
    url: '/mafos',
    images: [{ url: '/images/mafos/product/front-up.png', width: 1200, height: 630, alt: 'Mafoš — DIY Film Scanner' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mafoš — DIY Film Scanner | Filip Rosa',
    description: '3D tisknutý filmový skener pro skenování 35mm a svitkových filmů.',
  },
  alternates: { canonical: '/mafos' },
}

export default function MafosLayout({ children }: { children: React.ReactNode }) {
  return children
}
