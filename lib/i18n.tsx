'use client'

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'

export type Locale = 'cs' | 'en'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string) => string
}

const I18nContext = createContext<I18nContextType | null>(null)

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('cs')

  useEffect(() => {
    const saved = localStorage.getItem('locale') as Locale | null
    if (saved === 'cs' || saved === 'en') {
      setLocaleState(saved)
    }
  }, [])

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('locale', l)
    document.documentElement.lang = l
  }, [])

  const t = useCallback((key: string): string => {
    const val = translations[locale]?.[key]
    if (!val) return key
    return val
  }, [locale])

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

const translations: Record<Locale, Record<string, string>> = {
  cs: {
    // Navigation
    'nav.services': 'Služby',
    'nav.about': 'O\u00A0mně',
    'nav.contact': 'Kontakt',
    'nav.gallery': 'Galerie',
    'nav.projects': 'Projekty',
    'nav.work': 'Práce',
    'nav.cta': 'Napište mi',

    // Hero
    'hero.title.line1': 'Ruční práce',
    'hero.title.line2': 'v\u00A0každé fotografii',
    'hero.description': 'Portrétové focení, produktová fotografie, vyvolávání filmů a\u00A0darkroom tisky. Každý snímek vypráví příběh.',
    'hero.cta.services': 'Prohlédnout fotky',
    'hero.cta.contact': 'Kontaktujte mě',
    'hero.scroll': 'Scroll',

    // Services
    'services.num': '01',
    'services.heading': 'Co pro vás mohu udělat',
    'services.description': 'Od portrétů po darkroom tisk — každá služba je řemeslná práce, kterou dělám s\u00A0láskou a\u00A0precizností.',
    'services.portrait.title': 'Portrétní focení',
    'services.portrait.desc': 'Portrétová, svatební a\u00A0eventová fotografie. Přirozené světlo, autentické momenty.',
    'services.product.title': 'Produktová fotografie',
    'services.product.desc': 'Profesionální produktové snímky pro e-shopy, katalogy a\u00A0sociální sítě.',
    'services.darkroom.title': 'Darkroom tisky',
    'services.darkroom.desc': 'Černobílé tisky z\u00A0negativu na zvětšovacím přístroji. Každý tisk je originál z\u00A0temné komory.',
    'services.bw.title': 'Vyvolávání ČB filmů',
    'services.bw.desc': 'Ruční vyvolávání černobílých filmů. Precizní kontrola kontrastu, zrna a\u00A0tonality.',
    'services.scan.title': 'Skenování filmů',
    'services.scan.desc': '35mm, 120 i\u00A0velký formát. Vysoké rozlišení, věrné barvy, pečlivá post-produkce.',
    'services.restore.title': 'Restaurování fotek',
    'services.restore.desc': 'Obnova starých a\u00A0poškozených fotografií. Nový život vašim vzpomínkám.',

    // Work
    'work.num': '02',
    'work.heading': 'Ukázky práce',
    'work.description': 'Výběr z\u00A0mých fotografií — od portrétů přes street po darkroom.',

    // Projects
    'projects.num': '03',
    'projects.heading': 'Projekty',
    'projects.description': 'Dlouhodobé projekty, které mi leží na srdci.',
    'projects.museum.title': 'Muzeum foťáků',
    'projects.museum.desc': 'Sbírka mých vintage fotoaparátů — detailní fotky, příběhy a\u00A0technické specifikace každého kusu.',
    'projects.museum.cta': 'Navštívit muzeum',
    'projects.magazine.title': 'Nerovný Rosník',
    'projects.magazine.desc': 'Vlastní časopis s\u00A0úvahami, články, básničkami a\u00A0křížovkami. PDF verze ke stažení a\u00A0prohlížení online.',
    'projects.magazine.cta': 'Číst časopis',
    'projects.meetup.title': 'Meetup',
    'projects.meetup.desc': 'Platforma pro hledání ideálního termínu pro všechny účastníky eventu',
    'projects.meetup.cta': 'Zobrazit meetup',
    'projects.gear.title': 'Vybavení',

    // About
    'about.num': '04',
    'about.heading': 'Filip Rosa',
    'about.p1': 'Fotím třetím rokem a\u00A0každým dnem se učím něco nového. Analogová fotografie mě úplně pohltila — od momentu, kdy jsem poprvé viděl obraz vystupovat z\u00A0vývojky, jsem věděl, že tohle chci dělat naplno.',
    'about.p2': 'Snažím se posouvat svoje řemeslo co nejvýš. Pracuji s\u00A0filmem, vyvolávám v\u00A0temné komoře a\u00A0každý snímek dotahuji rukou. Mým cílem je dostat se na profesionální úroveň a\u00A0dělat fotografii, která má duši.',
    'about.stat1.value': '3+',
    'about.stat1.label': 'Roky za objektivem',
    'about.stat2.value': 'Film',
    'about.stat2.label': '35mm & 120',
    'about.stat3.value': 'B&W',
    'about.stat3.label': 'Darkroom tisky',

    // Contact
    'contact.num': '05',
    'contact.heading.line1': 'Pojďme tvořit',
    'contact.heading.line2': 'společně',
    'contact.description': 'Máte zájem o\u00A0focení, vyvolávání filmů, nebo darkroom tisky? Napište mi a\u00A0domluvíme se.',

    // Footer
    'footer.copyright': '\u00A9 2026 Filip Rosa',

    // Gallery
    'gallery.heading': 'Galerie',
    'gallery.description': 'Výběr z\u00A0mého fotografického portfolia. Analogová i\u00A0digitální fotografie.',
    'gallery.back': 'Zpět',
    'gallery.download': 'Stáhnout',
    'gallery.all': 'Vše',

    // Magazine
    'magazine.heading': 'Nerovný Rosník',
    'magazine.description': 'Nerovný Rosník je časopis, který obsahuje nejrůznější úvahy, články a\u00A0průzkumy týkající se mých zájmů. Původně se jednalo jenom o\u00A0splnění úkolu do\u00A0češtiny, ale po\u00A0zpětné vazbě jsem se rozhodl vydat i\u00A0další, jelikož mě to bavilo.',
    'magazine.download': 'Stáhnout PDF',
    'magazine.view': 'Zobrazit',
    'magazine.back': 'Zpět',

    // Gear
    'gear.heading': 'Vybavení',
    'gear.description': 'Přehled veškerého vybavení, se kterým pracuji — od těl fotoaparátů přes optiku až po temnou komoru.',
    'gear.analog': 'Analogová těla',
    'gear.digital': 'Digitální těla',
    'gear.optics': 'Optika a\u00A0příslušenství',
    'gear.film': 'Filmy',
    'gear.darkroom': 'Vyvolávání',
    'gear.printing': 'Zvětšování',
    'gear.digitalDarkroom': 'Digitální temná komora',
    'gear.back': 'Zpět',

    // Museum
    'museum.heading': 'Muzeum foťáků',
    'museum.description': 'Moje sbírka analogových i\u00A0digitálních fotoaparátů. Každý kus má svůj příběh.',
    'museum.back': 'Zpět na muzeum',
    'museum.year': 'Rok výroby',
    'museum.country': 'Země původu',
    'museum.format': 'Formát',
    'museum.type': 'Typ',
    'museum.price': 'Pořizovací cena',
    'museum.acquired': 'Rok pořízení',
    'museum.working': 'Funkční',
    'museum.flash': 'Blesk',
    'museum.yes': 'Ano',
    'museum.no': 'Ne',
    'museum.note': 'Poznámka',
    'museum.all': 'Vše',
    'museum.broken': 'Nefunkční',
  },
  en: {
    // Navigation
    'nav.services': 'Services',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.gallery': 'Gallery',
    'nav.projects': 'Projects',
    'nav.work': 'Work',
    'nav.cta': 'Get in touch',

    // Hero
    'hero.title.line1': 'Handcraft',
    'hero.title.line2': 'in\u00A0every photograph',
    'hero.description': 'Portrait photography, product shoots, film development and\u00A0darkroom prints. Every frame tells a story.',
    'hero.cta.services': 'View photos',
    'hero.cta.contact': 'Contact me',
    'hero.scroll': 'Scroll',

    // Services
    'services.num': '01',
    'services.heading': 'What I can do for you',
    'services.description': 'From portraits to traditional darkroom prints \u2014 every service is handcrafted work, done with love and precision.',
    'services.portrait.title': 'Portrait photography',
    'services.portrait.desc': 'Portrait, wedding and event photography. Natural light, authentic moments.',
    'services.product.title': 'Product photography',
    'services.product.desc': 'Professional product shots for e-shops, catalogs and social media.',
    'services.darkroom.title': 'Darkroom prints',
    'services.darkroom.desc': 'B&W prints from negatives on an enlarger. Every print is an original from the darkroom.',
    'services.bw.title': 'B&W film development',
    'services.bw.desc': 'Hand-developing black and white film. Precise control of contrast, grain and tonality.',
    'services.scan.title': 'Film scanning',
    'services.scan.desc': '35mm, 120 and large format. High resolution, true colors, careful post-production.',
    'services.restore.title': 'Photo restoration',
    'services.restore.desc': 'Restoring old and damaged photographs. New life for your memories.',

    // Work
    'work.num': '02',
    'work.heading': 'Work samples',
    'work.description': 'A selection of my photographs \u2014 from portraits to street to darkroom.',

    // Projects
    'projects.num': '03',
    'projects.heading': 'Projects',
    'projects.description': 'Long-term projects close to my heart.',
    'projects.museum.title': 'Camera Museum',
    'projects.museum.desc': 'My collection of vintage cameras \u2014 detailed photos, stories and technical specs of each piece.',
    'projects.museum.cta': 'Visit museum',
    'projects.magazine.title': 'Nerovn\u00FD Rosn\u00EDk',
    'projects.magazine.desc': 'My own magazine with essays, articles, poems and crosswords. PDF versions to download and browse online.',
    'projects.magazine.cta': 'Read magazine',
    'projects.meetup.title': 'Meetup',
    'projects.meetup.desc': 'A platform for organizing photography meetups, workshops and group shoots.',
    'projects.meetup.cta': 'View meetup',
    'projects.gear.title': 'Gear',

    // About
    'about.num': '04',
    'about.heading': 'Filip Rosa',
    'about.p1': 'I\'ve been shooting for three years and learning something new every day. Analog photography completely consumed me \u2014 from the moment I first saw an image emerge from the developer, I knew this was what I wanted to do.',
    'about.p2': 'I strive to push my craft as high as possible. I work with film, develop in the darkroom, and finish every frame by hand. My goal is to reach a professional level and create photography that has soul.',
    'about.stat1.value': '3+',
    'about.stat1.label': 'Years behind the lens',
    'about.stat2.value': 'Film',
    'about.stat2.label': '35mm & 120',
    'about.stat3.value': 'B&W',
    'about.stat3.label': 'Darkroom prints',

    // Contact
    'contact.num': '05',
    'contact.heading.line1': 'Let\'s create',
    'contact.heading.line2': 'together',
    'contact.description': 'Interested in a shoot, film development, or darkroom prints? Write to me and we\'ll work it out.',

    // Footer
    'footer.copyright': '\u00A9 2026 Filip Rosa',

    // Gallery
    'gallery.heading': 'Gallery',
    'gallery.description': 'A selection from my photography portfolio. Analog and digital photography.',
    'gallery.back': 'Back',
    'gallery.download': 'Download',
    'gallery.all': 'All',

    // Magazine
    'magazine.heading': 'Nerovn\u00FD Rosn\u00EDk',
    'magazine.description': 'Nerovn\u00FD Rosn\u00EDk is a magazine containing various essays, articles and surveys on my interests. It started as a Czech homework assignment, but after positive feedback I decided to publish more issues.',
    'magazine.download': 'Download PDF',
    'magazine.view': 'View',
    'magazine.back': 'Back',

    // Gear
    'gear.heading': 'Gear',
    'gear.description': 'An overview of all the gear I work with — from camera bodies through optics to the darkroom.',
    'gear.analog': 'Analog Bodies',
    'gear.digital': 'Digital Bodies',
    'gear.optics': 'Optics & Accessories',
    'gear.film': 'Films',
    'gear.darkroom': 'Darkroom',
    'gear.printing': 'Printing',
    'gear.digitalDarkroom': 'Digital Darkroom',
    'gear.back': 'Back',

    // Museum
    'museum.heading': 'Camera Museum',
    'museum.description': 'My collection of analog and digital cameras. Every piece has its own story.',
    'museum.back': 'Back to museum',
    'museum.year': 'Release year',
    'museum.country': 'Country of origin',
    'museum.format': 'Format',
    'museum.type': 'Type',
    'museum.price': 'Purchase price',
    'museum.acquired': 'Year acquired',
    'museum.working': 'Working',
    'museum.flash': 'Flash',
    'museum.yes': 'Yes',
    'museum.no': 'No',
    'museum.note': 'Note',
    'museum.all': 'All',
    'museum.broken': 'Broken',
  },
}
