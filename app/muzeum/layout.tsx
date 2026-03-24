import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Muzeum fo\u0165\u00e1k\u016f',
  description: 'Sb\u00edrka vintage analogov\u00fdch i digit\u00e1ln\u00edch fotoapar\u00e1t\u016f. Ka\u017ed\u00fd kus m\u00e1 sv\u016fj p\u0159\u00edb\u011bh, detailn\u00ed fotky a technick\u00e9 specifikace.',
  openGraph: {
    title: 'Muzeum fo\u0165\u00e1k\u016f | Filip Rosa',
    description: 'Sb\u00edrka vintage fotoapar\u00e1t\u016f s p\u0159\u00edb\u011bhy a technick\u00fdmi specifikacemi.',
    url: '/muzeum',
    images: [{ url: '/images/profile.jpg', width: 1200, height: 630, alt: 'Filip Rosa \u2014 Muzeum fo\u0165\u00e1k\u016f' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Muzeum fo\u0165\u00e1k\u016f | Filip Rosa',
    description: 'Sb\u00edrka vintage fotoapar\u00e1t\u016f s p\u0159\u00edb\u011bhy a technick\u00fdmi specifikacemi.',
  },
  alternates: { canonical: '/muzeum' },
}

export default function MuzeumLayout({ children }: { children: React.ReactNode }) {
  return children
}
