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
    'hero.description': 'Portrétové focení, produktová fotografie, vyvolávání filmů a\u00A0darkroom tisky.',
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
    'work.heading': 'Ukázky fotografií',
    'work.description': 'Výběr z mých fotografií, které jsem vyfotil za posledních několik let.',

    // Projects
    'projects.num': '03',
    'projects.heading': 'Projekty',
    'projects.description': 'Projekty, na který pracuji, nebo jsem dříve pracoval a jsem na ně pyšný.',
    'projects.museum.title': 'Muzeum foťáků',
    'projects.museum.desc': 'Analogové (i digitální) fotoaparáty v mojí sbírce. S fotkami a ukázkovými snímky',
    'projects.museum.cta': 'Navštívit muzeum',
    'projects.magazine.title': 'Nerovný Rosník',
    'projects.magazine.desc': 'Můj časopis s úvahami, články, básničkami a anketami dostupný k prohlížení nebo stažení.',
    'projects.magazine.cta': 'Číst časopis',
    'projects.meetup.title': 'Meetup',
    'projects.meetup.desc': 'Platforma pro hledání ideálního termínu pro všechny účastníky eventu.',
    'projects.meetup.cta': 'Naplánovat akci',
    'projects.gear.title': 'Vybavení',

    // About
    'about.num': '04',
    'about.heading': 'Filip Rosa',
    'about.p1': 'O focení jsem se začal zajímat, když moje maminka našla ve skříni první zrcadlovku, kterou jsem kdy držel v ruce - Canon EOS 650. Uchvátila mně hned jsem si koupil barevný film, na který jsem nafotil 36 fotek, které bych se dnes styděl ukázat. Ale od té doby jsem se začal věnovat všemu spojenému s fotografií. Historii, analogu, příběhům i technice.',
    'about.p2': 'Dnes se focením zabývám většinu svého volného času a je mým velkým koníčkem. Rád bych se začal focením živit a věnoval se mu profesionálně. Proto jsem rád za každou zkušenost, a to i tu negativní.',
    'about.stat1.value': '3+',
    'about.stat1.label': 'Roky za objektivem',
    'about.stat2.value': '50+',
    'about.stat2.label': 'nafocených eventů',
    'about.stat3.value': '1000+',
    'about.stat3.label': 'hodin v Lightroomu',

    // Contact
    'contact.num': '05',
    'contact.heading.line1': 'Pojďme společně',
    'contact.heading.line2': 'tvořit',
    'contact.description': 'Máte zájem o\u00A0focení, vyvolávání filmů, darkroom výtisky, nebo potřebujete s nečím poradit? Napište mi, rád vám odpovím.',

    // Footer
    'footer.copyright': '\u00A9 2026 Filip Rosa',

    // Gallery
    'gallery.heading': 'Galerie',
    'gallery.description': 'Výběr těch nejlepších digitálníxch i analogových fotek, které jsem za svůj život vyfotil. Můžete je filtrovat podle portrétů, krajin, skupin atd.',
    'gallery.back': 'Zpět',
    'gallery.download': 'Stáhnout',
    'gallery.all': 'Vše',

    // Magazine
    'magazine.heading': 'Nerovný Rosník',
    'magazine.description': 'Nerovný Rosník je mnou vytvořený časopis, který obsahuje nejrůznější úvahy, články a\u00A0průzkumy spojené s mými zájmy. Původně se jednalo jenom o\u00A0úkol do\u00A0češtiny, ale po\u00A0ohlasech, které jsem dostal jsem se rozhodl vydat i\u00A0další.',
    'magazine.download': 'Stáhnout PDF',
    'magazine.view': 'Zobrazit',
    'magazine.back': 'Zpět',

    // Gear
    'gear.heading': 'Vybavení',
    'gear.description': 'Technika se kterou pracuji na denní bázi. Těla, objektivy, příslušenství a vše potřebné pro analogovou fotografii. Moje vybavení není nejdražší, ale za to dobře vím, jak ho používat.',
    'gear.analog': 'Analogová těla',
    'gear.digital': 'Digitální těla',
    'gear.optics': 'Optika a\u00A0příslušenství',
    'gear.film': 'Filmy',
    'gear.darkroom': 'Vyvolávání',
    'gear.printing': 'Temná komora',
    'gear.digitalDarkroom': 'PC setup',
    'gear.back': 'Zpět',

    // Museum
    'museum.heading': 'Muzeum foťáků',
    'museum.description': 'Sbírka analogových (i digitálních) fotoaparátů. Některé jsem koupil a některé dostal. Každý má u sebe fotky a ukázkové snímky.',
    'museum.back': 'Zpět na muzeum',
    'museum.year': 'Rok výroby',
    'museum.country': 'Země původu',
    'museum.format': 'Senzor',
    'museum.type': 'Typ',
    'museum.price': 'Pořizovací cena',
    'museum.acquired': 'Rok pořízení',
    'museum.working': 'Funkční',
    'museum.flash': 'S bleskem',
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
    'hero.description': 'Portrait photography, product shoots, film development and\u00A0darkroom prints.',
    'hero.cta.services': 'View photos',
    'hero.cta.contact': 'Contact me',
    'hero.scroll': 'Scroll',

    // Services
    'services.num': '01',
    'services.heading': 'What I\u00A0can do for you',
    'services.description': 'From portraits to darkroom prints \u2014 every service is handcrafted work, done with love and\u00A0precision.',
    'services.portrait.title': 'Portrait photography',
    'services.portrait.desc': 'Portrait, wedding and\u00A0event photography. Natural light, authentic moments.',
    'services.product.title': 'Product photography',
    'services.product.desc': 'Professional product shots for e-shops, catalogs and\u00A0social media.',
    'services.darkroom.title': 'Darkroom prints',
    'services.darkroom.desc': 'B&W prints from negatives on an enlarger. Every print is an original from the darkroom.',
    'services.bw.title': 'B&W film development',
    'services.bw.desc': 'Hand-developing black and white film. Precise control of contrast, grain and\u00A0tonality.',
    'services.scan.title': 'Film scanning',
    'services.scan.desc': '35mm, 120 and\u00A0large format. High resolution, true colors, careful post-production.',
    'services.restore.title': 'Photo restoration',
    'services.restore.desc': 'Restoring old and\u00A0damaged photographs. New life for your memories.',

    // Work
    'work.num': '02',
    'work.heading': 'Photo samples',
    'work.description': 'A selection of my photographs that I have taken over the past few years.',

    // Projects
    'projects.num': '03',
    'projects.heading': 'Projects',
    'projects.description': 'Projects I am working on or have worked on in the past and am proud of.',
    'projects.museum.title': 'Camera Museum',
    'projects.museum.desc': 'Analog (and digital) cameras in my collection. With photos and sample shots.',
    'projects.museum.cta': 'Visit museum',
    'projects.magazine.title': 'Nerovn\u00FD Rosn\u00EDk',
    'projects.magazine.desc': 'My magazine with essays, articles, poems and surveys available to browse or download.',
    'projects.magazine.cta': 'Read magazine',
    'projects.meetup.title': 'Meetup',
    'projects.meetup.desc': 'A platform for finding the ideal date for all event participants.',
    'projects.meetup.cta': 'Plan an event',
    'projects.gear.title': 'Gear',

    // About
    'about.num': '04',
    'about.heading': 'Filip Rosa',
    'about.p1': 'I got interested in photography when my mom found the first SLR I ever held in my hands \u2014 a Canon EOS 650 \u2014 in a closet. I was captivated immediately, bought a color film and shot 36 photos I would be ashamed to show today. But since then I started dedicating myself to everything related to photography. History, analog, stories and technique.',
    'about.p2': 'Today I spend most of my free time on photography and it is my great hobby. I would like to start making a living from photography and pursue it professionally. That is why I appreciate every experience, even the negative ones.',
    'about.stat1.value': '3+',
    'about.stat1.label': 'Years behind the lens',
    'about.stat2.value': '50+',
    'about.stat2.label': 'events photographed',
    'about.stat3.value': '1000+',
    'about.stat3.label': 'hours in Lightroom',

    // Contact
    'contact.num': '05',
    'contact.heading.line1': 'Let\'s create',
    'contact.heading.line2': 'together',
    'contact.description': 'Interested in a\u00A0shoot, film development, darkroom prints, or need advice on something? Write to me, I\'ll be happy to respond.',

    // Footer
    'footer.copyright': '\u00A9 2026 Filip Rosa',

    // Gallery
    'gallery.heading': 'Gallery',
    'gallery.description': 'A selection of the best digital and analog photos I have taken in my life. You can filter them by portraits, landscapes, groups, etc.',
    'gallery.back': 'Back',
    'gallery.download': 'Download',
    'gallery.all': 'All',

    // Magazine
    'magazine.heading': 'Nerovn\u00FD Rosn\u00EDk',
    'magazine.description': 'Nerovn\u00FD Rosn\u00EDk is a magazine I created that contains various essays, articles and\u00A0surveys related to my interests. Originally it was just a\u00A0Czech class assignment, but after the feedback I\u00A0received I decided to publish more issues.',
    'magazine.download': 'Download PDF',
    'magazine.view': 'View',
    'magazine.back': 'Back',

    // Gear
    'gear.heading': 'Gear',
    'gear.description': 'The equipment I work with on a daily basis. Bodies, lenses, accessories and everything needed for analog photography. My gear is not the most expensive, but I know well how to use it.',
    'gear.analog': 'Analog Bodies',
    'gear.digital': 'Digital Bodies',
    'gear.optics': 'Optics &\u00A0Accessories',
    'gear.film': 'Films',
    'gear.darkroom': 'Film Development',
    'gear.printing': 'Darkroom',
    'gear.digitalDarkroom': 'PC Setup',
    'gear.back': 'Back',

    // Museum
    'museum.heading': 'Camera Museum',
    'museum.description': 'A collection of analog (and digital) cameras. Some I bought and some I received as gifts. Each one has photos and sample shots.',
    'museum.back': 'Back to museum',
    'museum.year': 'Year of manufacture',
    'museum.country': 'Country of origin',
    'museum.format': 'Sensor',
    'museum.type': 'Type',
    'museum.price': 'Purchase price',
    'museum.acquired': 'Year acquired',
    'museum.working': 'Working',
    'museum.flash': 'With flash',
    'museum.yes': 'Yes',
    'museum.no': 'No',
    'museum.note': 'Note',
    'museum.all': 'All',
    'museum.broken': 'Broken',
  },
}
