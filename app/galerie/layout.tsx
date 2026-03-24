import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Galerie',
  description: 'Fotografick\u00e9 portfolio Filipa Rosy \u2014 analogov\u00e1 i digit\u00e1ln\u00ed fotografie. Portr\u00e9ty, street, krajina a darkroom tisky.',
  openGraph: {
    title: 'Galerie | Filip Rosa',
    description: 'Fotografick\u00e9 portfolio \u2014 analogov\u00e1 i digit\u00e1ln\u00ed fotografie.',
    url: '/galerie',
    images: [{ url: '/images/profile.jpg', width: 1200, height: 630, alt: 'Filip Rosa \u2014 Galerie' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galerie | Filip Rosa',
    description: 'Fotografick\u00e9 portfolio \u2014 analogov\u00e1 i digit\u00e1ln\u00ed fotografie.',
  },
  alternates: { canonical: '/galerie' },
}

export default function GalerieLayout({ children }: { children: React.ReactNode }) {
  return children
}
