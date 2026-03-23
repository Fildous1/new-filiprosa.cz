'use client'

import { useI18n } from '@/lib/i18n'

export default function Footer() {
  const { t } = useI18n()

  return (
    <footer className="border-t border-white/[0.04] py-10">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <span className="font-body text-[0.75rem] text-offwhite/25">
            {t('footer.copyright')}
          </span>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 md:gap-8">
            {[
              { label: t('nav.services'), href: '/#sluzby' },
              { label: t('nav.gallery'), href: '/galerie' },
              { label: t('nav.about'), href: '/#o-mne' },
              { label: t('nav.contact'), href: '/#kontakt' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="font-body text-[0.75rem] text-offwhite/30 hover:text-lime transition-colors duration-300"
              >
                {label}
              </a>
            ))}
          </div>

          <a
            href="https://instagram.com/fildous1"
            target="_blank"
            rel="noopener noreferrer"
            className="text-offwhite/25 hover:text-lime transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime"
            aria-label="Instagram"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
            </svg>
          </a>
        </div>
      </div>
    </footer>
  )
}
