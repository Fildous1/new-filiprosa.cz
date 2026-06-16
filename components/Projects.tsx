'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { PROJECTS } from '@/lib/site-nav'

export default function Projects() {
  const headerRef = useRef<HTMLDivElement>(null)
  const cardsRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -30px 0px' })
  const cardsInView = useInView(cardsRef, { once: true, margin: '0px 0px -30px 0px' })
  const { t } = useI18n()

  const projects = PROJECTS.map(p => ({
    title: t(p.titleKey),
    description: t(p.descKey),
    cta: t(p.ctaKey),
    href: p.href,
    icon: p.icon,
  }))

  return (
    <section id="projekty" className="relative" style={{ padding: 'clamp(5rem, 10vw, 8rem) 0' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 50% 50% at 80% 30%, rgba(var(--lime-rgb),0.03) 0%, transparent 70%),
            radial-gradient(ellipse 40% 50% at 15% 70%, rgba(var(--darkroom-rgb),0.2) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-1 max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 32 }}
          animate={headerInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-[36rem] mb-16 md:mb-24"
        >
          <span className="section-num">{t('projects.num')}</span>
          <h2
            className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mt-6 mb-5"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            {t('projects.heading')}
          </h2>
          <p
            className="font-body text-muted"
            style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
          >
            {t('projects.description')}
          </p>
        </motion.div>

        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {projects.map((project, i) => (
            <motion.a
              key={project.href}
              href={project.href}
              initial={{ opacity: 0, y: 32 }}
              animate={cardsInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.9, delay: 0.08 * (i + 1), ease: [0.16, 1, 0.3, 1] }}
              className="group relative bg-charcoal border border-white/[0.05] rounded-[2px] p-8 lg:p-10 overflow-hidden block cursor-pointer focus-visible:outline-2 focus-visible:outline-lime"
              style={{
                transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-6px)'
                e.currentTarget.style.boxShadow = '0 4px 16px rgba(var(--lime-rgb),0.06), 0 16px 48px rgba(0,0,0,0.35)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="w-12 h-12 mb-6 flex items-center justify-center rounded-[2px] bg-lime/[0.08]">
                {project.icon}
              </div>
              <h3 className="font-display font-bold text-offwhite text-[1.35rem] tracking-[-0.02em] mb-3">
                {project.title}
              </h3>
              <p className="font-body text-muted text-[0.875rem] leading-[1.7] mb-8 max-w-[28rem]">
                {project.description}
              </p>
              <span className="inline-flex items-center gap-2 text-[0.82rem] font-semibold tracking-[0.03em] text-lime/70 group-hover:text-lime transition-colors duration-300">
                {project.cta}
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                </svg>
              </span>
            </motion.a>
          ))}
        </div>
      </div>
    </section>
  )
}
