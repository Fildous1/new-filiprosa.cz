'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.15 + 0.1,
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1] as const,
    },
  }),
}

export default function Hero() {
  const [scrolled, setScrolled] = useState(false)
  const { t } = useI18n()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="relative min-h-dvh flex flex-col overflow-hidden pt-16">
      {/* Background Image — fills entire hero, no filters */}
      <img
        src="/images/dance.jpg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Dark overlay so text remains readable — stronger on mobile */}
      <div
        className="absolute inset-0 z-0 hidden md:block"
        style={{
          background: `
            linear-gradient(to right, rgba(19,16,16,0.92) 0%, rgba(19,16,16,0.8) 25%, rgba(19,16,16,0.45) 50%, rgba(19,16,16,0.15) 75%, transparent 100%),
            linear-gradient(to bottom, rgba(19,16,16,0.5) 0%, transparent 30%, transparent 65%, rgba(19,16,16,0.95) 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0 z-0 md:hidden"
        style={{
          background: `
            linear-gradient(to bottom, rgba(19,16,16,0.7) 0%, rgba(19,16,16,0.5) 40%, rgba(19,16,16,0.6) 70%, rgba(19,16,16,0.95) 100%)
          `,
        }}
      />

      {/* Hero Content — Left aligned */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 w-full">
          <div className="max-w-[36rem]">
            <motion.h1
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-display font-bold text-offwhite leading-[1.08] tracking-[-0.03em] mb-6"
              style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)' }}
            >
              <em className="italic">{t('hero.title.line1')}</em>
              <br />
              {t('hero.title.line2')}
            </motion.h1>

            <motion.p
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-body text-offwhite/60 max-w-[30rem] mb-12"
              style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.125rem)' }}
            >
              {t('hero.description')}
            </motion.p>

            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <a
                href="#sluzby"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-[0.85rem] font-semibold tracking-[0.03em] bg-lime text-dark rounded-[2px] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(181,202,44,0.2),0_2px_8px_rgba(181,202,44,0.15)] active:translate-y-0 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-3"
              >
                {t('hero.cta.services')}
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                </svg>
              </a>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        custom={3}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 transition-opacity duration-500"
        style={{ opacity: scrolled ? 0 : 1, pointerEvents: scrolled ? 'none' : 'auto' }}
      >
        <span className="font-body text-[0.65rem] tracking-[0.2em] uppercase text-muted/45">
          {t('hero.scroll')}
        </span>
        <div
          className="scroll-line w-px h-10"
          style={{ background: 'linear-gradient(to bottom, rgba(181,202,44,0.3), transparent)' }}
        />
      </motion.div>
    </header>
  )
}
