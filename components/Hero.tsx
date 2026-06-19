'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { fetchSite, siteImageUrl, type SiteManifest } from '@/lib/cdn-api'
import ResponsiveImage from '@/components/ResponsiveImage'

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

  // Custom landing image (set in admin) overrides the optimized default below.
  const customBg = site?.landingImage ? siteImageUrl(site.landingImage) : null
  const titleLine1 = (locale === 'cs' ? site?.heroLine1Cs : site?.heroLine1En) || t('hero.title.line1')
  const titleLine2 = (locale === 'cs' ? site?.heroLine2Cs : site?.heroLine2En) || t('hero.title.line2')
  const heroDesc = (locale === 'cs' ? site?.heroDescCs : site?.heroDescEn) || t('hero.description')

  return (
    <header className="relative min-h-dvh flex flex-col overflow-hidden pt-16">
      {/* Background Image — fills entire hero, no filters. This is the LCP
          element, so the default ships as a preloaded, responsive AVIF/WebP. */}
      {customBg ? (
        <img
          src={customBg}
          alt=""
          fetchPriority="high"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      ) : (
        <ResponsiveImage
          name="hero"
          widths={[640, 960, 1280, 1920, 2560]}
          fallbackWidth={1920}
          alt=""
          sizes="100vw"
          width={1600}
          height={900}
          priority
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
      )}

      {/* Horizontal gradient only — fades from dark (behind the text) to
          transparent toward the right, keeping the text readable. */}
      <div
        className="absolute inset-0 z-0 hidden md:block"
        style={{
          background: `linear-gradient(to right, rgba(var(--dark-rgb),0.92) 0%, rgba(var(--dark-rgb),0.75) 30%, rgba(var(--dark-rgb),0.35) 60%, transparent 100%)`,
        }}
      />
      {/* On mobile there's no room for the horizontal fade — use a flat ~70% darkening */}
      <div
        className="absolute inset-0 z-0 md:hidden"
        style={{ background: `rgba(var(--dark-rgb),0.7)` }}
      />

      {/* Hero Content — Left aligned */}
      <div className="relative z-10 flex-1 flex items-center">
        <div className="w-full px-6 md:px-[10%]">
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
