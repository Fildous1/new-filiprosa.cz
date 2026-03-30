'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { useI18n, type Locale } from '@/lib/i18n'
import { fetchRosnik, rosnikAssetUrl, type MagazineIssue } from '@/lib/cdn-api'

export default function RosnikPage() {
  const { locale, t } = useI18n()
  const [issues, setIssues] = useState<MagazineIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewingPdf, setViewingPdf] = useState<string | null>(null)
  const headerRef = useRef<HTMLDivElement>(null)
  const headerInView = useInView(headerRef, { once: true, margin: '0px 0px -30px 0px' })

  useEffect(() => {
    fetchRosnik()
      .then(data => {
        setIssues(data.issues)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [])

  return (
    <>
      <Navigation />

      {/* Full-screen PDF Overlay */}
      <AnimatePresence>
        {viewingPdf && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[10000] bg-dark flex flex-col"
          >
            {/* Toolbar */}
            <div className="flex items-center justify-between px-6 py-3 bg-charcoal border-b border-white/[0.05]">
              <button
                onClick={() => setViewingPdf(null)}
                className="inline-flex items-center gap-2 text-[0.8rem] text-muted hover:text-lime transition-colors duration-300"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
                {t('magazine.back')}
              </button>
              <a
                href={viewingPdf}
                download
                className="inline-flex items-center gap-2 text-[0.8rem] text-offwhite/40 hover:text-lime transition-colors duration-300"
              >
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12M12 16.5V3" />
                </svg>
                {t('magazine.download')}
              </a>
            </div>
            {/* PDF iframe */}
            <iframe
              src={viewingPdf}
              className="flex-1 w-full border-none"
              title="PDF Viewer"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <main className="min-h-dvh pt-28 pb-20">
        <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
          {/* Header */}
          <motion.div
            ref={headerRef}
            initial={{ opacity: 0, y: 32 }}
            animate={headerInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="mb-16"
          >
            <a
              href="/"
              className="inline-flex items-center gap-2 text-[0.8rem] text-muted hover:text-lime transition-colors duration-300 mb-8"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
              {t('magazine.back')}
            </a>

            {/* Logo only — no heading text */}
            <div className="mb-6">
              <img
                src="/images/rosnik.png"
                alt="Nerovn\u00fd Rosn\u00edk"
                className="h-20 sm:h-24 w-auto"
                style={{ filter: 'drop-shadow(0 0 20px rgba(185,208,38,0.1))' }}
              />
            </div>
            <p
              className="font-body text-muted max-w-[40rem]"
              style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
            >
              {t('magazine.description')}
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
              <p className="text-muted text-[0.9rem]">{locale === 'cs' ? 'Nepoda\u0159ilo se na\u010d\u00edst \u010dasopis.' : 'Failed to load magazine.'}</p>
            </div>
          )}

          {!loading && !error && (
            /* Issues grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {issues.map((issue, i) => {
                const pdfUrl = rosnikAssetUrl(issue.pdf)
                const thumbUrl = rosnikAssetUrl(issue.thumbnail)

                return (
                  <motion.div
                    key={issue.id}
                    initial={{ opacity: 0, y: 32 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.9, delay: 0.08 * (i + 1), ease: [0.16, 1, 0.3, 1] }}
                    className="group"
                  >
                    {/* Thumbnail */}
                    <button
                      onClick={() => setViewingPdf(pdfUrl)}
                      className="relative w-full aspect-[3/4] bg-charcoal border border-white/[0.05] rounded-[2px] overflow-hidden mb-4 cursor-pointer block focus-visible:outline-2 focus-visible:outline-lime"
                      style={{
                        transition: 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(185,208,38,0.06), 0 16px 48px rgba(0,0,0,0.35)'
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)'
                        e.currentTarget.style.boxShadow = 'none'
                      }}
                    >
                      <img
                        src={thumbUrl}
                        alt={issue.title[locale as Locale]}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'linear-gradient(to top, rgba(19,16,16,0.6), transparent 60%)',
                        }}
                      />
                      <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                          background: 'rgba(42,18,21,0.15)',
                          mixBlendMode: 'multiply',
                        }}
                      />
                    </button>

                    {/* Info */}
                    <h3 className="font-display font-bold text-offwhite text-[1rem] tracking-[-0.02em] mb-1">
                      {issue.title[locale as Locale]}
                    </h3>
                    <p className="font-body text-muted text-[0.8rem] mb-3">
                      {issue.date[locale as Locale]}
                    </p>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setViewingPdf(pdfUrl)}
                        className="text-[0.75rem] font-medium text-lime/60 hover:text-lime transition-colors duration-300"
                      >
                        {t('magazine.view')}
                      </button>
                      <a
                        href={pdfUrl}
                        download
                        className="text-[0.75rem] font-medium text-offwhite/30 hover:text-lime transition-colors duration-300"
                      >
                        {t('magazine.download')}
                      </a>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </>
  )
}
