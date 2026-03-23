'use client'

import { useI18n } from '@/lib/i18n'

export default function MarqueeStrip() {
  const { t } = useI18n()

  const items = [
    { text: t('marquee.portrait'), variant: 'lime' },
    { text: t('marquee.product'), variant: 'dim' },
    { text: t('marquee.bw'), variant: 'lime' },
    { text: t('marquee.scan'), variant: 'dim' },
    { text: t('marquee.darkroom'), variant: 'lime' },
    { text: t('marquee.analog'), variant: 'dim' },
    { text: t('marquee.film'), variant: 'lime' },
  ]

  const doubled = [...items, ...items]

  return (
    <div className="relative overflow-hidden py-5 border-y border-white/[0.04] bg-charcoal/60">
      <div className="absolute top-0 bottom-0 left-0 w-24 z-10 pointer-events-none bg-gradient-to-r from-dark to-transparent" />
      <div className="absolute top-0 bottom-0 right-0 w-24 z-10 pointer-events-none bg-gradient-to-l from-dark to-transparent" />

      <div className="marquee-track flex items-center gap-8 whitespace-nowrap w-max">
        {doubled.map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span
              className={`font-display italic text-[1.1rem] tracking-[0.02em] ${
                item.variant === 'lime'
                  ? 'text-lime/[0.28]'
                  : 'text-offwhite/[0.12]'
              }`}
            >
              {item.text}
            </span>
            {i < doubled.length - 1 && (
              <span className="text-lime/[0.12] text-[0.8rem]">&bull;</span>
            )}
          </span>
        ))}
      </div>
    </div>
  )
}
