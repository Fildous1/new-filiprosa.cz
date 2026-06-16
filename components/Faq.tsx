'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useI18n, type Locale } from '@/lib/i18n'
import { fetchFaq, type FaqItem } from '@/lib/cdn-api'

const ease = [0.16, 1, 0.3, 1] as const

export default function Faq() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -30px 0px' })
  const { t, locale } = useI18n()
  const [items, setItems] = useState<FaqItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    fetchFaq()
      .then(m => { setItems(m.items ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

  // Hide entire section if there's nothing to show (avoids an empty box on prod).
  // Also suppress before-render to avoid a flash; <Faq /> always renders a leading
  // film-strip so the page rhythm matches the other sections.
  if (!loaded || items.length === 0) return null

  return (
    <>
    <div className="film-strip" />
    <section id="faq" className="relative" style={{ padding: 'clamp(5rem, 10vw, 8rem) 0' }}>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 50% 50% at 80% 30%, rgba(var(--lime-rgb),0.03) 0%, transparent 70%),
            radial-gradient(ellipse 40% 50% at 15% 70%, rgba(var(--darkroom-rgb),0.15) 0%, transparent 60%)
          `,
        }}
      />

      <div className="relative z-1 max-w-[1200px] mx-auto px-6 lg:px-10" ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.9, ease }}
          className="max-w-[36rem] mb-12 md:mb-16"
        >
          <span className="section-num">{t('faq.num')}</span>
          <h2
            className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mt-6 mb-5"
            style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)' }}
          >
            {t('faq.heading')}
          </h2>
          <p
            className="font-body text-muted"
            style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
          >
            {t('faq.description')}
          </p>
        </motion.div>

        <div className="max-w-[42rem] mx-auto flex flex-col gap-3">
          {items.map((item, i) => (
            <FaqRow
              key={item.id}
              item={item}
              index={i}
              isOpen={openId === item.id}
              onToggle={() => setOpenId(prev => prev === item.id ? null : item.id)}
              locale={locale as Locale}
            />
          ))}
        </div>
      </div>
    </section>
    </>
  )
}

function FaqRow({
  item,
  index,
  isOpen,
  onToggle,
  locale,
}: {
  item: FaqItem
  index: number
  isOpen: boolean
  onToggle: () => void
  locale: Locale
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' })

  const question = item.question[locale] || item.question.cs
  const answer = item.answer[locale] || item.answer.cs

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: Math.min(index * 0.05, 0.3), ease }}
      className="bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden"
    >
      <button
        onClick={onToggle}
        className="w-full px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.02] focus-visible:outline-none focus-visible:bg-white/[0.02] transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <span className="font-body font-medium text-offwhite/90 text-[0.9rem] sm:text-[0.95rem]">
          {question}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`flex-shrink-0 text-lime/60 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="px-5 sm:px-6 pb-5 font-body text-muted text-[0.85rem] leading-[1.75] whitespace-pre-line">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
