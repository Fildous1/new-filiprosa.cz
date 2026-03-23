'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { fetchGallery, galleryImageUrl, galleryThumbUrl, type GalleryAlbum, type GalleryImage } from '@/lib/cdn-api'

interface FeaturedItem {
  src: string       // full-size
  thumbSrc: string  // thumbnail
  alt: string
  albumTitle: string
  albumSlug: string
  filename: string
}

export default function FeaturedPhotos() {
  const { locale, t } = useI18n()
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -60px 0px' })
  const [items, setItems] = useState<FeaturedItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetchGallery()
      .then(data => {
        const v = data.updatedAt
        const featured: FeaturedItem[] = []
        for (const album of data.albums) {
          for (const img of album.images) {
            if (img.featured) {
              featured.push({
                src: galleryImageUrl(album.slug, img.filename, v),
                thumbSrc: galleryThumbUrl(album.slug, img.filename, v),
                alt: img.caption[locale as 'cs' | 'en'] || img.filename,
                albumTitle: album.title[locale as 'cs' | 'en'],
                albumSlug: album.slug,
                filename: img.filename,
              })
            }
          }
        }
        // Shuffle for random order each visit
        for (let i = featured.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [featured[i], featured[j]] = [featured[j], featured[i]]
        }
        setItems(featured)
        setLoaded(true)
      })
      .catch(() => {
        setLoaded(true)
      })
  }, [locale])

  const openInGallery = (item: FeaturedItem) => {
    window.location.href = `/galerie?photo=${encodeURIComponent(item.albumSlug + '/' + item.filename)}`
  }

  if (loaded && items.length === 0) return null

  return (
    <section id="prace" className="relative" style={{ padding: 'clamp(5rem, 10vw, 8rem) 0' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 50% 50% at 80% 30%, rgba(42,18,21,0.25) 0%, transparent 70%),
            radial-gradient(ellipse 60% 40% at 20% 70%, rgba(181,202,44,0.03) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-[1] max-w-[1200px] mx-auto px-6 lg:px-10">
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

        {!loaded ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-lime/20 border-t-lime/60 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
            {items.map((item, i) => (
              <FeaturedItem key={item.src} item={item} index={i} hasError={!!imgErrors[item.src]} onError={() => setImgErrors(p => ({ ...p, [item.src]: true }))} onClick={() => openInGallery(item)} />
            ))}
          </div>
        )}

        {loaded && items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-12 text-center"
          >
            <a
              href="/galerie"
              className="inline-flex items-center gap-2 text-[0.85rem] font-semibold tracking-[0.03em] text-lime/70 hover:text-lime transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-3"
            >
              {locale === 'cs' ? 'Zobrazit celou galerii' : 'View full gallery'}
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </a>
          </motion.div>
        )}
      </div>
    </section>
  )
}

function FeaturedItem({ item, index, hasError, onError, onClick }: { item: FeaturedItem; index: number; hasError: boolean; onError: () => void; onClick: () => void }) {
  const [thumbFailed, setThumbFailed] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, delay: 0.08 * (index + 1), ease: [0.16, 1, 0.3, 1] }}
      className="break-inside-avoid mb-3"
    >
      <button
        onClick={onClick}
        className="relative block w-full overflow-hidden rounded-[2px] border border-white/[0.05] bg-charcoal group cursor-pointer"
      >
        {hasError ? (
          <div className="aspect-[4/3] flex items-center justify-center bg-charcoal">
            <svg className="w-10 h-10 text-muted/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        ) : (
          <img
            src={thumbFailed ? item.src : item.thumbSrc}
            alt={item.alt}
            className="w-full h-auto block transition-transform duration-600 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.03]"
            loading="lazy"
            onError={() => {
              if (!thumbFailed) setThumbFailed(true)
              else onError()
            }}
          />
        )}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'linear-gradient(to top, rgba(19,16,16,0.5) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'rgba(42,18,21,0.1)',
            mixBlendMode: 'multiply',
          }}
        />
        <span className="absolute bottom-3 left-3 z-2 font-body text-[0.7rem] font-medium tracking-[0.1em] uppercase text-offwhite/60 bg-[rgba(19,16,16,0.5)] backdrop-blur-[8px] px-2 py-1 rounded-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {item.albumTitle}
        </span>
      </button>
    </motion.div>
  )
}
