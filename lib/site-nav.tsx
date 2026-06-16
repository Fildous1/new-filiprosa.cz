/**
 * Shared navigation config used by both the header (Navigation) and the
 * footer (Footer), plus the homepage Projects section. Adding or reordering
 * an entry here propagates to every place that renders nav links — there's
 * no duplicated list to keep in sync.
 *
 * Icons are JSX so they can be reused on Projects cards while staying out of
 * the way for plain link contexts (nav, footer).
 */
import type { ReactNode } from 'react'

export interface NavLink {
  /** i18n key resolved at render time. */
  labelKey: string
  href: string
  /** If set, the header shows a dropdown menu sourced from `projectLinks()`
   *  or ABOUT_LINKS for the matching value. Footer ignores this flag. */
  dropdown?: 'projects' | 'about'
}

export interface ProjectEntry {
  /** Stable identifier used to look up the icon, react keys, etc. */
  key: string
  titleKey: string
  descKey: string
  ctaKey: string
  href: string
  icon: ReactNode
}

/** Main header / footer nav links. */
export const MAIN_NAV: readonly NavLink[] = [
  { labelKey: 'nav.pricelist', href: '/cenik' },
  { labelKey: 'nav.qna', href: '/qna' },
  { labelKey: 'nav.gallery', href: '/galerie' },
  { labelKey: 'nav.projects', href: '/#projekty', dropdown: 'projects' },
  { labelKey: 'nav.about', href: '/#o-mne', dropdown: 'about' },
]

/** "About" dropdown content shown under the About nav link. */
export const ABOUT_LINKS: readonly NavLink[] = [
  { labelKey: 'nav.contact', href: '/#kontakt' },
  { labelKey: 'projects.gear.title', href: '/vybaveni' },
]

/**
 * All projects shown on the homepage and in the nav dropdown — single source
 * of truth. Reordering this array reorders both at once.
 */
export const PROJECTS: readonly ProjectEntry[] = [
  {
    key: 'mafos',
    titleKey: 'projects.mafos.title',
    descKey: 'projects.mafos.desc',
    ctaKey: 'projects.mafos.cta',
    href: '/mafos',
    icon: (
      <svg className="w-6 h-6 text-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
      </svg>
    ),
  },
  {
    key: 'museum',
    titleKey: 'projects.museum.title',
    descKey: 'projects.museum.desc',
    ctaKey: 'projects.museum.cta',
    href: '/muzeum',
    icon: (
      <svg className="w-6 h-6 text-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
      </svg>
    ),
  },
  {
    key: 'magazine',
    titleKey: 'projects.magazine.title',
    descKey: 'projects.magazine.desc',
    ctaKey: 'projects.magazine.cta',
    href: '/rosnik',
    icon: (
      <svg className="w-6 h-6 text-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 7.5h1.5m-1.5 3h1.5m-7.5 3h7.5m-7.5 3h7.5m3-9h3.375c.621 0 1.125.504 1.125 1.125V18a2.25 2.25 0 0 1-2.25 2.25M16.5 7.5V18a2.25 2.25 0 0 0 2.25 2.25M16.5 7.5V4.875c0-.621-.504-1.125-1.125-1.125H4.125C3.504 3.75 3 4.254 3 4.875V18a2.25 2.25 0 0 0 2.25 2.25h13.5M6 7.5h3v3H6v-3Z" />
      </svg>
    ),
  },
  {
    key: 'graphics',
    titleKey: 'projects.graphics.title',
    descKey: 'projects.graphics.desc',
    ctaKey: 'projects.graphics.cta',
    href: '/grafika',
    icon: (
      <svg className="w-6 h-6 text-lime" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
      </svg>
    ),
  },
]
