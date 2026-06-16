'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useI18n, type Locale } from '@/lib/i18n'
import { fetchGraphics, graphicsAssetUrl, type GraphicsItem } from '@/lib/cdn-api'

const ease = [0.16, 1, 0.3, 1] as const

export default function GrafikaPage() {
  const { t, locale } = useI18n()
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -30px 0px' })
  const [items, setItems] = useState<GraphicsItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchGraphics()
      .then(m => { setItems(m.items ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  return (
    <>
      <Navigation />

      <main className="min-h-dvh pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 32 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease }}
            className="mb-12"
          >
            <a
              href="/"
              className="inline-flex items-center gap-2 text-[0.8rem] text-muted hover:text-lime transition-colors duration-300 mb-8"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {t('graphics.back')}
            </a>
            <h1
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mb-5"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {t('graphics.heading')}
            </h1>
            <p
              className="font-body text-muted max-w-[36rem]"
              style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
            >
              {t('graphics.description')}
            </p>
          </motion.div>

          {!loaded ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-lime/20 border-t-lime/60 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="font-body text-muted text-center py-20">
              {t('graphics.empty')}
            </p>
          ) : (
            <div className="flex flex-col gap-5">
              {items.map((item, i) => (
                <GraphicCard key={item.id} item={item} index={i} locale={locale as Locale} t={t} />
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

function GraphicCard({
  item,
  index,
  locale,
  t,
}: {
  item: GraphicsItem
  index: number
  locale: Locale
  t: (k: string) => string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const [imgError, setImgError] = useState(false)

  const title = item.title[locale] || item.title.cs
  const description = item.description[locale] || item.description.cs

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: Math.min(index * 0.06, 0.3), ease }}
      className="relative bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden"
      style={{ aspectRatio: '5 / 2' }}
    >
      {/* Left: image fading to the right */}
      {item.image && !imgError && (
        <>
          <img
            src={graphicsAssetUrl(item.image)}
            alt={title}
            className="absolute inset-y-0 left-0 h-full w-[55%] object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
          <div
            className="absolute inset-y-0 left-0 w-[60%] pointer-events-none"
            style={{
              background: 'linear-gradient(to right, transparent 0%, transparent 50%, rgba(var(--charcoal-rgb),0.65) 80%, var(--color-charcoal) 100%)',
            }}
          />
        </>
      )}

      {/* Content row */}
      <div className="relative h-full grid grid-cols-[1fr_auto] items-center">
        {/* Middle: title + format + description */}
        <div className="pl-[40%] pr-6 sm:pl-[45%] sm:pr-8 lg:pl-[42%] lg:pr-10">
          <h3
            className="font-display font-bold text-offwhite tracking-[-0.02em] leading-tight"
            style={{ fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)' }}
          >
            {title}
          </h3>
          {item.format && (
            <span className="inline-block mt-2 px-2 py-0.5 text-[0.62rem] font-semibold tracking-[0.1em] uppercase text-lime/80 bg-lime/[0.08] border border-lime/20 rounded-[2px]">
              {item.format}
            </span>
          )}
          {description && (
            <p className="font-body text-muted text-[0.82rem] leading-[1.6] mt-3 line-clamp-3 max-w-[36rem]">
              {description}
            </p>
          )}
        </div>

        {/* Right: download button */}
        <div className="pr-6 sm:pr-8 lg:pr-10">
          {item.file ? (
            <a
              href={graphicsAssetUrl(item.file)}
              download
              className="inline-flex items-center gap-2 px-5 py-2.5 text-[0.8rem] font-semibold tracking-[0.03em] bg-lime text-dark rounded-[2px] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(var(--lime-rgb),0.2),0_2px_8px_rgba(var(--lime-rgb),0.15)] active:translate-y-0 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-3"
            >
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
              </svg>
              {t('graphics.download')}
            </a>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}
