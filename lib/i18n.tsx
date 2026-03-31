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
    'hero.description': 'Focení, vyvolávání, skenování, tisknutí a mnohem více dělám s pečlivostí a zájmem.',
    'hero.cta.services': 'Prohlédnout fotky',
    'hero.cta.contact': 'Kontaktujte mě',
    'hero.scroll': 'Scroll',

    // Services
    'services.num': '01',
    'services.heading': 'Co pro vás mohu udělat',
    'services.description': 'Tato sekce je momentálně WIP...',
    'services.portrait.title': 'Portrétní focení',
    'services.portrait.desc': '...',
    'services.product.title': 'Produktová fotografie',
    'services.product.desc': '...',
    'services.darkroom.title': 'Darkroom tisky',
    'services.darkroom.desc': '...',
    'services.bw.title': 'Vyvolávání ČB filmů',
    'services.bw.desc': '...',
    'services.scan.title': 'Skenování filmů',
    'services.scan.desc': '...',
    'services.restore.title': 'Restaurování fotek',
    'services.restore.desc': '...',

    // Work
    'work.num': '02',
    'work.heading': 'Ukázky fotografií',
    'work.description': 'Výběr z mých fotografií, které jsem vyfotil za posledních několik let.',

    // Projects
    'projects.num': '03',
    'projects.heading': 'Projekty',
    'projects.description': 'Moje minulé a aktuální projekty, na které jsem pyšný.',
    'projects.museum.title': 'Muzeum foťáků',
    'projects.museum.desc': 'Analogové (i digitální) fotoaparáty v mojí sbírce. S fotkami a ukázkovými snímky',
    'projects.museum.cta': 'Navštívit muzeum',
    'projects.magazine.title': 'Nerovný Rosník',
    'projects.magazine.desc': 'Můj časopis s úvahami, články, básničkami a anketami dostupný k prohlížení nebo stažení.',
    'projects.magazine.cta': 'Číst časopis',
    'projects.meetup.title': 'Meetup',
    'projects.meetup.desc': 'Platforma pro hledání ideálního termínu pro všechny účastníky eventu.',
    'projects.meetup.cta': 'Naplánovat akci',
    'projects.mafos.title': 'Mafoš',
    'projects.mafos.desc': 'DSLR skener svitkových a 35mm filmů, který lze vytisknout na 3D tiskárně.',
    'projects.mafos.cta': 'Zobrazit projekt',
    'projects.gear.title': 'Vybavení',

    // Mafos page
    'mafos.back': 'Zpět',
    'mafos.subtitle': 'DSLR skener svitkových a 35mm filmů.',
    'mafos.about.heading': 'Co je Mafoš',
    'mafos.about.p1': 'Mafoš je filmový skener založení na principu DSLR skenování. Umožňuje skenovat 35mm i svitkové negativy pomocí digitální zrcadlovky a podsvícení z\u00A0mobilního telefonu.',
    'mafos.about.p2': 'Je vytisklý na 3D tiskárně, takže náklady na jeho výrobu jsou v porovnání s konkurencí prakticky mizivé. Tento systém skenování zároveň poskytuje vysoké rozlišení a kontrolu nad finálním výsledkem.',
    'mafos.about.stat1.1': 'Přes 200',
    'mafos.about.stat1.2': 'filmů naskenováno',
    'mafos.about.stat2.1': 'Až 50 MP',
    'mafos.about.stat2.2': 'rozlišení skenů',
    'mafos.about.stat3.1': '35mm',
    'mafos.about.stat3.2': '120 a 220 filmy',
    'mafos.conversion.heading': 'Konverze negativu',
    'mafos.conversion.p1': 'Proces skenování zahrnuje pět kroků \u2014 od surového skenu negativu až po finální upravenou fotografii. Negativ se vyfotí digitální zrcadlovkou, ořízne, upraví se vyvážení bílé, konvertuje do pozitivu a nakonec se upraví barvy.',
    'mafos.step1': 'Sken negativu',
    'mafos.step1.desc': 'RAW snímek negativu se naskenuje pomocí Mafoše a importuje se do Lightroomu.',
    'mafos.step2': 'Ořez a vyvážení bílé',
    'mafos.step2.desc': 'Snímek se ořízne a vyvážení bíle se upraví tak, aby se vykompenzoval oraznžový podklad.',
    'mafos.step3': 'Konverze do pozitivu',
    'mafos.step3.desc': 'Barvy negativu se invertují pomocí programu Negative Lab Pro.',
    'mafos.step4': 'Korekce pozitivu',
    'mafos.step4.desc': 'Na snímku se upraví barevné nedokonalosti a vyvážení bílé.',
    'mafos.step5': 'Výsledek',
    'mafos.step5.desc': 'Finální fotografie se upraví stejně tak, jako digitální - vinětace, odstranení prachu.',
    'mafos.diagram.heading': 'Schéma fungování',
    'mafos.diagram.camera': 'Digitální foťák',
    'mafos.diagram.negative': 'Negativ',
    'mafos.diagram.phone': 'Dotykový mobil',
    'mafos.results.heading': 'Porovnání výsledků',
    'mafos.results.p1': 'Porovnání skenu z Mafoše s profesionálním laboratorním skenem. Výsledky jsou téměř totožné s tím, že mafoš poskytuje mnohem vyšší rozlišení za zlomek nákladů.',
    'mafos.making.heading': 'Jak Mafoš vznikl',
    'mafos.making.p1': 'Od prvního prototypu postaveného na dvou kartonových trubkách až po finální verzi vytisknutou na 3D tiskárně uplynuly dva roky postupného vylepšování.',
    'mafos.making.stage1': 'Prototyp z trubek',
    'mafos.making.stage1.desc': 'Úplně první verze skeneru \u2014 foťák položený na dvou kartonových trubkách s telefonem jako podsvícením.',
    'mafos.making.stage2': 'Prototyp z kartonu',
    'mafos.making.stage2.desc': 'Druhá verze se zakrytím z kartonu pro lepší kontrolu světla a stabilnější uchycení negativu.',
    'mafos.making.stage3': '3D model',
    'mafos.making.stage3.desc': 'Návrh finální verze skeneru v CAD programu \u2014 přesné rozměry, držáky a vedení filmu.',
    'mafos.making.stage4': 'Slicer',
    'mafos.making.stage4.desc': 'Příprava modelu pro 3D tisk \u2014 rozřezání na vrstvy, nastavení výplně a podpor.',
    'mafos.making.stage5': 'Finální produkt',
    'mafos.making.stage5.desc': 'Hotový Mafoš vytisknutý na 3D tiskárně z PLA materiálu, připravený ke skenování.',
    'mafos.story.heading': 'Cesta ke vzpomínkám',
    'mafos.story.p1': 'V létě 2023 jsem v domě mojí babičky objevil ve skříni více než sto starých 35mm a svitkových filmů. Nafotil je můj praděda a některé jeho tatínek.',
    'mafos.story.p2': 'Rozhodl jsem se vytvořit si vlastní skenovací aparát z kartonu. Položil jsem zrcadlovku na dvě trubky, pod ní telefon jako podsvícení a vyfotil první snímek. Byli na něm mladí lidé stojící na dřevěném mostku v lese \u2014 fotky mého strýce z\u00A0počátku 80. let.',
    'mafos.story.p3': 'Na fotografiích jsem našel spoustu vzpomínek \u2014 narozeniny, starý byt, oslavy, výlety, Vánoce. Postupně jsem aparát vylepšoval, koupil si program pro konverzi negativů a nakonec vytvořil Mafoše \u2014 hotovou verzi skeneru vytisknutou na 3D tiskárně.',
    'mafos.timeline.title': 'Časová osa',
    'mafos.timeline.1.date': '8/2023',
    'mafos.timeline.1': 'Objev negativů, první prototyp z trubek',
    'mafos.timeline.2.date': '9/2023',
    'mafos.timeline.2': 'Makro kroužky, kartonový prototyp',
    'mafos.timeline.3.date': '1/2024',
    'mafos.timeline.3': 'Negative Lab Pro',
    'mafos.timeline.4.date': '6/2025',
    'mafos.timeline.4': 'Začátek práce na 3D modelu',
    'mafos.timeline.5.date': '7/2025',
    'mafos.timeline.5': 'Mafoš hotov',

    // About
    'about.num': '04',
    'about.heading': 'Filip Rosa',
    'about.p1': 'Poprvé jsem se o focení začal zajímat, když moje maminka našla ve skříni první zrcadlovku, kterou jsem kdy držel v ruce - Canon EOS 650. Uchvátila mně hned jsem si koupil barevný film, na který jsem nafotil 36 fotek, které bych se dnes styděl ukázat. Ale od té doby jsem se začal věnovat všemu spojenému s fotografií. Historii, analogu, příběhům i technice.',
    'about.p2': 'Dnes se focením zabývám většinu svého volného času a je to mým velkým koníčkem. Rád bych se ve focení zdokonalil a začal se mu věnovat profesionálně. Proto jsem rád za každou zkušenost, a to jak pozitivní, tak i negativní.',
    'about.stat1.value': 'Od 2022',
    'about.stat1.label': 'za objektivem',
    'about.stat2.value': 'Desítky',
    'about.stat2.label': 'nafocených eventů',
    'about.stat3.value': 'Tisíce',
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
    'gallery.description': 'Výběr těch nejlepších digitálních i analogových fotek, které jsem za svůj život vyfotil. Můžete je filtrovat podle portrétů, krajin, skupin atd.',
    'gallery.back': 'Zpět',
    'gallery.download': 'Stáhnout',
    'gallery.all': 'Vše',

    // Magazine
    'magazine.heading': 'Nerovný Rosník',
    'magazine.description': 'Nerovný Rosník je mnou vytvořený časopis, který obsahuje nejrůznější úvahy, články a\u00A0průzkumy spojené s mými zájmy. Původně se jednalo jenom o\u00A0úkol do\u00A0češtiny, ale po\u00A0ohlasech, které jsem dostal jsem se rozhodl vydat i\u00A0další. Slovo do tajenky: AVANTGARDA',
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
    'hero.description': 'Photography, development, scanning, printing and much more \u2014 done with care and passion.',
    'hero.cta.services': 'View photos',
    'hero.cta.contact': 'Contact me',
    'hero.scroll': 'Scroll',

    // Services
    'services.num': '01',
    'services.heading': 'What I\u00A0can do for you',
    'services.description': 'This section is currently WIP...',
    'services.portrait.title': 'Portrait photography',
    'services.portrait.desc': '...',
    'services.product.title': 'Product photography',
    'services.product.desc': '...',
    'services.darkroom.title': 'Darkroom prints',
    'services.darkroom.desc': '...',
    'services.bw.title': 'B&W film development',
    'services.bw.desc': '...',
    'services.scan.title': 'Film scanning',
    'services.scan.desc': '...',
    'services.restore.title': 'Photo restoration',
    'services.restore.desc': '...',

    // Work
    'work.num': '02',
    'work.heading': 'Photo samples',
    'work.description': 'A selection of my photographs that I have taken over the past few years.',

    // Projects
    'projects.num': '03',
    'projects.heading': 'Projects',
    'projects.description': 'My past and current projects that I am proud of.',
    'projects.museum.title': 'Camera Museum',
    'projects.museum.desc': 'Analog (and digital) cameras in my collection. With photos and sample shots.',
    'projects.museum.cta': 'Visit museum',
    'projects.magazine.title': 'Nerovn\u00FD Rosn\u00EDk',
    'projects.magazine.desc': 'My magazine with essays, articles, poems and surveys available to browse or download.',
    'projects.magazine.cta': 'Read magazine',
    'projects.meetup.title': 'Meetup',
    'projects.meetup.desc': 'A platform for finding the ideal date for all event participants.',
    'projects.meetup.cta': 'Plan an event',
    'projects.mafos.title': 'Mafoš',
    'projects.mafos.desc': 'DSLR scanner for medium format and 35mm film, 3D printable.',
    'projects.mafos.cta': 'View project',
    'projects.gear.title': 'Gear',

    // Mafos page
    'mafos.back': 'Back',
    'mafos.subtitle': 'DSLR scanner for medium format and 35mm film.',
    'mafos.about.heading': 'What is Mafoš',
    'mafos.about.p1': 'Mafoš is a film scanner based on the DSLR scanning principle. It enables scanning of 35mm and medium format negatives using a digital SLR camera and backlight from a\u00A0mobile phone.',
    'mafos.about.p2': 'It is 3D printed, so the manufacturing cost is practically negligible compared to the competition. This scanning system also provides high resolution and control over the final result.',
    'mafos.about.stat1.1': 'Over 200',
    'mafos.about.stat1.2': 'films scanned',
    'mafos.about.stat2.1': 'Up to 50 MP',
    'mafos.about.stat2.2': 'scan resolution',
    'mafos.about.stat3.1': '35mm',
    'mafos.about.stat3.2': '120 and 220 film',
    'mafos.conversion.heading': 'Negative conversion',
    'mafos.conversion.p1': 'The scanning process involves five steps \u2014 from a raw negative scan to the final edited photograph. The negative is photographed with a digital SLR, cropped, white balance is adjusted, converted to positive, and finally the colors are edited.',
    'mafos.step1': 'Negative scan',
    'mafos.step1.desc': 'The RAW negative image is scanned using Mafoš and imported into Lightroom.',
    'mafos.step2': 'Crop & white balance',
    'mafos.step2.desc': 'The image is cropped and white balance is adjusted to compensate for the orange film base.',
    'mafos.step3': 'Positive conversion',
    'mafos.step3.desc': 'The negative colors are inverted using Negative Lab Pro.',
    'mafos.step4': 'Positive correction',
    'mafos.step4.desc': 'Color imperfections and white balance are corrected on the image.',
    'mafos.step5': 'Final result',
    'mafos.step5.desc': 'The final photograph is edited just like a digital one \u2014 vignetting, dust removal.',
    'mafos.diagram.heading': 'How it works',
    'mafos.diagram.camera': 'Digital camera',
    'mafos.diagram.negative': 'Negative',
    'mafos.diagram.phone': 'Smartphone',
    'mafos.results.heading': 'Results comparison',
    'mafos.results.p1': 'Comparison of a Mafoš scan with a professional lab scan. The results are nearly identical, with Mafoš providing much higher resolution at a fraction of the cost.',
    'mafos.making.heading': 'How Mafoš was made',
    'mafos.making.p1': 'From the first prototype built on two cardboard tubes to the final 3D printed version, two years of gradual improvement went by.',
    'mafos.making.stage1': 'Tube prototype',
    'mafos.making.stage1.desc': 'The very first version \u2014 a camera placed on two cardboard tubes with a phone as backlight.',
    'mafos.making.stage2': 'Cardboard prototype',
    'mafos.making.stage2.desc': 'Second version with a cardboard enclosure for better light control and more stable negative mounting.',
    'mafos.making.stage3': '3D model',
    'mafos.making.stage3.desc': 'Final scanner design in CAD software \u2014 precise dimensions, holders and film guides.',
    'mafos.making.stage4': 'Slicer',
    'mafos.making.stage4.desc': 'Preparing the model for 3D printing \u2014 slicing into layers, setting infill and supports.',
    'mafos.making.stage5': 'Final product',
    'mafos.making.stage5.desc': 'The finished Mafoš, 3D printed from PLA material and ready for scanning.',
    'mafos.story.heading': 'A path to memories',
    'mafos.story.p1': 'In the summer of 2023, I discovered over a hundred old 35mm and medium format films in a closet in my grandmother\'s house. They were shot by my great-grandfather and some by his father.',
    'mafos.story.p2': 'I decided to build my own scanning device from cardboard. I placed an SLR on two tubes, a phone underneath as backlight, and took the first shot. It showed young people standing on a wooden bridge in the forest \u2014 photos taken by my uncle in the early 1980s.',
    'mafos.story.p3': 'In the photographs I found countless memories \u2014 birthdays, an old apartment, celebrations, trips, Christmas. I gradually improved the device, bought negative conversion software, and eventually created Mafoš \u2014 the finished version of the scanner, 3D printed.',
    'mafos.timeline.title': 'Timeline',
    'mafos.timeline.1.date': '8/2023',
    'mafos.timeline.1': 'Discovery of negatives, first tube prototype',
    'mafos.timeline.2.date': '9/2023',
    'mafos.timeline.2': 'Macro rings, cardboard prototype',
    'mafos.timeline.3.date': '1/2024',
    'mafos.timeline.3': 'Negative Lab Pro',
    'mafos.timeline.4.date': '6/2025',
    'mafos.timeline.4': 'Started working on 3D model',
    'mafos.timeline.5.date': '7/2025',
    'mafos.timeline.5': 'Mafoš finished',

    // About
    'about.num': '04',
    'about.heading': 'Filip Rosa',
    'about.p1': 'I first got interested in photography when my mom found the first SLR I ever held in my hands \u2014 a Canon EOS 650 \u2014 in a closet. I was captivated immediately, bought a color film and shot 36 photos I would be ashamed to show today. But since then I started dedicating myself to everything related to photography. History, analog, stories and technique.',
    'about.p2': 'Today I spend most of my free time on photography and it is my great hobby. I would like to improve my photography and start pursuing it professionally. That is why I appreciate every experience, both positive and negative.',
    'about.stat1.value': 'Since 2022',
    'about.stat1.label': 'behind the lens',
    'about.stat2.value': 'Dozens',
    'about.stat2.label': 'of events photographed',
    'about.stat3.value': 'Thousands',
    'about.stat3.label': 'of hours in Lightroom',

    // Contact
    'contact.num': '05',
    'contact.heading.line1': 'Let\'s create',
    'contact.heading.line2': 'together',
    'contact.description': 'Interested in a\u00A0shoot, film development, darkroom prints, or need advice on something? Write to me, I\'ll be happy to respond.',

    // Footer
    'footer.copyright': '\u00A9 2026 Filip Rosa',

    // Gallery
    'gallery.heading': 'Gallery',
    'gallery.description': 'A selection of the best digital and analog photos I\u00A0have taken in my life. You can filter them by portraits, landscapes, groups, etc.',
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
