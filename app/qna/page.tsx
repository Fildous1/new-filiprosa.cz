'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import Contact from '@/components/Contact'
import { useI18n, type Locale } from '@/lib/i18n'
import { fetchFaq, type FaqItem } from '@/lib/cdn-api'

const ease = [0.16, 1, 0.3, 1] as const

export default function QnaPage() {
  const { t, locale } = useI18n()
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -30px 0px' })
  const [items, setItems] = useState<FaqItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)

  useEffect(() => {
    fetchFaq()
      .then(m => { setItems(m.items ?? []); setLoaded(true) })
      .catch(() => setLoaded(true))
  }, [])

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
            className="mb-12"
          >
            <a
              href="/"
              className="inline-flex items-center gap-2 text-[0.8rem] text-muted hover:text-lime transition-colors duration-300 mb-8"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {t('qna.back')}
            </a>
            <h1
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mb-5"
              style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)' }}
            >
              {t('faq.heading')}
            </h1>
            <p
              className="font-body text-muted max-w-[36rem]"
              style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
            >
              {t('faq.description')}
            </p>
          </motion.div>

          {!loaded ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-lime/20 border-t-lime/60 rounded-full animate-spin" />
            </div>
          ) : items.length === 0 ? (
            <p className="font-body text-muted text-center py-20">
              {t('faq.empty')}
            </p>
          ) : (
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
          )}
        </div>
      </main>

      <div className="film-strip" />

      <Contact hideSectionNum />

      <Footer />
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
