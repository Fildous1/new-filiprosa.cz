'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Contact from '@/components/Contact'
import { useI18n, type Locale } from '@/lib/i18n'
import { fetchPricelist, pricelistImageUrl, type PricelistManifest, type PricelistPhotoItem, type PricelistSection } from '@/lib/cdn-api'

const ease = [0.16, 1, 0.3, 1] as const

// Gallery album slug shown by the "Ukázky" button on each photography card.
const PHOTO_GALLERY_SLUG: Record<string, string> = {
  portrait: 'portraits',
  event: 'event',
  product: 'product',
}

// Fallback content — used when no CDN manifest is present.
function fallbackManifest(t: (k: string) => string): PricelistManifest {
  // Note: keys are read once for each locale via the rendered t() — this fallback
  // only supplies neutral i18n-key based placeholders so the page never breaks.
  // The admin panel overwrites this with real {cs,en} content.
  return {
    photography: [
      { key: 'portrait', name: { cs: '', en: '' }, price: { cs: '', en: '' }, note: { cs: '', en: '' }, description: { cs: '', en: '' } },
      { key: 'event', name: { cs: '', en: '' }, price: { cs: '', en: '' }, note: { cs: '', en: '' }, description: { cs: '', en: '' } },
      { key: 'product', name: { cs: '', en: '' }, price: { cs: '', en: '' }, note: { cs: '', en: '' }, description: { cs: '', en: '' } },
    ],
    technical: {
      title: { cs: 'Technické služby', en: 'Technical services' },
      items: [
        { name: { cs: 'Sken 1× 135/120', en: 'Scan 1× 135/120' }, note: { cs: '3500 dpi (24×36 mm ≈ 3600×5400 px, 60×60 mm ≈ 8000×8000 px)', en: '3500 dpi (24×36 mm ≈ 3600×5400 px, 60×60 mm ≈ 8000×8000 px)' }, price: { cs: '150 Kč', en: '150 CZK' } },
        { name: { cs: 'Vyvolání 1× ČB 135/120', en: 'Development 1× B&W 135/120' }, note: { cs: '', en: '' }, price: { cs: '100 Kč', en: '100 CZK' } },
        { name: { cs: 'Vyvolání + sken 1× ČB 135/120', en: 'Development + scan 1× B&W 135/120' }, note: { cs: '', en: '' }, price: { cs: '200 Kč', en: '200 CZK' } },
        { name: { cs: 'Tisk 1 fotka', en: 'Print 1 photo' }, note: { cs: '', en: '' }, price: { cs: '10 Kč', en: '10 CZK' } },
      ],
    },
    extras: {
      title: { cs: 'Doplňkové služby', en: 'Extras' },
      items: [
        { name: { cs: 'ČB film (36 sn.)', en: 'B&W film (36 exp.)' }, note: { cs: '', en: '' }, price: { cs: '130 Kč', en: '130 CZK' } },
        { name: { cs: 'Barevný film (36 sn.)', en: 'Color film (36 exp.)' }, note: { cs: '', en: '' }, price: { cs: '320 Kč', en: '320 CZK' } },
        { name: { cs: 'Flash disk', en: 'USB drive' }, note: { cs: '16 / 32 / 64 GB', en: '16 / 32 / 64 GB' }, price: { cs: '240 / 300 / 380 Kč', en: '240 / 300 / 380 CZK' } },
        { name: { cs: 'Nahrání na cloud', en: 'Cloud upload' }, note: { cs: '', en: '' }, price: { cs: 'zdarma', en: 'free' } },
      ],
    },
    travel: { cs: 'Brno a Vyškov zdarma, jinde 12 Kč/km.', en: 'Brno and Vyškov free, elsewhere 12 CZK/km.' },
  }
}

// Build the default photography card from i18n keys when the manifest item is empty.
function photoFallback(item: PricelistPhotoItem, t: (k: string) => string, locale: Locale): {
  name: string; price: string; note: string; description: string
} {
  const name = item.name[locale]?.trim() || t(`pricelist.${item.key}.name`)
  const price = item.price[locale]?.trim() || t(`pricelist.${item.key}.price`)
  const note = item.note[locale]?.trim() || t(`pricelist.${item.key}.note`)
  const description = item.description[locale]?.trim() || t(`pricelist.${item.key}.desc`)
  return { name, price, note, description }
}

export default function CenikPage() {
  const { t, locale } = useI18n()
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -30px 0px' })
  const [data, setData] = useState<PricelistManifest | null>(null)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    fetchPricelist()
      .then(m => { setData(m); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  const manifest = data ?? fallbackManifest(t)

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
            className="mb-10"
          >
            <a
              href="/"
              className="inline-flex items-center gap-2 text-[0.8rem] text-muted hover:text-lime transition-colors duration-300"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {t('pricelist.back')}
            </a>
          </motion.div>

          {/* Photography — 3 large cards, equal height, side by side */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 items-stretch">
            {manifest.photography.map((item, i) => (
              <PhotoCard key={item.key} item={item} index={i} loaded={loaded} t={t} locale={locale as Locale} />
            ))}
          </div>

          {/* Technical + Extras side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SmallTile section={manifest.technical} index={0} locale={locale as Locale} />
            <SmallTile
              section={manifest.extras}
              index={1}
              locale={locale as Locale}
              footer={
                <p className="mt-4 pt-4 border-t border-white/[0.04] text-center text-[0.72rem] text-muted/70 italic">
                  {manifest.travel[locale as Locale]?.trim() || t('pricelist.travel')}
                </p>
              }
            />
          </div>
        </div>
      </main>

      <div className="film-strip" />

      <Contact hideSectionNum />

      <Footer />
    </>
  )
}

function PhotoCard({
  item,
  index,
  loaded,
  t,
  locale,
}: {
  item: PricelistPhotoItem
  index: number
  loaded: boolean
  t: (k: string) => string
  locale: Locale
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const [imgError, setImgError] = useState(false)
  const { name, price, note, description } = photoFallback(item, t, locale)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.08, ease }}
      className="flex"
    >
      <div className="bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden flex flex-col w-full">
        {/* Image */}
        <div className="relative w-full aspect-[4/3] bg-warmblack overflow-hidden">
          {item.image && !imgError ? (
            <img
              src={pricelistImageUrl(item.image)}
              alt={name}
              className="absolute inset-0 w-full h-full object-cover"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : loaded ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-10 h-10 text-muted/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
              </svg>
            </div>
          ) : null}
        </div>

        {/* Body */}
        <div className="p-6 lg:p-7 flex flex-col flex-1">
          <h3 className="font-display font-bold text-offwhite text-[1.1rem] tracking-[-0.02em] mb-3">
            {name}
          </h3>
          <div className="flex items-baseline gap-2 mb-1">
            <p className="font-display font-bold text-lime tracking-[-0.01em]" style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)' }}>
              {price}
            </p>
          </div>
          {note && (
            <p className="font-body text-muted/70 text-[0.75rem] mb-4">
              {note}
            </p>
          )}
          {description && (
            <p className="font-body text-muted text-[0.82rem] leading-[1.65] pt-2">
              {description}
            </p>
          )}
          {PHOTO_GALLERY_SLUG[item.key] && (
            <a
              href={`/galerie?album=${PHOTO_GALLERY_SLUG[item.key]}`}
              className="mt-auto pt-5 inline-flex items-center gap-2 text-[0.78rem] font-semibold tracking-[0.03em] text-lime/70 hover:text-lime transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-3 self-start"
            >
              {t('pricelist.samples')}
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function SmallTile({
  section,
  index,
  locale,
  footer,
}: {
  section: PricelistSection
  index: number
  locale: Locale
  footer?: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: 0.05 + index * 0.05, ease }}
    >
      <div className="bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden h-full">
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <h2 className="font-display font-bold text-offwhite text-[1.05rem] tracking-[-0.02em]">
            {section.title[locale]}
          </h2>
        </div>
        <div className="p-5 space-y-4">
          {section.items.map((item, i) => {
            const note = item.note[locale]
            return (
              <div key={`${i}-${item.name[locale]}`} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-body text-offwhite/85 text-[0.85rem] leading-snug">
                    {item.name[locale]}
                  </p>
                  {note && (
                    <p className="font-body text-muted/60 text-[0.72rem] leading-snug mt-0.5">
                      {note}
                    </p>
                  )}
                </div>
                <p className="font-display font-semibold text-lime text-[0.9rem] whitespace-nowrap flex-shrink-0">
                  {item.price[locale]}
                </p>
              </div>
            )
          })}
          {footer}
        </div>
      </div>
    </motion.div>
  )
}
