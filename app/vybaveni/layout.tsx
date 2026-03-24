import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vybaven\u00ed',
  description: 'P\u0159ehled vybaven\u00ed Filipa Rosy \u2014 analogov\u00e1 a digit\u00e1ln\u00ed t\u011bla, optika, filmy, temn\u00e1 komora a zv\u011bt\u0161ov\u00e1n\u00ed.',
  openGraph: {
    title: 'Vybaven\u00ed | Filip Rosa',
    description: 'P\u0159ehled fotografick\u00e9ho vybaven\u00ed \u2014 od t\u011bl fotoapar\u00e1t\u016f po temnou komoru.',
    url: '/vybaveni',
    images: [{ url: '/images/profile.jpg', width: 1200, height: 630, alt: 'Filip Rosa \u2014 Vybaven\u00ed' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Vybaven\u00ed | Filip Rosa',
    description: 'P\u0159ehled fotografick\u00e9ho vybaven\u00ed \u2014 od t\u011bl fotoapar\u00e1t\u016f po temnou komoru.',
  },
  alternates: { canonical: '/vybaveni' },
}

export default function VybaveniLayout({ children }: { children: React.ReactNode }) {
  return children
}
