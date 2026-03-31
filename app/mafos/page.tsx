'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useI18n } from '@/lib/i18n'

const TIMELINE_COUNT = 5

const ease = [0.16, 1, 0.3, 1] as const

const MAGNIFIER_RADIUS = 75
const MAGNIFIER_ZOOM = 4

function ResultsComparison() {
  const { t, locale } = useI18n()
  const [active, setActive] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const mafosRef = useRef<HTMLDivElement>(null)
  const labRef = useRef<HTMLDivElement>(null)
  const sectionRef = useRef<HTMLDivElement>(null)
  const inView = useInView(sectionRef, { once: true, margin: '0px 0px 200px 0px' })

  // Preload full-res images when section approaches viewport
  useEffect(() => {
    if (!inView) return
    const imgs = ['/images/mafos/results/mafos-full.jpg', '/images/mafos/results/lab-full.jpeg']
    imgs.forEach(src => { const img = new window.Image(); img.src = src })
  }, [inView])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setPos({
      x: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)),
    })
    if (!active) setActive(true)
  }, [active])

  const handleMouseLeave = useCallback(() => setActive(false), [])

  const magnifier = (fullSrc: string, ref: React.RefObject<HTMLDivElement | null>) => {
    if (!active || !ref.current) return null
    const rect = ref.current.getBoundingClientRect()
    const bgW = rect.width * MAGNIFIER_ZOOM
    const bgH = rect.height * MAGNIFIER_ZOOM
    const d = MAGNIFIER_RADIUS * 2
    return (
      <div
        className="pointer-events-none absolute z-10"
        style={{
          left: pos.x * rect.width - MAGNIFIER_RADIUS,
          top: pos.y * rect.height - MAGNIFIER_RADIUS,
          width: d,
          height: d,
          borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.15)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
          backgroundImage: `url(${fullSrc})`,
          backgroundSize: `${bgW}px ${bgH}px`,
          backgroundPosition: `${MAGNIFIER_RADIUS - pos.x * bgW}px ${MAGNIFIER_RADIUS - pos.y * bgH}px`,
          backgroundRepeat: 'no-repeat',
        }}
      />
    )
  }

  return (
    <div ref={sectionRef} className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <span className="font-body text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-lime/60 mb-2 block">Mafoš</span>
        <div
          ref={mafosRef}
          className="relative aspect-[3/2] bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: active ? 'none' : undefined }}
        >
          <Image src="/images/mafos/results/5-final.jpg" alt={locale === 'cs' ? 'Výsledek Mafoše' : 'Mafoš result'} fill sizes="600px" className="object-cover" />
          {magnifier('/images/mafos/results/mafos-full.jpg', mafosRef)}
        </div>
      </div>
      <div>
        <span className="font-body text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-lime/60 mb-2 block">Lab</span>
        <div
          ref={labRef}
          className="relative aspect-[3/2] bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ cursor: active ? 'none' : undefined }}
        >
          <Image src="/images/mafos/results/lab.jpeg" alt={locale === 'cs' ? 'Výsledek labu' : 'Lab result'} fill sizes="600px" className="object-cover" />
          {magnifier('/images/mafos/results/lab-full.jpeg', labRef)}
        </div>
      </div>
    </div>
  )
}

function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -60px 0px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function Carousel({ items, initialSlide = 0 }: { items: { img: string; label: string; desc: string }[]; initialSlide?: number }) {
  const [current, setCurrent] = useState(initialSlide)

  const go = useCallback((dir: number) => {
    setCurrent(prev => {
      const next = prev + dir
      if (next < 0) return items.length - 1
      if (next >= items.length) return 0
      return next
    })
  }, [items.length])

  const prevIdx = (current - 1 + items.length) % items.length
  const nextIdx = (current + 1) % items.length

  return (
    <div>
      <div className="relative mb-6">
        {/* Current image + arrows */}
        <div className="flex items-center">
          <button
            onClick={() => go(-1)}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-white/[0.08] text-muted hover:text-lime hover:border-lime/30 transition-colors duration-200"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          <div className="flex-1 min-w-0 flex justify-center px-3">
            <div className="relative aspect-[3/2] w-[75%]">
              <Image src={items[current].img} alt={items[current].label} fill sizes="700px" className="object-contain" />
            </div>
          </div>

          <button
            onClick={() => go(1)}
            className="flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full border border-white/[0.08] text-muted hover:text-lime hover:border-lime/30 transition-colors duration-200"
          >
            <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* Prev peek — positioned absolutely, 80% height, fades at inner edge */}
        <div
          className="hidden sm:block absolute top-[10%] left-0 w-[12%] h-[80%] pointer-events-none"
          style={{ maskImage: 'linear-gradient(to right, black 30%, transparent)', WebkitMaskImage: 'linear-gradient(to right, black 30%, transparent)' }}
        >
          <Image src={items[prevIdx].img} alt="" fill sizes="120px" className="object-contain object-right" />
        </div>

        {/* Next peek — positioned absolutely, 80% height, fades at inner edge */}
        <div
          className="hidden sm:block absolute top-[10%] right-0 w-[12%] h-[80%] pointer-events-none"
          style={{ maskImage: 'linear-gradient(to left, black 30%, transparent)', WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent)' }}
        >
          <Image src={items[nextIdx].img} alt="" fill sizes="120px" className="object-contain object-left" />
        </div>
      </div>

      {/* Label + description */}
      <div className="text-center">
        <span className="text-lime/60 font-semibold text-[0.8rem] mr-2">{String(current + 1).padStart(2, '0')}</span>
        <span className="font-display font-bold text-offwhite" style={{ fontSize: 'clamp(1.1rem, 2vw, 1.4rem)' }}>{items[current].label}</span>
        <p className="font-body text-muted mt-2 max-w-[550px] mx-auto" style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}>{items[current].desc}</p>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {items.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-200 ${i === current ? 'bg-lime' : 'bg-white/15'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default function MafosPage() {
  const { t, locale } = useI18n()

  const conversionSteps = [
    { img: '/images/mafos/results/1-negative.jpg', label: t('mafos.step1'), desc: t('mafos.step1.desc') },
    { img: '/images/mafos/results/2-negative-crop-wb.jpg', label: t('mafos.step2'), desc: t('mafos.step2.desc') },
    { img: '/images/mafos/results/3-positive.jpg', label: t('mafos.step3'), desc: t('mafos.step3.desc') },
    { img: '/images/mafos/results/4-positive-edited.jpg', label: t('mafos.step4'), desc: t('mafos.step4.desc') },
    { img: '/images/mafos/results/5-final.jpg', label: t('mafos.step5'), desc: t('mafos.step5.desc') },
  ]

  const makingStages = [
    { img: '/images/mafos/making-of/tube-prototype.jpg', label: t('mafos.making.stage1'), desc: t('mafos.making.stage1.desc') },
    { img: '/images/mafos/making-of/second-prototype.jpg', label: t('mafos.making.stage2'), desc: t('mafos.making.stage2.desc') },
    { img: '/images/mafos/making-of/perspective.png', label: t('mafos.making.stage3'), desc: t('mafos.making.stage3.desc') },
    { img: '/images/mafos/making-of/slicer.png', label: t('mafos.making.stage4'), desc: t('mafos.making.stage4.desc') },
    { img: '/images/mafos/product/front-up.png', label: t('mafos.making.stage5'), desc: t('mafos.making.stage5.desc') },
  ]

  return (
    <>
      <Navigation />

      <main className="min-h-dvh pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">

          {/* ── Landing ── */}
          <Section className="mb-20">
            <a
              href="/"
              className="inline-flex items-center gap-2 text-[0.8rem] text-muted hover:text-lime transition-colors duration-300 mb-8"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {t('mafos.back')}
            </a>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
              <div>
                <h1
                  className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mb-5"
                  style={{ fontSize: 'clamp(2.2rem, 5vw, 3.5rem)' }}
                >
                  Mafoš
                </h1>
                <p
                  className="font-body text-muted mb-8"
                  style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
                >
                  {t('mafos.subtitle')}
                </p>

                <h2 className="font-display font-bold text-offwhite text-[1.2rem] tracking-[-0.02em] mb-3">
                  {t('mafos.about.heading')}
                </h2>
                <p className="font-body text-muted text-[0.95rem] leading-[1.75] mb-4">
                  {t('mafos.about.p1')}
                </p>
                <p className="font-body text-muted text-[0.95rem] leading-[1.75] mb-6">
                  {t('mafos.about.p2')}
                </p>

                <div className="flex gap-16 pt-5 border-t border-white/[0.05]">
                  <div>
                    <span className="font-display font-bold text-lime text-[1.4rem]">{t('mafos.about.stat1.1')}</span>
                    <span className="block font-body text-muted text-[0.72rem] mt-1">{t('mafos.about.stat1.2')}</span>
                  </div>
                  <div>
                    <span className="font-display font-bold text-lime text-[1.4rem]">{t('mafos.about.stat2.1')}</span>
                    <span className="block font-body text-muted text-[0.72rem] mt-1">{t('mafos.about.stat2.2')}</span>
                  </div>
                  <div>
                    <span className="font-display font-bold text-lime text-[1.4rem]">{t('mafos.about.stat3.1')}</span>
                    <span className="block font-body text-muted text-[0.72rem] mt-1">{t('mafos.about.stat3.2')}</span>
                  </div>
                </div>
              </div>
              <div className="relative aspect-[4/3] bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden">
                <Image
                  src="/images/mafos/film.jpg"
                  alt={locale === 'cs' ? 'Staré negativy' : 'Old negatives'}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-contain"
                />
              </div>
            </div>
          </Section>

          <div className="film-strip" style={{ marginLeft: 'calc(-50vw + 50%)', width: '100vw' }} />

          {/* ── Diagram ── */}
          <Section className="mb-20 mt-12">
            <span className="section-num">01</span>
            <h2
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mt-6 mb-8"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}
            >
              {t('mafos.diagram.heading')}
            </h2>
            <div className="flex justify-center">
              <svg
                viewBox="0 0 290 153.37"
                className="w-full max-w-[700px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g transform="translate(-17.927,-35.944)">
                  <g transform="matrix(0.26458,0,0,0.26458,-59.933,38.768)">
                    {/* Negative film (dashed outline) — back-most */}
                    <path
                      d="m 592.14,195.84 84.69,-0.68 17.97,275 -123,-0.9 z"
                      stroke="#8a8580" strokeWidth="2"
                      strokeDasharray="8, 6" fill="none" fillRule="evenodd"
                    />
                    {/* Base plate */}
                    <rect x="429.8" y="447.16" width="403" height="81"
                      stroke="#6a6560" strokeWidth="2" fill="#4a4540"
                    />
                    {/* Camera mount top bar */}
                    <path
                      d="m 365.86,97.16 h 15.62 16.62 466.4 20.79 11.45 c 4.45,0 8.06,3.6 8.06,8.05 v 64.9 c 0,4.45 -3.61,8.05 -8.06,8.05 h -32.24 c -4.45,0 -8.06,-3.6 -8.06,-8.05 v -50.97 h -450.27 v 50.97 c 0,4.45 -3.61,8.05 -8.06,8.05 h -32.24 c -4.45,0 -8.06,-3.6 -8.06,-8.05 v -64.9 c 0,-4.45 3.61,-8.05 8.06,-8.05 z"
                      stroke="#6a6560" strokeWidth="2" fill="#3a3530" fillRule="evenodd"
                    />
                    {/* Main body frame */}
                    <path
                      d="m 361.3,169.16 h 46.01 c 6.35,0 11.5,5.15 11.5,11.5 v 336.55 h 426.96 v -336.55 c 0,-6.35 5.15,-11.5 11.5,-11.5 h 46.01 c 6.35,0 11.5,5.15 11.5,11.5 v 336.55 4 17.95 h -565 v -17.95 -4 -336.55 c 0,-6.35 5.15,-11.5 11.5,-11.5 z"
                      stroke="#6a6560" strokeWidth="2" fill="#3a3530" fillRule="evenodd"
                    />
                    {/* Screws */}
                    <circle cx="880.8" cy="209.16" r="14" stroke="#6a6560" strokeWidth="2" fill="#4a4540" />
                    <circle cx="383.8" cy="209.16" r="14" stroke="#6a6560" strokeWidth="2" fill="#4a4540" />
                    {/* Film holder rail */}
                    <path
                      d="m 458.8,495 c 0,-4.33 3.51,-7.84 7.84,-7.84 h 329.33 c 4.33,0 7.84,3.51 7.84,7.84 v 5.33 c 0,4.33 -3.51,7.84 -7.84,7.84 h -329.33 c -4.33,0 -7.84,-3.51 -7.84,-7.84 z"
                      stroke="#7a7570" strokeWidth="2" fill="#5a5550" fillRule="evenodd"
                    />
                    {/* Film guide line */}
                    <path d="m 440.8,470.16 h 381.38"
                      stroke="#5a5550" strokeWidth="2" strokeLinecap="round" fill="none"
                    />
                    {/* Camera sensor area */}
                    <rect x="590.8" y="46.16" width="86" height="156"
                      stroke="#7a7570" strokeWidth="2" fill="#3a3530"
                    />
                    {/* Camera lens barrel */}
                    <path
                      d="m 682.81,32.16 c 2.76,0 4.99,2.23 4.99,4.99 v 146.02 c 0,2.76 -2.23,4.99 -4.99,4.99 h -98.02 c -2.76,0 -4.99,-2.23 -4.99,-4.99 V 37.16 c 0,-2.76 2.23,-4.99 4.99,-4.99 z"
                      stroke="#7a7570" strokeWidth="2" fill="#4a4540" fillRule="evenodd"
                    />
                    {/* Camera top housing */}
                    <path
                      d="m 542.8,24.97 c 0,-3.21 2.6,-5.81 5.81,-5.81 h 208.39 c 3.21,0 5.81,2.6 5.81,5.81 v 66.39 c 0,3.21 -2.6,5.81 -5.81,5.81 h -208.39 c -3.21,0 -5.81,-2.6 -5.81,-5.81 z"
                      stroke="#7a7570" strokeWidth="2" fill="#5a5550" fillRule="evenodd"
                    />
                    {/* Arrow: Camera */}
                    <path d="m 1010.33,63.05 -217.55,-2.71 c -0.83,-0.01 -1.49,-0.69 -1.48,-1.52 0.01,-0.83 0.69,-1.49 1.52,-1.48 l 217.55,2.71 c 0.83,0.01 1.49,0.69 1.48,1.52 -0.01,0.83 -0.69,1.49 -1.52,1.48 z m -216.13,3.31 -14.9,-7.69 15.09,-7.31 z"
                      fill="#b5ca2c"
                    />
                    {/* Arrow: Negative */}
                    <path d="M 1009.21,294.5 813.86,452.25 c -0.65,0.52 -0.75,1.46 -0.23,2.11 0.52,0.64 1.47,0.75 2.11,0.23 L 1011.1,296.83 c 0.64,-0.52 0.75,-1.46 0.22,-2.11 -0.52,-0.64 -1.46,-0.75 -2.11,-0.22 z m -197.96,152.14 -6.96,15.26 16.38,-3.59 z"
                      fill="#b5ca2c"
                    />
                    {/* Arrow: Phone */}
                    <path d="m 1009.75,500.16 -186.97,-1.86 c -0.83,-0.01 -1.49,-0.69 -1.49,-1.52 0.01,-0.83 0.69,-1.49 1.52,-1.49 l 186.97,1.86 c 0.83,0.01 1.49,0.69 1.49,1.52 -0.01,0.83 -0.69,1.49 -1.52,1.49 z m -185.53,4.16 -14.93,-7.65 15.07,-7.35 z"
                      fill="#b5ca2c"
                    />
                    {/* Labels */}
                    <text fontFamily="'Playfair Display', Georgia, serif" fontWeight="700" fontSize="37"
                      x="1038.58" y="77.16" fill="#f0eae0"
                    >{t('mafos.diagram.camera')}</text>
                    <text fontFamily="'Playfair Display', Georgia, serif" fontWeight="700" fontSize="37"
                      x="1038.58" y="311.16" fill="#f0eae0"
                    >{t('mafos.diagram.negative')}</text>
                    <text fontFamily="'Playfair Display', Georgia, serif" fontWeight="700" fontSize="37"
                      x="1037.75" y="514.16" fill="#f0eae0"
                    >{t('mafos.diagram.phone')}</text>
                  </g>
                </g>
              </svg>
            </div>
          </Section>

          <div className="film-strip" style={{ marginLeft: 'calc(-50vw + 50%)', width: '100vw' }} />

          {/* ── Conversion (carousel) ── */}
          <Section className="mb-20 mt-12">
            <span className="section-num">02</span>
            <h2
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mt-6 mb-5"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}
            >
              {t('mafos.conversion.heading')}
            </h2>
            <p className="font-body text-muted text-[0.95rem] leading-[1.75] max-w-[40rem] mb-10">
              {t('mafos.conversion.p1')}
            </p>
            <Carousel items={conversionSteps} />
          </Section>

          <div className="film-strip" style={{ marginLeft: 'calc(-50vw + 50%)', width: '100vw' }} />

          {/* ── Results / Comparison ── */}
          <Section className="mb-20 mt-12">
            <span className="section-num">03</span>
            <h2
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mt-6 mb-5"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}
            >
              {t('mafos.results.heading')}
            </h2>
            <p className="font-body text-muted text-[0.95rem] leading-[1.75] max-w-[40rem] mb-10">
              {t('mafos.results.p1')}
            </p>
            <ResultsComparison />
          </Section>

          <div className="film-strip" style={{ marginLeft: 'calc(-50vw + 50%)', width: '100vw' }} />

          {/* ── Making Of (carousel) ── */}
          <Section className="mb-20 mt-12">
            <span className="section-num">04</span>
            <h2
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mt-6 mb-5"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}
            >
              {t('mafos.making.heading')}
            </h2>
            <p className="font-body text-muted text-[0.95rem] leading-[1.75] max-w-[40rem] mb-10">
              {t('mafos.making.p1')}
            </p>
            <Carousel items={makingStages} initialSlide={4} />
          </Section>

          <div className="film-strip" style={{ marginLeft: 'calc(-50vw + 50%)', width: '100vw' }} />

          {/* ── Story ── */}
          <Section className="mb-10 mt-12">
            <span className="section-num">05</span>
            <h2
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mt-6 mb-5"
              style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.4rem)' }}
            >
              {t('mafos.story.heading')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-12 items-start mt-8">
              <div>
                <p className="font-body text-muted text-[0.95rem] leading-[1.75] mb-5">
                  {t('mafos.story.p1')}
                </p>
                <p className="font-body text-muted text-[0.95rem] leading-[1.75] mb-5">
                  {t('mafos.story.p2')}
                </p>
                <p className="font-body text-muted text-[0.95rem] leading-[1.75] mb-8">
                  {t('mafos.story.p3')}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative aspect-[1/1] bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden">
                    <Image
                      src="/images/mafos/story.jpg"
                      alt={locale === 'cs' ? 'První naskenovaná fotka' : 'First scanned photo'}
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-[1/1] bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden">
                    <Image
                      src="/images/mafos/story2.jpg"
                      alt={locale === 'cs' ? 'Naskenovaná fotka' : 'Scanned photo'}
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="md:w-56 md:sticky md:top-28">
                <h3 className="font-body text-[0.72rem] font-semibold tracking-[0.1em] uppercase text-lime/60 mb-5">{t('mafos.timeline.title')}</h3>
                <div className="relative pl-4 border-l border-white/[0.06]">
                  {Array.from({ length: TIMELINE_COUNT }, (_, i) => (
                    <div key={i} className="mb-6 last:mb-0 relative">
                      <div className="absolute -left-[calc(1rem+3.5px)] top-[0.4rem] w-[7px] h-[7px] rounded-full bg-lime/40" />
                      <span className="font-body text-[0.7rem] font-semibold text-muted block">{t(`mafos.timeline.${i + 1}.date`)}</span>
                      <span className="font-body text-[0.82rem] text-offwhite/70">{t(`mafos.timeline.${i + 1}`)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Section>

        </div>
      </main>

      <Footer />
    </>
  )
}
