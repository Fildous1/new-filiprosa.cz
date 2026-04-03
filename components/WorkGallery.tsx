'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

const workItems = [
  { src: '/images/dance.jpg', alt: 'Event photography', label: 'Event' },
  { src: '/images/darkroom-1.jpg', alt: 'Darkroom enlarger', label: 'Darkroom' },
  { src: '/images/negative-1.jpg', alt: 'B&W architecture', label: 'Film B&W' },
  { src: '/images/digital-1.jpg', alt: 'Night atmosphere', label: 'Digital' },
  { src: '/images/negative-2.jpg', alt: 'Landscape on film', label: 'Film' },
]

export default function WorkGallery() {
  const { t } = useI18n()
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -60px 0px' })

  return (
    <section id="prace" className="relative" style={{ padding: 'clamp(5rem, 10vw, 8rem) 0' }}>
      {/* Section glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 50% 50% at 80% 30%, rgba(var(--darkroom-rgb),0.25) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 70%, rgba(var(--lime-rgb),0.03) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-[1] max-w-[1200px] mx-auto px-6 lg:px-10">
        {/* Header */}
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 32 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[36rem] mb-16 md:mb-24"
        >
          <span className="section-num">{t('work.num')}</span>
          <h2
            className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mb-5"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            {t('work.heading')}
          </h2>
          <p
            className="font-body text-muted"
            style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
          >
            {t('work.description')}
          </p>
        </motion.div>

        {/* Asymmetric Grid */}
        <div className="work-grid">
          {workItems.map((item, i) => (
            <WorkItem key={item.src} item={item} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function WorkItem({ item, index }: { item: typeof workItems[number]; index: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: 0.08 * (index + 1), ease: [0.16, 1, 0.3, 1] }}
      className={`work-item${index === 0 ? ' work-item-hero' : ''}`}
    >
      <img
        src={item.src}
        alt={item.alt}
        className="w-full h-full object-cover transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)]"
        loading="lazy"
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(to top, rgba(var(--warmblack-rgb),0.5) 0%, transparent 50%)',
          mixBlendMode: 'multiply',
        }}
      />
      <span className="work-item-label">{item.label}</span>
    </motion.div>
  )
}
