'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useInView } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Lightbox from '@/components/Lightbox'
import { useI18n, type Locale } from '@/lib/i18n'
import { fetchGallery, galleryImageUrl, galleryThumbUrl, type GalleryAlbum, type GalleryImage } from '@/lib/cdn-api'

interface DisplayImage {
  url: string       // full-size for lightbox
  thumbUrl: string   // thumbnail for grid
  albumSlug: string
  albumTitle: string
  filename: string
  alt: string
  data: GalleryImage
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Shuffle once per source array identity (by length + first element)
function useShuffle<T extends { url: string }>(items: T[]): T[] {
  const key = items.map(i => i.url).join(',')
  const [shuffled, setShuffled] = useState<T[]>([])
  const lastKey = useRef('')

  useEffect(() => {
    if (key && key !== lastKey.current) {
      lastKey.current = key
      setShuffled(shuffle(items))
    }
  }, [key, items])

  return shuffled.length > 0 ? shuffled : items
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

  // Read album from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const albumParam = params.get('album')
    if (albumParam) setActiveAlbum(albumParam)
  }, [])

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
  const visibleAlbums = albumsWithImages.filter(a => !a.hidden)
  const displayAlbums = activeAlbum
    ? albumsWithImages.filter(a => a.slug === activeAlbum)
    : visibleAlbums

  const displayImages: DisplayImage[] = useShuffle(
    displayAlbums.flatMap(a =>
      a.images.map(img => {
        const caption = img.caption[locale as Locale]
        const albumTitle = a.title[locale as Locale]
        const alt = caption
          || (img.tags?.length ? `${img.tags.join(', ')} — ${albumTitle}` : '')
          || `${img.filename.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')} — ${albumTitle}`
        return {
          url: galleryImageUrl(a.slug, img.filename, cacheVersion),
          thumbUrl: galleryThumbUrl(a.slug, img.filename, cacheVersion),
          albumSlug: a.slug,
          albumTitle,
          filename: img.filename,
          alt,
          data: img,
        }
      })
    )
  )

  const allImageUrls = displayImages.map(d => d.url)
  const allImageAlts = displayImages.map(d => d.alt)

  const buildUrl = useCallback((album: string | null, photo?: string) => {
    const params = new URLSearchParams()
    if (album) params.set('album', album)
    if (photo) params.set('photo', photo)
    const qs = params.toString()
    return qs ? `/galerie?${qs}` : '/galerie'
  }, [])

  const updatePhotoUrl = useCallback((index: number) => {
    if (displayImages[index]) {
      const img = displayImages[index]
      window.history.replaceState(null, '', buildUrl(activeAlbum, `${img.albumSlug}/${img.filename}`))
    }
  }, [displayImages, activeAlbum, buildUrl])

  const openLightbox = (globalIndex: number) => {
    setLightboxIndex(globalIndex)
    setLightboxOpen(true)
    updatePhotoUrl(globalIndex)
  }

  const closeLightbox = () => {
    setLightboxOpen(false)
    window.history.replaceState(null, '', buildUrl(activeAlbum))
  }

  const handleAlbumChange = (slug: string | null) => {
    setActiveAlbum(slug)
    window.history.replaceState(null, '', buildUrl(slug))
  }

  // Open lightbox from URL param on load
  useEffect(() => {
    if (loading || displayImages.length === 0) return
    const params = new URLSearchParams(window.location.search)
    const photo = params.get('photo')
    if (photo) {
      const idx = displayImages.findIndex(d => `${d.albumSlug}/${d.filename}` === photo)
      if (idx >= 0) {
        setLightboxIndex(idx)
        setLightboxOpen(true)
      }
    }
  }, [loading, displayImages])

  return (
    <>
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
              className="inline-flex items-center gap-2 text-[0.8rem] text-muted hover:text-lime transition-colors duration-300 mb-8"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {t('gallery.back')}
            </a>
            <h1
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mb-4"
              style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
            >
              {t('gallery.heading')}
            </h1>
            {activeAlbum && (() => {
              const album = albumsWithImages.find(a => a.slug === activeAlbum)
              const desc = album?.description[locale as Locale]
              return desc ? (
                <p
                  className="font-body text-muted max-w-[36rem]"
                  style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
                >
                  {desc}
                </p>
              ) : null
            })()}
          </motion.div>

          {/* Loading state — skeleton */}
          {loading && (
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="break-inside-avoid mb-3">
                  <div
                    className="w-full rounded-[2px] border border-white/[0.05] bg-charcoal animate-pulse"
                    style={{ aspectRatio: [3/4, 4/3, 1, 3/4, 4/3, 1, 3/4, 4/3, 1, 3/4, 4/3, 1][i] }}
                  />
                </div>
              ))}
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
              {/* Album filter tabs — sticky below header */}
              <div className="flex flex-wrap gap-2 md:gap-3 mb-8 md:mb-12 sticky top-0 z-30 bg-dark py-3 -mx-6 px-6 lg:-mx-10 lg:px-10">
                <button
                  onClick={() => handleAlbumChange(null)}
                  className={`px-4 py-2 text-[0.8rem] font-medium tracking-[0.03em] rounded-[2px] border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime ${
                    activeAlbum === null
                      ? 'bg-lime/[0.12] border-lime/30 text-lime'
                      : 'bg-transparent border-white/[0.08] text-offwhite/40 hover:text-lime hover:border-lime/20'
                  }`}
                >
                  {t('gallery.all')}
                </button>
                {visibleAlbums.map(album => (
                  <button
                    key={album.slug}
                    onClick={() => handleAlbumChange(album.slug)}
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
                  <GalleryPhoto
                    key={item.url}
                    item={item}
                    index={i}
                    imgErrors={imgErrors}
                    setImgErrors={setImgErrors}
                    onOpen={() => openLightbox(i)}
                    alt={item.alt}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />

      <Lightbox
        images={allImageUrls}
        alts={allImageAlts}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onPrev={() => {
          const next = (lightboxIndex - 1 + allImageUrls.length) % allImageUrls.length
          setLightboxIndex(next)
          updatePhotoUrl(next)
        }}
        onNext={() => {
          const next = (lightboxIndex + 1) % allImageUrls.length
          setLightboxIndex(next)
          updatePhotoUrl(next)
        }}
      />
    </>
  )
}

function GalleryPhoto({ item, index, imgErrors, setImgErrors, onOpen, alt }: {
  item: DisplayImage
  index: number
  imgErrors: Record<string, boolean>
  setImgErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
  onOpen: () => void
  alt: string
}) {
  const [loaded, setLoaded] = useState(false)

  return (
    <div className="break-inside-avoid mb-3">
      <button
        onClick={() => !imgErrors[item.url] && onOpen()}
        className="relative w-full overflow-hidden rounded-[2px] border border-white/[0.05] bg-charcoal group cursor-pointer block focus-visible:outline-2 focus-visible:outline-lime"
      >
        {imgErrors[item.url] ? (
          <div className="aspect-[4/3] flex items-center justify-center">
            <svg className="w-10 h-10 text-muted/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
            </svg>
          </div>
        ) : (
          <>
            {/* Skeleton shown until loaded */}
            {!loaded && (
              <div className="aspect-[4/3] bg-charcoal animate-pulse" />
            )}
            <img
              src={imgErrors[item.thumbUrl] ? item.url : item.thumbUrl}
              alt={alt}
              className={`w-full h-auto block transition-opacity duration-500 ease-out ${loaded ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
              loading="lazy"
              onLoad={() => setLoaded(true)}
              onError={() => {
                if (!imgErrors[item.thumbUrl]) {
                  setImgErrors((p: Record<string, boolean>) => ({ ...p, [item.thumbUrl]: true }))
                } else {
                  setImgErrors((p: Record<string, boolean>) => ({ ...p, [item.url]: true }))
                }
              }}
            />
          </>
        )}
        {/* Analog badge */}
        {item.data.analog && (
          <span className="absolute top-2 right-2 z-10 w-5 h-5 flex items-center justify-center text-[0.55rem] font-semibold tracking-[0.05em] uppercase bg-dark/70 text-offwhite/50 rounded-[2px] backdrop-blur-sm" title="Analog photo">
            A
          </span>
        )}
        {/* Year badge */}
        {item.data.year && (
          <span className="absolute bottom-2 right-2 z-10 px-1.5 py-0.5 text-[0.55rem] font-medium bg-dark/70 text-offwhite/50 rounded-full backdrop-blur-sm">
            {item.data.year}
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
    </div>
  )
}
