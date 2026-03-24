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
const DRAG_THRESHOLD = 5 // px — movement below this counts as a click, not a drag

export default function Lightbox({ images, currentIndex, isOpen, onClose, onPrev, onNext }: LightboxProps) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [animating, setAnimating] = useState(false)
  const dragStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 })
  const didDrag = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const lastTouchDist = useRef<number | null>(null)
  const animTimeout = useRef<ReturnType<typeof setTimeout>>(undefined)

  const isZoomed = zoom > 1

  // Trigger smooth transition for programmatic zoom changes
  const triggerSmooth = useCallback(() => {
    setAnimating(true)
    if (animTimeout.current) clearTimeout(animTimeout.current)
    animTimeout.current = setTimeout(() => setAnimating(false), 380)
  }, [])

  // Check if a point is inside the visible (zoomed) image area
  const isInsideImage = useCallback((clientX: number, clientY: number): boolean => {
    if (!imgRef.current) return false
    const rect = imgRef.current.getBoundingClientRect()
    return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom
  }, [])

  const resetZoom = useCallback(() => {
    triggerSmooth()
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }, [triggerSmooth])

  // Reset zoom when changing images
  useEffect(() => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setAnimating(false)
  }, [currentIndex])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') { resetZoom(); onClose() }
    if (e.key === 'ArrowLeft' && !isZoomed) onPrev()
    if (e.key === 'ArrowRight' && !isZoomed) onNext()
    if (e.key === '+' || e.key === '=') {
      triggerSmooth()
      setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM))
    }
    if (e.key === '-') {
      triggerSmooth()
      setZoom(z => { const nz = Math.max(z - ZOOM_STEP, MIN_ZOOM); if (nz === 1) setPan({ x: 0, y: 0 }); return nz })
    }
    if (e.key === '0') resetZoom()
  }, [onClose, onPrev, onNext, isZoomed, resetZoom, triggerSmooth])

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

  // Clean up animation timeout
  useEffect(() => {
    return () => { if (animTimeout.current) clearTimeout(animTimeout.current) }
  }, [])

  // Mouse wheel zoom — no transition for continuous scrolling
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setAnimating(false)
    const delta = e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP
    setZoom(z => {
      const newZoom = Math.min(Math.max(z + delta, MIN_ZOOM), MAX_ZOOM)
      if (newZoom === 1) setPan({ x: 0, y: 0 })
      return newZoom
    })
  }, [])

  // Double-click to toggle zoom
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    triggerSmooth()
    if (isZoomed) {
      setZoom(1)
      setPan({ x: 0, y: 0 })
    } else {
      setZoom(3)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const cx = rect.width / 2
        const cy = rect.height / 2
        setPan({ x: (cx - e.clientX) * 0.5, y: (cy - e.clientY) * 0.5 })
      }
    }
  }, [isZoomed, triggerSmooth])

  // Single click on image: toggle zoom (zoom in at 100%, zoom out when zoomed)
  const handleImageClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    // If user was dragging, ignore this click
    if (didDrag.current) return

    triggerSmooth()
    if (isZoomed) {
      // Click to unzoom
      setZoom(1)
      setPan({ x: 0, y: 0 })
    } else {
      // Click to zoom to 3x centered on click point
      setZoom(3)
      const rect = containerRef.current?.getBoundingClientRect()
      if (rect) {
        const cx = rect.width / 2
        const cy = rect.height / 2
        setPan({ x: (cx - e.clientX) * 0.5, y: (cy - e.clientY) * 0.5 })
      }
    }
  }, [isZoomed, triggerSmooth])

  // Mouse drag for panning
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!isZoomed) return
    e.preventDefault()
    e.stopPropagation()
    didDrag.current = false
    setIsDragging(true)
    setAnimating(false)
    dragStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y }
  }, [isZoomed, pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    e.preventDefault()
    const dx = e.clientX - dragStart.current.x
    const dy = e.clientY - dragStart.current.y
    // Mark as a real drag if moved beyond threshold
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      didDrag.current = true
    }
    setPan({
      x: dragStart.current.panX + dx,
      y: dragStart.current.panY + dy,
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
      didDrag.current = false
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, panX: pan.x, panY: pan.y }
      setIsDragging(true)
      setAnimating(false)
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
      const dx = e.touches[0].clientX - dragStart.current.x
      const dy = e.touches[0].clientY - dragStart.current.y
      if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        didDrag.current = true
      }
      setPan({
        x: dragStart.current.panX + dx,
        y: dragStart.current.panY + dy,
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
    triggerSmooth()
    setZoom(z => Math.min(z + ZOOM_STEP, MAX_ZOOM))
  }, [triggerSmooth])

  const zoomOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    triggerSmooth()
    setZoom(z => { const nz = Math.max(z - ZOOM_STEP, MIN_ZOOM); if (nz === 1) setPan({ x: 0, y: 0 }); return nz })
  }, [triggerSmooth])

  const btnClass = "w-10 h-10 flex items-center justify-center text-offwhite/40 hover:text-lime transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime"

  // Smooth transition for programmatic zoom, none during drag/wheel
  const imgTransition = (!isDragging && animating) ? 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1)' : 'none'

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

          {/* Image container — zoom & pan applied directly via style */}
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
                transition: imgTransition,
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
