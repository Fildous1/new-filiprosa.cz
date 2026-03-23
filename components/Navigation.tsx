'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useI18n } from '@/lib/i18n'
import Logo from '@/components/Logo'

export default function Navigation() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [projectsOpen, setProjectsOpen] = useState(false)
  const [aboutOpen, setAboutOpen] = useState(false)
  const projectsRef = useRef<HTMLDivElement>(null)
  const aboutRef = useRef<HTMLDivElement>(null)
  const projectsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const aboutTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { locale, setLocale, t } = useI18n()

  const links = [
    { label: t('nav.services'), href: '/#sluzby' },
    { label: t('nav.gallery'), href: '/galerie' },
    { label: t('nav.projects'), href: '/#projekty', dropdown: 'projects' as const },
    { label: t('nav.about'), href: '/#o-mne', dropdown: 'about' as const },
  ]

  const projectLinks = [
    { label: t('projects.museum.title'), href: '/muzeum' },
    { label: t('projects.magazine.title'), href: '/rosnik' },
  ]

  const aboutLinks = [
    { label: t('nav.contact'), href: '/#kontakt' },
    { label: t('projects.gear.title'), href: '/vybaveni' },
  ]

  function handleEnter(which: 'projects' | 'about') {
    if (which === 'projects') {
      if (projectsTimeout.current) clearTimeout(projectsTimeout.current)
      setProjectsOpen(true)
    } else {
      if (aboutTimeout.current) clearTimeout(aboutTimeout.current)
      setAboutOpen(true)
    }
  }

  function handleLeave(which: 'projects' | 'about') {
    if (which === 'projects') {
      projectsTimeout.current = setTimeout(() => setProjectsOpen(false), 150)
    } else {
      aboutTimeout.current = setTimeout(() => setAboutOpen(false), 150)
    }
  }

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (projectsRef.current && !projectsRef.current.contains(e.target as Node)) {
        setProjectsOpen(false)
      }
      if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) {
        setAboutOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  function renderDropdown(
    which: 'projects' | 'about',
    label: string,
    href: string,
    dropdownLinks: { label: string; href: string }[],
    isOpen: boolean,
    ref: React.RefObject<HTMLDivElement | null>,
  ) {
    return (
      <div
        key={label}
        ref={ref}
        className="relative"
        onMouseEnter={() => handleEnter(which)}
        onMouseLeave={() => handleLeave(which)}
      >
        <a
          href={href}
          className="relative text-[0.82rem] font-medium tracking-[0.03em] text-offwhite/50 hover:text-offwhite transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-4 group inline-flex items-center gap-1"
          onClick={(e) => {
            if (which === 'about') {
              // About link navigates directly; dropdown shows on hover
              return
            }
            e.preventDefault()
            setProjectsOpen(p => !p)
          }}
        >
          {label}
          <svg
            width="10"
            height="10"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
          <span className="absolute bottom-[-3px] left-0 w-0 h-px bg-lime transition-[width] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full group-focus-visible:w-full" />
        </a>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-48 bg-[rgba(19,16,16,0.95)] backdrop-blur-[16px] border border-white/[0.08] rounded-[3px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
            >
              {dropdownLinks.map(link => (
                <a
                  key={link.href}
                  href={link.href}
                  className="block px-4 py-2.5 text-[0.8rem] text-offwhite/50 hover:text-lime hover:bg-white/[0.03] transition-colors duration-200"
                  onClick={() => {
                    setProjectsOpen(false)
                    setAboutOpen(false)
                  }}
                >
                  {link.label}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-100 backdrop-blur-[16px] backdrop-saturate-[1.6] bg-[rgba(19,16,16,0.78)] border-b border-white/[0.04]">
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 flex items-center justify-between h-16 md:h-[4.5rem]">
        {/* Logo */}
        <a href="/" aria-label="Filip Rosa">
          <Logo className="h-9 w-auto" />
        </a>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map(({ label, href, dropdown }) =>
            dropdown === 'projects'
              ? renderDropdown('projects', label, href, projectLinks, projectsOpen, projectsRef)
              : dropdown === 'about'
              ? renderDropdown('about', label, href, aboutLinks, aboutOpen, aboutRef)
              : (
                <a
                  key={label}
                  href={href}
                  className="relative text-[0.82rem] font-medium tracking-[0.03em] text-offwhite/50 hover:text-offwhite transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-4 group"
                >
                  {label}
                  <span className="absolute bottom-[-3px] left-0 w-0 h-px bg-lime transition-[width] duration-350 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full group-focus-visible:w-full" />
                </a>
              )
          )}
        </div>

        {/* Desktop right: Lang toggle + CTA */}
        <div className="hidden md:flex items-center gap-5">
          <button
            onClick={() => setLocale(locale === 'cs' ? 'en' : 'cs')}
            className="text-[0.75rem] font-semibold tracking-[0.1em] uppercase text-offwhite/40 hover:text-lime border border-offwhite/[0.1] hover:border-lime/30 px-3 py-1.5 rounded-[2px] transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime"
          >
            {locale === 'cs' ? 'EN' : 'CZ'}
          </button>
          <a
            href="/#kontakt"
            className="inline-flex items-center gap-2 px-5 py-2 text-[0.8rem] font-semibold tracking-[0.03em] bg-lime text-dark rounded-[2px] hover:translate-y-[-2px] hover:shadow-[0_8px_32px_rgba(181,202,44,0.2),0_2px_8px_rgba(181,202,44,0.15)] active:translate-y-0 transition-transform duration-250 ease-[cubic-bezier(0.16,1,0.3,1)] focus-visible:outline-2 focus-visible:outline-lime focus-visible:outline-offset-3"
          >
            {t('nav.cta')}
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 19.5l15-15m0 0H8.25m11.25 0v11.25" />
            </svg>
          </a>
        </div>

        {/* Mobile: Lang + Hamburger */}
        <div className="md:hidden flex items-center gap-3">
          <button
            onClick={() => setLocale(locale === 'cs' ? 'en' : 'cs')}
            className="text-[0.7rem] font-semibold tracking-[0.1em] uppercase text-offwhite/40 hover:text-lime border border-offwhite/[0.1] px-2.5 py-1 rounded-[2px] transition-colors duration-300"
          >
            {locale === 'cs' ? 'EN' : 'CZ'}
          </button>
          <button
            className="flex p-2 bg-transparent border-none text-offwhite/50 hover:text-lime transition-colors duration-300 focus-visible:outline-2 focus-visible:outline-lime"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden overflow-hidden bg-[rgba(19,16,16,0.95)] border-t border-white/[0.04]"
          >
            <div className="p-6 flex flex-col gap-5">
              {links.map(({ label, href, dropdown }) =>
                dropdown ? (
                  <div key={label}>
                    <div className="flex items-center gap-1.5">
                      <a
                        href={href}
                        className="text-[0.9rem] text-offwhite/50 hover:text-lime transition-colors duration-300"
                        onClick={() => setMobileOpen(false)}
                      >
                        {label}
                      </a>
                      <button
                        className="text-offwhite/50 hover:text-lime transition-colors duration-300 p-1"
                        onClick={() => {
                          if (dropdown === 'projects') setProjectsOpen(p => !p)
                          else setAboutOpen(p => !p)
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          className={`transition-transform duration-200 ${
                            (dropdown === 'projects' ? projectsOpen : aboutOpen) ? 'rotate-180' : ''
                          }`}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                        </svg>
                      </button>
                    </div>
                    <AnimatePresence>
                      {((dropdown === 'projects' && projectsOpen) || (dropdown === 'about' && aboutOpen)) && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pl-4 pt-3 flex flex-col gap-3">
                            {(dropdown === 'projects' ? projectLinks : aboutLinks).map(link => (
                              <a
                                key={link.href}
                                href={link.href}
                                className="text-[0.85rem] text-offwhite/40 hover:text-lime transition-colors duration-300"
                                onClick={() => setMobileOpen(false)}
                              >
                                {link.label}
                              </a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <a
                    key={label}
                    href={href}
                    className="text-[0.9rem] text-offwhite/50 hover:text-lime transition-colors duration-300"
                    onClick={() => setMobileOpen(false)}
                  >
                    {label}
                  </a>
                )
              )}
              <a
                href="/#kontakt"
                className="mt-2 inline-flex items-center justify-center gap-2 px-5 py-3.5 text-[0.85rem] font-semibold bg-lime text-dark rounded-[2px]"
                onClick={() => setMobileOpen(false)}
              >
                {t('nav.cta')}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  )
}
