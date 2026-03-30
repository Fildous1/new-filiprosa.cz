'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import { CDN_URL } from '@/lib/cdn'

export default function Contact() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '0px 0px -30px 0px' })
  const { locale, t } = useI18n()
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lastSubmit, setLastSubmit] = useState(0)

  async function handleCopyEmail() {
    try {
      await navigator.clipboard.writeText('info@filiprosa.cz')
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea')
      textarea.value = 'info@filiprosa.cz'
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
      setFormError(
        locale === 'cs'
          ? 'Počkejte prosím chvíli před dalším odesláním.'
          : 'Please wait a moment before sending again.'
      )
      setSending(false)
      return
    }

    // Input length validation
    const name = formData.name.trim()
    const email = formData.email.trim()
    const message = formData.message.trim()

    if (name.length > 100 || email.length > 254 || message.length > 5000) {
      setFormError(
        locale === 'cs'
          ? 'Vstupní pole jsou příliš dlouhá.'
          : 'Input fields are too long.'
      )
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
          message,
          locale,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        throw new Error(text || `Error ${res.status}`)
      }

      setSent(true)
      setLastSubmit(Date.now())
      setFormData({ name: '', email: '', message: '' })
      setTimeout(() => setSent(false), 5000)
    } catch (err) {
      setFormError(
        locale === 'cs'
          ? 'Zprávu se nepodařilo odeslat. Zkuste to prosím znovu nebo napište přímo na info@filiprosa.cz.'
          : 'Failed to send message. Please try again or email info@filiprosa.cz directly.'
      )
    } finally {
      setSending(false)
    }
  }

  return (
    <section id="kontakt" className="relative" style={{ padding: 'clamp(5rem, 10vw, 8rem) 0' }}>
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(185,208,38,0.025) 0%, transparent 70%)',
          filter: 'blur(80px)',
        }}
      />

      <div className="relative z-10 max-w-[1200px] mx-auto px-6 lg:px-10" ref={ref}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-20">
          {/* Left — heading + links */}
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="section-num">{t('contact.num')}</span>
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
                    : 'info@filiprosa.cz'
                  }
                </span>
                {!copied && (
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5" className="opacity-0 group-hover:opacity-50 transition-opacity duration-300">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0 0 13.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 0 1-.75.75H9.75a.75.75 0 0 1-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0 1 1.927-.184" />
                  </svg>
                )}
              </button>
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
                  {locale === 'cs' ? 'Jméno' : 'Name'}
                </label>
                <input
                  type="text"
                  required
                  maxLength={100}
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-3 bg-charcoal border border-white/[0.06] rounded-[2px] text-[0.88rem] text-offwhite placeholder:text-muted/25 focus:outline-none focus:border-lime/30 transition-colors duration-200"
                  placeholder={locale === 'cs' ? 'Vaše jméno' : 'Your name'}
                />
              </div>
              <div>
                <label className="block text-[0.68rem] text-muted uppercase tracking-[0.08em] mb-1.5">
                  E-mail
                </label>
                <input
                  type="email"
                  required
                  maxLength={254}
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-3 bg-charcoal border border-white/[0.06] rounded-[2px] text-[0.88rem] text-offwhite placeholder:text-muted/25 focus:outline-none focus:border-lime/30 transition-colors duration-200"
                  placeholder={locale === 'cs' ? 'vas@email.cz' : 'your@email.com'}
                />
              </div>
              <div>
                <label className="block text-[0.68rem] text-muted uppercase tracking-[0.08em] mb-1.5">
                  {locale === 'cs' ? 'Zpráva' : 'Message'}
                </label>
                <textarea
                  required
                  rows={4}
                  maxLength={5000}
                  value={formData.message}
                  onChange={e => setFormData(p => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-3 bg-charcoal border border-white/[0.06] rounded-[2px] text-[0.88rem] text-offwhite placeholder:text-muted/25 focus:outline-none focus:border-lime/30 transition-colors duration-200 resize-y"
                  placeholder={locale === 'cs' ? 'Vaše zpráva...' : 'Your message...'}
                />
              </div>

              {formError && (
                <p className="text-[0.8rem] text-red-400/80">{formError}</p>
              )}

              {sent && (
                <p className="text-[0.8rem] text-lime/80">
                  {locale === 'cs' ? 'Zpráva odeslána! Ozvu se co nejdříve.' : 'Message sent! I\'ll get back to you soon.'}
                </p>
              )}

              <button
                type="submit"
                disabled={sending || sent}
                className="px-8 py-3 text-[0.85rem] font-semibold tracking-[0.03em] bg-lime text-dark rounded-[2px] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(185,208,38,0.2),0_2px_8px_rgba(185,208,38,0.15)] active:translate-y-0 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-3 disabled:opacity-50"
              >
                {sending
                  ? (locale === 'cs' ? 'Odesílám...' : 'Sending...')
                  : sent
                  ? (locale === 'cs' ? 'Odesláno!' : 'Sent!')
                  : (locale === 'cs' ? 'Odeslat zprávu' : 'Send message')
                }
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
