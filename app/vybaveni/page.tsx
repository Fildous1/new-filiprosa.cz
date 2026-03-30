'use client'

import { useRef, useEffect, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useI18n } from '@/lib/i18n'
import { fetchMuseum, fetchGear, gearImageUrl, type Camera, type GearManifest } from '@/lib/cdn-api'

interface GearItem {
  name: string
  museumMatch?: string
}

interface GearSection {
  key: string
  titleKey: string
  items: GearItem[]
}

const gearData: GearSection[] = [
  {
    key: 'analog',
    titleKey: 'gear.analog',
    items: [
      { name: 'Pentacon Six TL', museumMatch: 'Pentacon Six TL' },
      { name: 'Canon EOS 650', museumMatch: 'Canon EOS 650' },
      { name: 'Minolta Riva Zoom 70W', museumMatch: 'Minolta Riva Zoom 70W' },
    ],
  },
  {
    key: 'digital',
    titleKey: 'gear.digital',
    items: [
      { name: 'Canon EOS 80D', museumMatch: 'Canon EOS 80D (W)' },
      { name: 'Canon PowerShot G9', museumMatch: 'Canon PowerShot G9' },
    ],
  },
  {
    key: 'optics',
    titleKey: 'gear.optics',
    items: [
      { name: 'Canon EF 24-105mm f/4 USM L' },
      { name: 'Canon EF 50mm f/1.8 STM' },
      { name: 'Canon Speedlite EX580' },
      { name: 'Kingston SDXC 128GB' },
    ],
  },
  {
    key: 'film',
    titleKey: 'gear.film',
    items: [
      { name: 'Fomapan 100' },
      { name: 'Fomapan 400' },
      { name: 'Kodak Color Plus 200' },
    ],
  },
  {
    key: 'darkroom',
    titleKey: 'gear.darkroom',
    items: [
      { name: 'Adox Rodinal' },
      { name: 'Fomafix' },
      { name: 'DSLR Scanning' },
    ],
  },
  {
    key: 'printing',
    titleKey: 'gear.printing',
    items: [
      { name: 'Meopta Opemus 5a' },
      { name: 'Fomapan Variant' },
      { name: 'Fomatol LQN' },
    ],
  },
  {
    key: 'digitalDarkroom',
    titleKey: 'gear.digitalDarkroom',
    items: [
      { name: 'AMD Ryzen 7 7700X' },
      { name: 'Nvidia RTX 2060 6GB' },
      { name: '64GB DDR5' },
      { name: 'WD_BLACK SN7100 NVMe' },
    ],
  },
]

export default function VybaveniPage() {
  const { t } = useI18n()
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -30px 0px' })
  const [museumCameras, setMuseumCameras] = useState<Camera[]>([])
  const [gearImages, setGearImages] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchMuseum().then(m => setMuseumCameras(m.cameras)).catch(() => {})
    fetchGear().then(g => setGearImages(g.images)).catch(() => {})
  }, [])

  const cameraLookup = new Map<string, number>()
  for (const cam of museumCameras) {
    cameraLookup.set(`${cam.brand} ${cam.model}`, cam.id)
  }

  return (
    <>
      <Navigation />

      <main className="min-h-dvh pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
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
              {t('gear.back')}
            </a>
            <h1
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mb-5"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {t('gear.heading')}
            </h1>
            <p
              className="font-body text-muted max-w-[36rem]"
              style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
            >
              {t('gear.description')}
            </p>
          </motion.div>

          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
            {gearData.map((section, sIdx) => (
              <GearTile
                key={section.key}
                section={section}
                t={t}
                index={sIdx}
                cameraLookup={cameraLookup}
                imageFile={gearImages[section.key]}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}

function GearTile({
  section,
  t,
  index,
  cameraLookup,
  imageFile,
}: {
  section: GearSection
  t: (key: string) => string
  index: number
  cameraLookup: Map<string, number>
  imageFile?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })
  const [imgError, setImgError] = useState(false)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.25), ease: [0.16, 1, 0.3, 1] }}
      className="break-inside-avoid mb-3"
    >
      <div className="bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden">
        {/* Section image */}
        {imageFile && !imgError && (
          <img
            src={gearImageUrl(imageFile)}
            alt={t(section.titleKey)}
            className="w-full object-cover"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}
        {/* Section title bar */}
        <div className="px-4 py-3 border-b border-white/[0.04]">
          <h2 className="font-display font-bold text-offwhite text-[1.05rem] tracking-[-0.02em]">
            {t(section.titleKey)}
          </h2>
        </div>
        {/* Items */}
        <div className="p-4 space-y-2">
          {section.items.map(item => {
            const museumId = item.museumMatch ? cameraLookup.get(item.museumMatch) : undefined
            return (
              <div key={item.name} className="flex items-center gap-2.5">
                <div className="w-1 h-1 rounded-full bg-lime/30 flex-shrink-0" />
                {museumId !== undefined ? (
                  <a
                    href={`/muzeum?id=${museumId}`}
                    className="font-body text-offwhite/80 text-[0.8rem] hover:text-lime transition-colors duration-200"
                  >
                    {item.name}
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline ml-1 opacity-40">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
                    </svg>
                  </a>
                ) : (
                  <span className="font-body text-offwhite/80 text-[0.8rem]">{item.name}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
