'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import GrainOverlay from '@/components/GrainOverlay'
import Lightbox from '@/components/Lightbox'
import { useI18n, type Locale } from '@/lib/i18n'
import { fetchGallery, galleryImageUrl, galleryThumbUrl, type GalleryAlbum, type GalleryImage } from '@/lib/cdn-api'

interface DisplayImage {
  url: string       // full-size for lightbox
  thumbUrl: string   // thumbnail for grid
  data: GalleryImage
}

export default function GaleriePage() {
  const { locale, t } = useI18n()
  const [albums, setAlbums] = useState<GalleryAlbum[]>([])
  const [cacheVersion, setCacheVersion] = useState<number | undefined>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeAlbum, setActiveAlbum] = useState<string | null>(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -30px 0px' })

  useEffect(() => {
    fetchGallery()
      .then(data => {
        setAlbums(data.albums)
        setCacheVersion(data.updatedAt)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  const albumsWithImages = albums.filter(a => a.images.length > 0)
  const displayAlbums = activeAlbum
    ? albumsWithImages.filter(a => a.slug === activeAlbum)
    : albumsWithImages

  const displayImages: DisplayImage[] = displayAlbums.flatMap(a =>
    a.images.map(img => ({
      url: galleryImageUrl(a.slug, img.filename, cacheVersion),
      thumbUrl: galleryThumbUrl(a.slug, img.filename, cacheVersion),
      data: img,
    }))
  )

  const allImageUrls = displayImages.map(d => d.url)

  const openLightbox = (globalIndex: number) => {
    setLightboxIndex(globalIndex)
    setLightboxOpen(true)
  }

  return (
    <>
      <GrainOverlay />
      <Navigation />

      <main className="min-h-dvh pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          {/* Back link */}
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 32 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-8"
          >
            <a
              href="/"
              className="inline-flex items-center gap-2 text-[0.8rem] text-muted hover:text-lime transition-colors duration-300"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {t('gallery.back')}
            </a>
          </motion.div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-lime/20 border-t-lime/60 rounded-full animate-spin" />
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="py-20 text-center">
              <p className="text-muted text-[0.9rem]">{locale === 'cs' ? 'Nepodařilo se načíst galerii.' : 'Failed to load gallery.'}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Album filter tabs */}
              <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-12">
                <button
                  onClick={() => setActiveAlbum(null)}
                  className={`px-4 py-2 text-[0.8rem] font-medium tracking-[0.03em] rounded-[2px] border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime ${
                    activeAlbum === null
                      ? 'bg-lime/[0.12] border-lime/30 text-lime'
                      : 'bg-transparent border-white/[0.08] text-offwhite/40 hover:text-lime hover:border-lime/20'
                  }`}
                >
                  {t('gallery.all')}
                </button>
                {albumsWithImages.map(album => (
                  <button
                    key={album.slug}
                    onClick={() => setActiveAlbum(album.slug)}
                    className={`px-4 py-2 text-[0.8rem] font-medium tracking-[0.03em] rounded-[2px] border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime ${
                      activeAlbum === album.slug
                        ? 'bg-lime/[0.12] border-lime/30 text-lime'
                        : 'bg-transparent border-white/[0.08] text-offwhite/40 hover:text-lime hover:border-lime/20'
                    }`}
                  >
                    {album.title[locale as Locale]}
                  </button>
                ))}
              </div>

              {/* Photo grid - masonry-like with columns */}
              <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
                {displayImages.map((item, i) => (
                  <motion.div
                    key={item.url}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: Math.min(i * 0.03, 0.5), ease: [0.16, 1, 0.3, 1] }}
                    className="break-inside-avoid mb-3"
                  >
                    <button
                      onClick={() => !imgErrors[item.url] && openLightbox(i)}
                      className="relative w-full overflow-hidden rounded-[2px] border border-white/[0.05] bg-charcoal group cursor-pointer block focus-visible:outline-2 focus-visible:outline-lime"
                    >
                      {imgErrors[item.url] ? (
                        <div className="aspect-[4/3] flex items-center justify-center">
                          <svg className="w-10 h-10 text-muted/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                          </svg>
                        </div>
                      ) : (
                        <img
                          src={imgErrors[item.thumbUrl] ? item.url : item.thumbUrl}
                          alt=""
                          className="w-full h-auto block"
                          loading="lazy"
                          onError={() => {
                            if (!imgErrors[item.thumbUrl]) {
                              // Thumb failed — fallback to full-size
                              setImgErrors(p => ({ ...p, [item.thumbUrl]: true }))
                            } else {
                              // Full-size also failed
                              setImgErrors(p => ({ ...p, [item.url]: true }))
                            }
                          }}
                        />
                      )}
                      {/* Analog badge */}
                      {item.data.analog && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[0.55rem] font-semibold tracking-[0.05em] uppercase bg-dark/70 text-offwhite/50 rounded-[2px] pointer-events-none backdrop-blur-sm" title="Analog">
                          A
                        </span>
                      )}
                      {/* Overlay */}
                      <div
                        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                        style={{
                          background: 'linear-gradient(to top, rgba(19,16,16,0.5), transparent 50%)',
                        }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'rgba(42,18,21,0.1)',
                          mixBlendMode: 'multiply',
                        }}
                      />
                    </button>
                  </motion.div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      <Lightbox
        images={allImageUrls}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        onPrev={() => setLightboxIndex(prev => (prev - 1 + allImageUrls.length) % allImageUrls.length)}
        onNext={() => setLightboxIndex(prev => (prev + 1) % allImageUrls.length)}
      />
    </>
  )
}
