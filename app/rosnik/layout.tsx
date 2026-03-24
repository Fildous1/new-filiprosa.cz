import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nerovn\u00fd Rosn\u00edk',
  description: 'Nerovn\u00fd Rosn\u00edk \u2014 \u010dasopis s \u00favahami, \u010dl\u00e1nky, b\u00e1sni\u010dkami a k\u0159\u00ed\u017eovkami. PDF verze ke sta\u017een\u00ed a prohl\u00ed\u017een\u00ed online.',
  openGraph: {
    title: 'Nerovn\u00fd Rosn\u00edk | Filip Rosa',
    description: '\u010casopis s \u00favahami, \u010dl\u00e1nky, b\u00e1sni\u010dkami a k\u0159\u00ed\u017eovkami.',
    url: '/rosnik',
    images: [{ url: '/images/rosnik.png', width: 1200, height: 630, alt: 'Nerovn\u00fd Rosn\u00edk' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nerovn\u00fd Rosn\u00edk | Filip Rosa',
    description: '\u010casopis s \u00favahami, \u010dl\u00e1nky, b\u00e1sni\u010dkami a k\u0159\u00ed\u017eovkami.',
    images: ['/images/rosnik.png'],
  },
  alternates: { canonical: '/rosnik' },
}

export default function RosnikLayout({ children }: { children: React.ReactNode }) {
  return children
}
