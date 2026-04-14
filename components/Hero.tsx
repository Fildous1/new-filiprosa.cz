'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { fetchSite, siteImageUrl, type SiteManifest } from '@/lib/cdn-api'

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
  const { t, locale } = useI18n()
  const [site, setSite] = useState<SiteManifest | null>(null)

  useEffect(() => {
    fetchSite().then(setSite).catch(() => {})
  }, [])

  const bgImage = site?.landingImage ? siteImageUrl(site.landingImage) : '/images/dance.jpg'
  const titleLine1 = (locale === 'cs' ? site?.heroLine1Cs : site?.heroLine1En) || t('hero.title.line1')
  const titleLine2 = (locale === 'cs' ? site?.heroLine2Cs : site?.heroLine2En) || t('hero.title.line2')
  const heroDesc = (locale === 'cs' ? site?.heroDescCs : site?.heroDescEn) || t('hero.description')

  return (
    <header className="relative min-h-dvh flex flex-col overflow-hidden pt-16">
      {/* Background Image — fills entire hero, no filters */}
      <img
        src={bgImage}
        alt=""
        className="absolute inset-0 w-full h-full object-cover z-0"
      />

      {/* Dark overlay so text remains readable — stronger on mobile */}
      <div
        className="absolute inset-0 z-0 hidden md:block"
        style={{
          background: `
            linear-gradient(to right, rgba(var(--dark-rgb),0.92) 0%, rgba(var(--dark-rgb),0.8) 25%, rgba(var(--dark-rgb),0.45) 50%, rgba(var(--dark-rgb),0.15) 75%, transparent 100%),
            linear-gradient(to bottom, rgba(var(--dark-rgb),0.5) 0%, transparent 30%, transparent 65%, rgba(var(--dark-rgb),0.95) 100%)
          `,
        }}
      />
      <div
        className="absolute inset-0 z-0 md:hidden"
        style={{
          background: `
            linear-gradient(to bottom, rgba(var(--dark-rgb),0.7) 0%, rgba(var(--dark-rgb),0.5) 40%, rgba(var(--dark-rgb),0.6) 70%, rgba(var(--dark-rgb),0.95) 100%)
          `,
        }}
      />

      {/* Hero Content — Left aligned */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10 w-full">
          <div className="max-w-[36rem]">

            {/* ── SVG filter: fractal-noise displacement (rustic texture) + lime glow ── */}
            <svg aria-hidden="true" style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}>
              <defs>
                <filter id="hero-text-fx" x="-8%" y="-25%" width="116%" height="150%">
                  {/* Glow: blur source, recolour to lime, merge under sharp original */}
                  <feGaussianBlur in="SourceGraphic" stdDeviation="9" result="glow-blur" />
                  <feColorMatrix in="glow-blur" type="matrix"
                    values="0 0 0 0 0.23  0 0 0 0 0.77  0 0 0 0 0.26  0 0 0 0.3 0"
                    result="glow-col" />
                  <feMerge>
                    <feMergeNode in="glow-col" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
            </svg>

            <motion.h1
              custom={0}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="leading-[1.08] tracking-[-0.03em] mb-6"
              style={{ fontSize: 'clamp(2.4rem, 5.5vw, 4.5rem)' }}
            >
              {/* Serif italic line — gradient fill + rustic texture + glow */}
              <em
                className="font-display block"
                style={{
                  fontStyle: 'italic',
                  fontWeight: 400,
                  background: 'linear-gradient(150deg, #f5f0e8 5%, #c8a060 52%, #3bc442 95%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  filter: 'url(#hero-text-fx)',
                }}
              >
                {titleLine1}
              </em>

              {/* Sans-serif line */}
              <span
                className="font-body font-semibold block text-offwhite/80 mt-1"
                style={{ letterSpacing: '-0.025em' }}
              >
                {titleLine2}<span style={{ color: '#e0b05e' }}>.</span>
              </span>
            </motion.h1>

            <motion.p
              custom={1}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="font-body text-offwhite/60 max-w-[30rem] mb-12"
              style={{ fontSize: 'clamp(0.95rem, 1.8vw, 1.125rem)' }}
            >
              {heroDesc}
            </motion.p>

            <motion.div
              custom={2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
            >
              <a
                href="#prace"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 text-[0.85rem] font-semibold tracking-[0.03em] bg-lime text-dark rounded-[2px] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(var(--lime-rgb),0.2),0_2px_8px_rgba(var(--lime-rgb),0.15)] active:translate-y-0 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-3"
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

    </header>
  )
}
