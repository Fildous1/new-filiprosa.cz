'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import GrainOverlay from '@/components/GrainOverlay'
import { useI18n, type Locale } from '@/lib/i18n'
import { fetchMuseum, museumImageUrl, type Camera } from '@/lib/cdn-api'
import Lightbox from '@/components/Lightbox'

function getIdFromUrl(): number | null {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  const id = params.get('id')
  return id ? Number(id) : null
}

export default function MuzeumPage() {
  const { locale, t } = useI18n()
  const [cameras, setCameras] = useState<Camera[]>([])
  const [cameraTypes, setCameraTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<string | null>(null)
  const [selectedCameraId, setSelectedCameraId] = useState<number | null>(null)
  const [imageLoaded, setImageLoaded] = useState<Record<number, boolean>>({})
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({})
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -30px 0px' })

  useEffect(() => {
    fetchMuseum()
      .then(data => {
        setCameras(data.cameras)
        setCameraTypes(data.cameraTypes)
        setLoading(false)

        // Check URL for camera ID
        const urlId = getIdFromUrl()
        if (urlId && data.cameras.some(c => c.id === urlId)) {
          setSelectedCameraId(urlId)
        }
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  // Handle browser back/forward
  useEffect(() => {
    function handlePopState() {
      const urlId = getIdFromUrl()
      setSelectedCameraId(urlId)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  const selectCamera = useCallback((camera: Camera) => {
    setSelectedCameraId(camera.id)
    window.history.pushState({ cameraId: camera.id }, '', `/muzeum?id=${camera.id}`)
    window.scrollTo({ top: 0 })
  }, [])

  const goBack = useCallback(() => {
    setSelectedCameraId(null)
    window.history.pushState(null, '', '/muzeum')
  }, [])

  const selectedCamera = cameras.find(c => c.id === selectedCameraId) ?? null

  const filtered = activeFilter
    ? cameras.filter(c => c.type === activeFilter)
    : cameras

  const typeLabels: Record<string, { cs: string; en: string }> = {
    'Foldable': { cs: 'Skladaci', en: 'Foldable' },
    'Box': { cs: 'Box', en: 'Box' },
    'TLR': { cs: 'TLR', en: 'TLR' },
    'SLR': { cs: 'SLR', en: 'SLR' },
    'Point & Shoot': { cs: 'Point & Shoot', en: 'Point & Shoot' },
    'Rangefinder': { cs: 'Dalkomery', en: 'Rangefinder' },
    'DSLR': { cs: 'DSLR', en: 'DSLR' },
    'Compact': { cs: 'Kompakt', en: 'Compact' },
  }

  function getCameraImageUrl(camera: Camera): string {
    return museumImageUrl(camera.id, camera.image)
  }

  if (selectedCamera) {
    return (
      <>
        <GrainOverlay />
        <Navigation />
        <CameraDetail
          camera={selectedCamera}
          locale={locale as Locale}
          t={t}
          onBack={goBack}
          imageUrl={getCameraImageUrl(selectedCamera)}
        />
        <Footer />
      </>
    )
  }

  return (
    <>
      <GrainOverlay />
      <Navigation />

      <main className="min-h-dvh pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          {/* Header */}
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 32 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-12"
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
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mb-5"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {t('museum.heading')}
            </h1>
            <p
              className="font-body text-muted max-w-[36rem]"
              style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
            >
              {t('museum.description')}
            </p>
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
              <p className="text-muted text-[0.9rem]">{locale === 'cs' ? 'Nepodařilo se načíst muzeum.' : 'Failed to load museum.'}</p>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* Type filter */}
              <div className="flex flex-wrap gap-3 mb-12">
                <button
                  onClick={() => setActiveFilter(null)}
                  className={`px-4 py-2 text-[0.8rem] font-medium tracking-[0.03em] rounded-[2px] border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime ${
                    activeFilter === null
                      ? 'bg-lime/[0.12] border-lime/30 text-lime'
                      : 'bg-transparent border-white/[0.08] text-offwhite/40 hover:text-lime hover:border-lime/20'
                  }`}
                >
                  {t('museum.all')} ({cameras.length})
                </button>
                {cameraTypes.filter(type => cameras.some(c => c.type === type)).map(type => (
                  <button
                    key={type}
                    onClick={() => setActiveFilter(type)}
                    className={`px-4 py-2 text-[0.8rem] font-medium tracking-[0.03em] rounded-[2px] border transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime ${
                      activeFilter === type
                        ? 'bg-lime/[0.12] border-lime/30 text-lime'
                        : 'bg-transparent border-white/[0.08] text-offwhite/40 hover:text-lime hover:border-lime/20'
                    }`}
                  >
                    {typeLabels[type]?.[locale as Locale] || type} ({cameras.filter(c => c.type === type).length})
                  </button>
                ))}
              </div>

              {/* Camera grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                <AnimatePresence mode="popLayout">
                  {filtered.map((camera, i) => (
                    <motion.button
                      key={camera.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.4, delay: Math.min(i * 0.03, 0.3), ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => selectCamera(camera)}
                      className="group relative bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-lime"
                      style={{
                        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(181,202,44,0.06), 0 12px 36px rgba(0,0,0,0.3)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-warmblack overflow-hidden">
                        {!imageLoaded[camera.id] && !imgErrors[camera.id] && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-lime/20 border-t-lime/60 rounded-full animate-spin" />
                          </div>
                        )}
                        {imgErrors[camera.id] ? (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <svg className="w-10 h-10 text-muted/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                            </svg>
                          </div>
                        ) : (
                          <img
                            src={getCameraImageUrl(camera)}
                            alt={`${camera.brand} ${camera.model}`}
                            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded[camera.id] ? 'opacity-100' : 'opacity-0'}`}
                            loading="lazy"
                            onLoad={() => setImageLoaded(prev => ({ ...prev, [camera.id]: true }))}
                            onError={() => setImgErrors(prev => ({ ...prev, [camera.id]: true }))}
                          />
                        )}
                        <div
                          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            background: 'linear-gradient(to top, rgba(19,16,16,0.7), transparent 60%)',
                          }}
                        />
                        {/* Status badges */}
                        <div className="absolute top-2 right-2 flex gap-1.5">
                          {!camera.isWorking && (
                            <span className="px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.05em] uppercase bg-darkroom/80 text-offwhite/60 rounded-[2px]">
                              {locale === 'cs' ? 'Nefunkcni' : 'Broken'}
                            </span>
                          )}
                          {!camera.isAnalog && (
                            <span className="px-2 py-0.5 text-[0.6rem] font-semibold tracking-[0.05em] uppercase bg-lime/10 text-lime/60 rounded-[2px]">
                              Digital
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <p className="font-body text-[0.65rem] text-lime/50 tracking-[0.05em] uppercase mb-0.5">
                          {camera.brand}
                        </p>
                        <h3 className="font-display font-bold text-offwhite text-[0.85rem] tracking-[-0.02em] leading-tight">
                          {camera.model}
                        </h3>
                        <p className="font-body text-muted/60 text-[0.7rem] mt-1">
                          {camera.releaseYear} &middot; {camera.sensor}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}

function CameraDetail({
  camera,
  locale,
  t,
  onBack,
  imageUrl,
}: {
  camera: Camera
  locale: Locale
  t: (key: string) => string
  onBack: () => void
  imageUrl: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -30px 0px' })
  const [imgError, setImgError] = useState(false)
  const [galleryErrors, setGalleryErrors] = useState<Record<string, boolean>>({})
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(0)
  const [lightboxImages, setLightboxImages] = useState<string[]>([])

  const specs = [
    { label: t('museum.year'), value: String(camera.releaseYear) },
    { label: t('museum.country'), value: camera.releaseCountry[locale] },
    { label: t('museum.format'), value: camera.sensor },
    { label: t('museum.type'), value: camera.type },
    { label: t('museum.price'), value: camera.purchasePrice === 0 ? (locale === 'cs' ? 'Dárek' : 'Gift') : `${camera.purchasePrice.toLocaleString()} CZK` },
    { label: t('museum.acquired'), value: String(camera.acquisitionYear) },
    { label: t('museum.working'), value: camera.isWorking ? t('museum.yes') : t('museum.no') },
    { label: t('museum.flash'), value: camera.hasFlash ? t('museum.yes') : t('museum.no') },
  ]

  const galleryPhotos = camera.galleryImages ?? []
  const samplePhotos = camera.sampleImages ?? []

  const openLightbox = useCallback((photos: string[], index: number) => {
    const urls = photos.filter(f => !galleryErrors[f]).map(f => museumImageUrl(camera.id, f))
    setLightboxImages(urls)
    setLightboxIndex(index)
    setLightboxOpen(true)
  }, [camera.id, galleryErrors])

  return (
    <main className="min-h-dvh pt-28 pb-20">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        >
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[0.8rem] text-muted hover:text-lime transition-colors duration-300 mb-10"
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
            </svg>
            {t('museum.back')}
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
            {/* Image */}
            <div className="lg:col-span-5">
              <div className="relative">
                <div className="relative aspect-square bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden">
                  {imgError ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-16 h-16 text-muted/15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                      </svg>
                    </div>
                  ) : (
                    <img
                      src={imageUrl}
                      alt={`${camera.brand} ${camera.model}`}
                      className="w-full h-full object-contain p-6"
                      onError={() => setImgError(true)}
                    />
                  )}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(to top, rgba(19,16,16,0.3), transparent 40%)',
                    }}
                  />
                </div>
                <div className="absolute -bottom-3 -right-3 w-full h-full border border-lime/[0.05] rounded-[2px] -z-1" />
                <div className="absolute -top-2 -left-2 w-6 h-6 border-t border-l border-lime/[0.2]" />
              </div>
            </div>

            {/* Details */}
            <div className="lg:col-span-7">
              <p className="font-body text-[0.75rem] text-lime/50 tracking-[0.1em] uppercase mb-2">
                {camera.brand}
              </p>
              <h1
                className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mb-6"
                style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)' }}
              >
                {camera.model}
              </h1>

              <p className="font-body text-muted mb-8" style={{ fontSize: 'clamp(0.9rem, 1.4vw, 1.02rem)' }}>
                {camera.description[locale]}
              </p>

              {/* Specs grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-white/[0.04] rounded-[2px] overflow-hidden mb-8">
                {specs.map((spec) => (
                  <div key={spec.label} className="bg-charcoal p-4">
                    <p className="font-body text-[0.65rem] text-muted/50 tracking-[0.05em] uppercase mb-1">
                      {spec.label}
                    </p>
                    <p className="font-display font-bold text-offwhite text-[1.15rem] tracking-[-0.02em]">
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Camera gallery photos — photos of the camera */}
          {galleryPhotos.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display font-bold text-offwhite tracking-[-0.02em] text-xl mb-6">
                {locale === 'cs' ? 'Fotografie fotoaparátu' : 'Camera photos'}
              </h2>
              <PhotoGrid photos={galleryPhotos} camera={camera} errors={galleryErrors} onError={(f) => setGalleryErrors(p => ({ ...p, [f]: true }))} onClickPhoto={(i) => openLightbox(galleryPhotos, i)} />
            </div>
          )}

          {/* Sample photos — photos shot by the camera */}
          {samplePhotos.length > 0 && (
            <div className="mt-16">
              <h2 className="font-display font-bold text-offwhite tracking-[-0.02em] text-xl mb-6">
                {locale === 'cs' ? 'Ukázky snímků' : 'Sample shots'}
              </h2>
              <PhotoGrid photos={samplePhotos} camera={camera} errors={galleryErrors} onError={(f) => setGalleryErrors(p => ({ ...p, [f]: true }))} onClickPhoto={(i) => openLightbox(samplePhotos, i)} />
            </div>
          )}

          <Lightbox
            images={lightboxImages}
            currentIndex={lightboxIndex}
            isOpen={lightboxOpen}
            onClose={() => setLightboxOpen(false)}
            onPrev={() => setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
            onNext={() => setLightboxIndex(prev => (prev + 1) % lightboxImages.length)}
          />
        </motion.div>
      </div>
    </main>
  )
}

function PhotoGrid({
  photos,
  camera,
  errors,
  onError,
  onClickPhoto,
}: {
  photos: string[]
  camera: Camera
  errors: Record<string, boolean>
  onError: (filename: string) => void
  onClickPhoto?: (index: number) => void
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {photos.map((filename, index) => {
        const url = museumImageUrl(camera.id, filename)
        return (
          <button
            key={filename}
            type="button"
            onClick={() => !errors[filename] && onClickPhoto?.(index)}
            className="relative aspect-[4/3] bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden group cursor-pointer text-left focus-visible:outline-2 focus-visible:outline-lime"
          >
            {errors[filename] ? (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-10 h-10 text-muted/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0 0 22.5 18.75V5.25A2.25 2.25 0 0 0 20.25 3H3.75A2.25 2.25 0 0 0 1.5 5.25v13.5A2.25 2.25 0 0 0 3.75 21Z" />
                </svg>
              </div>
            ) : (
              <img
                src={url}
                alt={`${camera.brand} ${camera.model}`}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={() => onError(filename)}
              />
            )}
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
        )
      })}
    </div>
  )
}
