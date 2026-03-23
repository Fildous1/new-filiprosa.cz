'use client'

import { useEffect, useCallback, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface LightboxProps {
  images: string[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}

const MIN_ZOOM = 1
const MAX_ZOOM = 5
const ZOOM_STEP = 0.5

export default function Lightbox({ images, currentIndex, isOpen, onClose, onPrev, onNext }: LightboxProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const lastTouchDist = useRef<number | null>(null)

  const isZoomed = zoom > 1

  // Check if a point is inside the visible (zoomed) image area
  const isInsideImage = useCallback((clientX: number, clientY: number): boolean => {
    if (!imgRef.current) return false
    const rect = imgRef.current.getBoundingClientRect()
    // When zoomed, getBoundingClientRect reflects the transform, so it's the visual bounds
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
  }, [])

  const resetZoom = useCallback(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [])

  // Reset zoom when changing images
  useEffect(() => {
    resetZoom()
  }, [currentIndex, resetZoom])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { resetZoom(); onClose() }
    if (e.key === 'ArrowLeft' && !isZoomed) onPrev()
    if (e.key === 'ArrowRight' && !isZoomed) onNext()
    if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM))
    if (e.key === '-') setZoom(z => { const nz = Math.max(z - ZOOM_STEP, MIN_ZOOM); if (nz === 1) setPan({ x: 0, y: 0 }); return nz })
    if (e.key === '0') resetZoom()
  }, [onClose, onPrev, onNext, isZoomed, resetZoom])

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setZoom(z => {
      const newZoom = Math.min(Math.max(z + delta, MIN_ZOOM), MAX_ZOOM)
      if (newZoom === 1) setPan({ x: 0, y: 0 })
      return newZoom
    })
  }, [])

  // Double-click to toggle zoom (when not at 100%)
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (isZoomed) {
      resetZoom()
    } else {
      setZoom(3)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const cx = rect.width / 2
        const cy = rect.height / 2
        setPan({ x: (cx - e.clientX) * 0.5, y: (cy - e.clientY) * 0.5 })
      }
    }
  }, [isZoomed, resetZoom])

  // Single click on image: zoom in when at 100%, otherwise handled by container
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isZoomed) {
      // Single click at 100% → zoom to 3x centered on click point
      setZoom(3)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const cx = rect.width / 2
        const cy = rect.height / 2
        setPan({ x: (cx - e.clientX) * 0.5, y: (cy - e.clientY) * 0.5 })
      }
    }
    // When zoomed, single click does nothing (drag handles pan)
  }, [isZoomed])

  // Mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isZoomed) return
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }, [isZoomed, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    setPan({
      x: dragStart.current.panX + (e.clientX - dragStart.current.x),
      y: dragStart.current.panY + (e.clientY - dragStart.current.y),
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  // Touch handlers
  const getTouchDistance = (touches: React.TouchList) => {
    const dx = touches[0].clientX - touches[1].clientX
    const dy = touches[0].clientY - touches[1].clientY
    return Math.sqrt(dx * dx + dy * dy)
  }

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      lastTouchDist.current = getTouchDistance(e.touches)
    } else if (e.touches.length === 1 && isZoomed) {
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y }
      setIsDragging(true)
    }
  }, [isZoomed, pan])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && lastTouchDist.current !== null) {
      e.preventDefault()
      const newDist = getTouchDistance(e.touches)
      const scale = newDist / lastTouchDist.current
      setZoom(z => {
        const nz = Math.min(Math.max(z * scale, MIN_ZOOM), MAX_ZOOM)
        if (nz === 1) setPan({ x: 0, y: 0 })
        return nz
      })
      lastTouchDist.current = newDist
    } else if (e.touches.length === 1 && isDragging && isZoomed) {
      setPan({
        x: dragStart.current.panX + (e.touches[0].clientX - dragStart.current.x),
        y: dragStart.current.panY + (e.touches[0].clientY - dragStart.current.y),
      })
    }
  }, [isDragging, isZoomed])

  const handleTouchEnd = useCallback(() => {
    lastTouchDist.current = null
    setIsDragging(false)
  }, [])

  const handleClose = useCallback(() => {
    resetZoom()
    onClose()
  }, [resetZoom, onClose])

  const zoomIn = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM))
  }, [])

  const zoomOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setZoom(z => { const nz = Math.max(z - ZOOM_STEP, MIN_ZOOM); if (nz === 1) setPan({ x: 0, y: 0 }); return nz })
  }, [])

  const btnClass = "w-10 h-10 flex items-center justify-center text-offwhite/40 hover:text-lime transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime"

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[10000] flex items-center justify-center cursor-default"
          onClick={handleClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-dark/95 backdrop-blur-[8px]" />

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-5 py-4" style={{ background: 'linear-gradient(to bottom, rgba(19,16,16,0.7) 0%, rgba(19,16,16,0.3) 60%, transparent 100%)' }}>
            {/* Left: counter + zoom % */}
            <div className="font-body text-[0.75rem] text-offwhite/40 tracking-[0.1em]">
              {currentIndex + 1} / {images.length}
              {isZoomed && (
                <span className="ml-3 text-lime/50">{Math.round(zoom * 100)}%</span>
              )}
            </div>

            {/* Right: zoom controls + close, all aligned */}
            <div className="flex items-center gap-0.5">
              {isZoomed && (
                <button
                  onClick={(e) => { e.stopPropagation(); resetZoom() }}
                  className="h-10 px-2 flex items-center justify-center text-[0.65rem] text-offwhite/30 hover:text-lime transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime"
                  aria-label="Reset zoom"
                  title="Reset zoom (0)"
                >
                  Reset
                </button>
              )}
              <button onClick={zoomOut} className={btnClass} aria-label="Zoom out" title="Zoom out (−)">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5h-6" />
                </svg>
              </button>
              <button onClick={zoomIn} className={btnClass} aria-label="Zoom in" title="Zoom in (+)">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3h-6" />
                </svg>
              </button>
              <div className="w-px h-5 bg-white/[0.08] mx-1" />
              <button
                onClick={(e) => { e.stopPropagation(); handleClose() }}
                className={btnClass}
                aria-label="Close"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Prev - hidden when zoomed */}
          {!isZoomed && (
            <button
              onClick={(e) => { e.stopPropagation(); onPrev() }}
              className="absolute left-1 md:left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-16 md:w-12 md:h-12 flex items-center justify-center text-offwhite/40 hover:text-lime transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime"
              aria-label="Previous"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}

          {/* Next - hidden when zoomed */}
          {!isZoomed && (
            <button
              onClick={(e) => { e.stopPropagation(); onNext() }}
              className="absolute right-1 md:right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-16 md:w-12 md:h-12 flex items-center justify-center text-offwhite/40 hover:text-lime transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime"
              aria-label="Next"
            >
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          )}

          {/* Image container — zoom & pan applied directly via style, no framer-motion on image */}
          <div
            ref={containerRef}
            className="relative z-1 flex items-center justify-center select-none"
            style={{
              width: '90vw',
              height: '85vh',
              cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
            }}
            onWheel={handleWheel}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onMouseDown={(e) => {
              // Only start drag/interact if click is on the image
              if (isInsideImage(e.clientX, e.clientY)) {
                handleMouseDown(e)
              }
            }}
            onDoubleClick={(e) => {
              if (isInsideImage(e.clientX, e.clientY)) {
                handleDoubleClick(e)
              }
            }}
            onClick={(e) => {
              if (isInsideImage(e.clientX, e.clientY)) {
                handleImageClick(e)
              }
              // If not on image, let it bubble to backdrop → close
            }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              ref={imgRef}
              key={images[currentIndex]}
              src={images[currentIndex]}
              alt=""
              className="max-h-[85vh] max-w-[90vw] object-contain pointer-events-none"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'center center',
                willChange: zoom > 1 ? 'transform' : 'auto',
              }}
              draggable={false}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
