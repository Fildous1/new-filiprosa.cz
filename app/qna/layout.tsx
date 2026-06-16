import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Časté dotazy',
  description: 'Odpovědi na nejčastější dotazy ohledně mých služeb — focení, vyvolávání, skenování a tisku.',
  openGraph: {
    title: 'Časté dotazy | Filip Rosa',
    description: 'Odpovědi na nejčastější dotazy ohledně mých služeb.',
    url: '/qna',
    images: [{ url: '/images/profile.jpg', width: 1200, height: 630, alt: 'Filip Rosa — Časté dotazy' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Časté dotazy | Filip Rosa',
    description: 'Odpovědi na nejčastější dotazy ohledně mých služeb.',
  },
  alternates: { canonical: '/qna' },
}

export default function QnaLayout({ children }: { children: React.ReactNode }) {
  return children
}
