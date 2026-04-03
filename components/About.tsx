'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

export default function About() {
  const photoRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)
  const photoInView = useInView(photoRef, { once: true, margin: '0px 0px -30px 0px' })
  const textInView = useInView(textRef, { once: true, margin: '0px 0px -30px 0px' })
  const statsInView = useInView(statsRef, { once: true, margin: '0px 0px -30px 0px' })
  const { t } = useI18n()

  return (
    <section id="o-mne" className="relative" style={{ padding: 'clamp(5rem, 10vw, 8rem) 0' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 50% 50% at 70% 60%, rgba(var(--lime-rgb),0.03) 0%, transparent 70%),
            radial-gradient(ellipse 40% 40% at 10% 30%, rgba(var(--darkroom-rgb),0.2) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-1 max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
          {/* Photo */}
          <motion.div
            ref={photoRef}
            initial={{ opacity: 0, y: 32 }}
            animate={photoInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5"
          >
            <div className="relative">
              <div className="relative aspect-[3/4] bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden">
                <img
                  src="/images/profile.jpg"
                  alt="Filip Rosa"
                  className="w-full h-full object-cover"
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, rgba(var(--dark-rgb),0.6), transparent 60%)',
                  }}
                />
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'rgba(var(--darkroom-rgb),0.15)',
                    mixBlendMode: 'multiply',
                  }}
                />
              </div>
              <div className="absolute -bottom-3 -right-3 w-full h-full border border-lime/[0.07] rounded-[2px] -z-1" />
              <div className="absolute -top-2 -left-2 w-6 h-6 border-t border-l border-lime/[0.2]" />
            </div>
          </motion.div>

          {/* Text */}
          <div className="lg:col-span-7">
            <motion.div
              ref={textRef}
              initial={{ opacity: 0, y: 32 }}
              animate={textInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="section-num">{t('about.num')}</span>
              <h2
                className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mt-8 mb-6"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
              >
                {t('about.heading')}
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 32 }}
              animate={textInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
            >
              <p
                className="font-body text-muted mb-5"
                style={{ fontSize: 'clamp(0.9rem, 1.4vw, 1.02rem)' }}
              >
                {t('about.p1')}
              </p>
              <p
                className="font-body text-muted mb-5"
                style={{ fontSize: 'clamp(0.9rem, 1.4vw, 1.02rem)' }}
              >
                {t('about.p2')}
              </p>
            </motion.div>

            <motion.div
              ref={statsRef}
              initial={{ opacity: 0, y: 32 }}
              animate={statsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="grid grid-cols-3 gap-4 md:gap-6 mt-10 pt-8 border-t border-white/[0.06]"
            >
              {[
                { value: t('about.stat1.value'), label: t('about.stat1.label') },
                { value: t('about.stat2.value'), label: t('about.stat2.label') },
                { value: t('about.stat3.value'), label: t('about.stat3.label') },
              ].map((stat) => (
                <div key={stat.label}>
                  <div
                    className="font-display font-bold text-lime tracking-[-0.03em]"
                    style={{ fontSize: 'clamp(1.5rem, 3vw, 1.875rem)' }}
                  >
                    {stat.value}
                  </div>
                  <div className="font-body text-muted text-[0.75rem] mt-1 tracking-[0.03em]">
                    {stat.label}
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
