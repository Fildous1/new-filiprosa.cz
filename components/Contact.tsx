'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { CDN_URL } from '@/lib/cdn'
import { fetchSite, type ContactNotice } from '@/lib/cdn-api'

export default function Contact({ hideSectionNum = false }: { hideSectionNum?: boolean } = {}) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -30px 0px' })
  const { locale, t } = useI18n()
  const [formData, setFormData] = useState({ name: '', email: '', service: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lastSubmit, setLastSubmit] = useState(0)
  const [notice, setNotice] = useState<ContactNotice | null>(null)

  useEffect(() => {
    fetchSite()
      .then(site => {
        if (site.contactNotice) setNotice(site.contactNotice)
      })
      .catch(() => {})
  }, [])

  const serviceOptions = [
    { value: 'portrait', label: t('contact.service.portrait') },
    { value: 'event', label: t('contact.service.event') },
    { value: 'product', label: t('contact.service.product') },
    { value: 'development', label: t('contact.service.development') },
    { value: 'scanning', label: t('contact.service.scanning') },
    { value: 'printing', label: t('contact.service.printing') },
    { value: 'other', label: t('contact.service.other') },
  ]

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText('foto@filiprosa.cz')
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = 'foto@filiprosa.cz'
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSending(true)
    setFormError(null)

    // Rate limit: minimum 30 seconds between submissions
    const now = Date.now()
    if (now - lastSubmit < 30000) {
      setFormError(t('contact.form.wait'))
      setSending(false)
      return
    }

    // Input length validation
    const name = formData.name.trim()
    const email = formData.email.trim()
    const service = formData.service
    const message = formData.message.trim()

    if (name.length > 100 || email.length > 254 || message.length > 5000) {
      setFormError(t('contact.form.tooLong'))
      setSending(false)
      return
    }

    if (!name || !email || !message) {
      setSending(false)
      return
    }

    try {
      const res = await fetch(`${CDN_URL}api/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          service,
          message,
          locale,
        }),
      })

      if (!res.ok) {
        if (res.status === 429) {
          setFormError(t('contact.form.rateLimit'))
          return
        }
        throw new Error(`Error ${res.status}`)
      }

      setSent(true)
      setLastSubmit(Date.now())
      setFormData({ name: '', email: '', service: '', message: '' })
      setTimeout(() => setSent(false), 5000)
    } catch {
      setFormError(t('contact.form.fail'))
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="kontakt" className="relative" style={{ padding: 'clamp(5rem, 10vw, 8rem) 0' }}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(var(--lime-rgb),0.025) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-10" ref={ref}>
        {notice && notice.enabled && (notice.text[locale] || notice.text.cs) && (
          <div
            className="w-full rounded-[2px] px-5 py-3 mb-10 text-center"
            style={{
              backgroundColor: `color-mix(in srgb, ${notice.color} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${notice.color} 30%, transparent)`,
              color: notice.color,
              fontSize: `${notice.fontSize}px`,
              fontWeight: notice.bold ? 700 : 400,
              lineHeight: 1.5,
            }}
          >
            {notice.text[locale] || notice.text.cs}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
          {/* Left — heading + links */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            {!hideSectionNum && <span className="section-num">{t('contact.num')}</span>}
            <h2
              className="font-display font-bold text-offwhite tracking-[-0.03em] leading-[1.1] mt-6 mb-5"
              style={{ fontSize: 'clamp(1.8rem, 4.5vw, 3.2rem)' }}
            >
              {t('contact.heading.line1')}
              <br />
              <em className="text-lime italic">{t('contact.heading.line2')}</em>
            </h2>

            <p
              className="font-body text-muted max-w-[28rem] mb-10"
              style={{ fontSize: 'clamp(0.9rem, 1.5vw, 1.05rem)' }}
            >
              {t('contact.description')}
            </p>

            <div className="flex flex-col gap-4">
              <button
                onClick={handleCopyEmail}
                className="inline-flex items-center gap-3 text-offwhite/70 hover:text-lime transition-colors duration-300 group cursor-pointer"
                title={locale === 'cs' ? 'Kliknutím zkopírujete' : 'Click to copy'}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                <span className="text-[0.9rem]">
                  {copied
                    ? (locale === 'cs' ? 'Zkopírováno!' : 'Copied!')
                    : 'foto@filiprosa.cz'
                  }
                </span>
                {!copied && (
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" className="opacity-0 group-hover:opacity-50 transition-opacity duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                )}
              </button>
              <a
                href="tel:+420602942833"
                className="inline-flex items-center gap-3 text-offwhite/70 hover:text-lime transition-colors duration-300 group"
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" className="flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity duration-300">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.105c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                </svg>
                <span className="text-[0.9rem]">+420 602 942 833</span>
              </a>
              <a
                href="https://instagram.com/fildous1"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 text-offwhite/70 hover:text-lime transition-colors duration-300 group"
              >
                <svg className="w-[18px] h-[18px] fill-current flex-shrink-0 opacity-50 group-hover:opacity-100 transition-opacity duration-300" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                </svg>
                <span className="text-[0.9rem]">@fildous1</span>
              </a>
            </div>
          </motion.div>

          {/* Right — contact form */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[0.68rem] text-muted uppercase tracking-[0.08em] mb-1.5">
                  {t('contact.form.name')}
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-charcoal border border-white/[0.06] rounded-[2px] text-[0.88rem] text-offwhite placeholder:text-muted/25 focus:outline-none focus:border-lime/30 transition-colors duration-200"
                  placeholder={t('contact.form.name.placeholder')}
                />
              </div>
              <div>
                <label className="block text-[0.68rem] text-muted uppercase tracking-[0.08em] mb-1.5">
                  {t('contact.form.email')}
                </label>
                <input
                  type="email"
                  required
                  maxLength={254}
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-charcoal border border-white/[0.06] rounded-[2px] text-[0.88rem] text-offwhite placeholder:text-muted/25 focus:outline-none focus:border-lime/30 transition-colors duration-200"
                  placeholder={t('contact.form.email.placeholder')}
                />
              </div>
              <div>
                <label className="block text-[0.68rem] text-muted uppercase tracking-[0.08em] mb-1.5">
                  {t('contact.form.service')}
                </label>
                <ServiceDropdown
                  value={formData.service}
                  options={serviceOptions}
                  placeholder={t('contact.form.service.placeholder')}
                  onChange={v => setFormData(p => ({ ...p, service: v }))}
                />
              </div>
              <div>
                <label className="block text-[0.68rem] text-muted uppercase tracking-[0.08em] mb-1.5">
                  {t('contact.form.message')}
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={5000}
                  value={formData.message}
                  onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-3 bg-charcoal border border-white/[0.06] rounded-[2px] text-[0.88rem] text-offwhite placeholder:text-muted/25 focus:outline-none focus:border-lime/30 transition-colors duration-200 resize-y"
                  placeholder={t('contact.form.message.placeholder')}
                />
              </div>

              {formError && (
                <p className="text-[0.8rem] text-red-400/80">{formError}</p>
              )}

              {sent && (
                <p className="text-[0.8rem] text-lime/80">
                  {t('contact.form.success')}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || sent}
                className="px-8 py-3 text-[0.85rem] font-semibold tracking-[0.03em] bg-lime text-dark rounded-[2px] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(var(--lime-rgb),0.2),0_2px_8px_rgba(var(--lime-rgb),0.15)] active:translate-y-0 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-3 disabled:opacity-50"
              >
                {sending
                  ? t('contact.form.sending')
                  : sent
                  ? t('contact.form.sent')
                  : t('contact.form.submit')
                }
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

interface ServiceOption { value: string; label: string }

function ServiceDropdown({
  value,
  options,
  placeholder,
  onChange,
}: {
  value: string
  options: ServiceOption[]
  placeholder: string
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState<number>(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedIndex = options.findIndex(o => o.value === value)
  const selectedLabel = selectedIndex >= 0 ? options[selectedIndex].label : ''

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handle(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  // When opening, seed highlight to selected (or 0)
  useEffect(() => {
    if (open) setHighlight(selectedIndex >= 0 ? selectedIndex : 0)
  }, [open, selectedIndex])

  function commit(idx: number) {
    if (idx < 0 || idx >= options.length) return
    onChange(options[idx].value)
    setOpen(false)
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setOpen(true)
      }
      return
    }
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); return }
    if (e.key === 'ArrowDown') { e.preventDefault(); setHighlight(h => Math.min(options.length - 1, h + 1)); return }
    if (e.key === 'ArrowUp') { e.preventDefault(); setHighlight(h => Math.max(0, h - 1)); return }
    if (e.key === 'Home') { e.preventDefault(); setHighlight(0); return }
    if (e.key === 'End') { e.preventDefault(); setHighlight(options.length - 1); return }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); commit(highlight); return }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKey}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={`
          w-full px-4 py-3 text-left text-[0.88rem] rounded-[2px]
          bg-charcoal border transition-colors duration-200
          focus:outline-none focus-visible:outline-none
          flex items-center justify-between gap-3
          ${open
            ? 'border-lime/50 ring-1 ring-lime/20 shadow-[0_0_0_3px_rgba(var(--lime-rgb),0.06)]'
            : value
              ? 'border-lime/25 hover:border-lime/40'
              : 'border-white/[0.06] hover:border-white/[0.15]'}
        `}
      >
        <span className={value ? 'text-offwhite' : 'text-muted/40'}>
          {value ? selectedLabel : placeholder}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`flex-shrink-0 transition-all duration-200 ${open ? 'text-lime rotate-180' : value ? 'text-lime/60' : 'text-muted/50'}`}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          className="absolute z-30 left-0 right-0 mt-1.5 max-h-[260px] overflow-auto bg-charcoal border border-lime/25 rounded-[2px] shadow-[0_12px_40px_rgba(0,0,0,0.45),0_0_0_1px_rgba(var(--lime-rgb),0.05)] py-1"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value
            const isHighlighted = i === highlight
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => { e.preventDefault(); commit(i) }}
                className={`
                  px-4 py-2 text-[0.85rem] cursor-pointer flex items-center justify-between gap-3
                  transition-colors duration-100
                  ${isHighlighted ? 'bg-lime/[0.08] text-offwhite' : 'text-offwhite/80'}
                  ${isSelected ? 'text-lime' : ''}
                `}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-lime flex-shrink-0">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                  </svg>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
