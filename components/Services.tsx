'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { fetchServices, servicesImageUrl, type ServicesManifest } from '@/lib/cdn-api'

const ease = [0.16, 1, 0.3, 1] as const

interface BentoCardProps {
  title: string
  subtitle: string
  description: string
  imgPlaceholder: string
  delay: number
  darkroom?: boolean
  className?: string
}

function BentoCard({ title, subtitle, description, imgPlaceholder, delay, darkroom, className = '' }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -30px 0px' })
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay, ease }}
      className={`relative rounded-[2px] overflow-hidden cursor-default group ${className}`}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect()
        setGlowPos({ x: e.clientX - rect.left, y: e.clientY - rect.top })
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: 'var(--color-charcoal)',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: hovered ? 'translateY(-5px)' : 'translateY(0)',
        boxShadow: hovered
          ? darkroom
            ? '0 4px 20px rgba(140,40,40,0.15), 0 20px 60px rgba(0,0,0,0.4)'
            : '0 4px 20px rgba(var(--lime-rgb),0.08), 0 20px 60px rgba(0,0,0,0.4)'
          : 'none',
      }}
    >
      {/* Background image placeholder */}
      <img
        src={imgPlaceholder}
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500"
        style={{ opacity: hovered ? 0.4 : 0.15 }}
      />

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0" style={{
        background: hovered && darkroom
          ? 'linear-gradient(160deg, rgba(60,15,15,0.7) 0%, rgba(var(--charcoal-rgb),0.85) 100%)'
          : 'linear-gradient(160deg, rgba(var(--charcoal-rgb),0.5) 0%, rgba(var(--charcoal-rgb),0.85) 100%)',
        transition: 'background 0.5s ease',
      }} />

      {/* Cursor-following glow */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          left: glowPos.x,
          top: glowPos.y,
          width: 280,
          height: 280,
          transform: 'translate(-50%, -50%)',
          background: darkroom
            ? 'radial-gradient(circle, rgba(140,40,40,0.12) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(var(--lime-rgb),0.08) 0%, transparent 70%)',
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Content */}
      <div className="relative z-10 p-8 lg:p-10 flex flex-col justify-end h-full min-h-[240px]">
        <span className="font-body text-[0.7rem] font-semibold tracking-[0.12em] uppercase mb-3 transition-colors duration-400"
          style={{ color: hovered && darkroom ? 'rgba(180,80,80,0.7)' : 'rgba(var(--lime-rgb),0.5)' }}
        >
          {subtitle}
        </span>
        <h3
          className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.15] mb-3"
          style={{ fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)', fontStyle: 'italic' }}
        >
          {title}
        </h3>
        <p className="font-body text-muted text-[0.875rem] leading-[1.7] max-w-[28rem]">
          {description}
        </p>
      </div>
    </motion.div>
  )
}

export default function Services() {
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -30px 0px' })
  const { t } = useI18n()
  const [cdnImages, setCdnImages] = useState<ServicesManifest>({ images: {} })

  useEffect(() => {
    fetchServices().then(setCdnImages).catch(() => {})
  }, [])

  return (
    <section id="sluzby" className="relative" style={{ padding: 'clamp(5rem, 10vw, 8rem) 0' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 60% 50% at 20% 80%, rgba(var(--lime-rgb),0.03) 0%, transparent 70%),
            radial-gradient(ellipse 50% 60% at 90% 20%, rgba(var(--darkroom-rgb),0.2) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-1 max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 32 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease }}
          className="max-w-[36rem] mb-16 md:mb-24"
        >
          <span className="section-num">{t('services.num')}</span>
          <h2
            className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mt-6 mb-5"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            {t('services.heading')}
          </h2>
          <p
            className="font-body text-muted"
            style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
          >
            {t('services.description')}
          </p>
        </motion.div>

        {/* Bento grid — asymmetric layout */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Capture — tall, spans 2 rows on large */}
          <BentoCard
            title={t('services.capture.title')}
            subtitle={t('services.capture.subtitle')}
            description={t('services.capture.desc')}
            imgPlaceholder={cdnImages.images.capture ? servicesImageUrl(cdnImages.images.capture) : '/images/services/capture.jpg'}
            delay={0.08}
            className="lg:row-span-2"
          />
          {/* Card 2: Processing */}
          <BentoCard
            title={t('services.processing.title')}
            subtitle={t('services.processing.subtitle')}
            description={t('services.processing.desc')}
            imgPlaceholder={cdnImages.images.processing ? servicesImageUrl(cdnImages.images.processing) : '/images/services/processing.jpg'}
            delay={0.16}
          />
          {/* Card 3: Prints — darkroom red on hover */}
          <BentoCard
            title={t('services.prints.title')}
            subtitle={t('services.prints.subtitle')}
            description={t('services.prints.desc')}
            imgPlaceholder={cdnImages.images.prints ? servicesImageUrl(cdnImages.images.prints) : '/images/services/prints.jpg'}
            delay={0.24}
            darkroom
          />
          {/* Card 4: Digitalization — spans 2 columns on large */}
          <BentoCard
            title={t('services.digital.title')}
            subtitle={t('services.digital.subtitle')}
            description={t('services.digital.desc')}
            imgPlaceholder={cdnImages.images.digital ? servicesImageUrl(cdnImages.images.digital) : '/images/services/digital.jpg'}
            delay={0.32}
            className="sm:col-span-2"
          />
        </div>
      </div>
    </section>
  )
}
