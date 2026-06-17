# filiprosa.cz

Osobní fotografické portfolio a stránka služeb Filipa Rosy.

Tento dokument popisuje **technickou strukturu webu** — vše, co je potřeba vědět k tomu, aby na něm šly dělat změny: architektura, datový tok, struktura souborů, build & deploy, admin panel, CDN API i konvence v kódu.

---

## Obsah

- [Tech stack](#tech-stack)
- [Architektura ve zkratce](#architektura-ve-zkratce)
- [Struktura projektu](#struktura-projektu)
- [Routing a stránky](#routing-a-stránky)
- [Datový tok a CDN](#datový-tok-a-cdn)
- [Internacionalizace (CS / EN)](#internacionalizace-cs--en)
- [Design systém a stylování](#design-systém-a-stylování)
- [Komponenty](#komponenty)
- [Admin panel `/panel0x`](#admin-panel-panel0x)
- [Autentizace a oprávnění](#autentizace-a-oprávnění)
- [CDN API endpointy](#cdn-api-endpointy)
- [Lokální vývoj](#lokální-vývoj)
- [Build a deploy](#build-a-deploy)
- [Konvence v kódu](#konvence-v-kódu)
- [Časté úkoly — kuchařka](#časté-úkoly--kuchařka)
- [Známé zvláštnosti](#známé-zvláštnosti)

---

## Tech stack

| Vrstva | Technologie |
|---|---|
| Framework | **Next.js (App Router)** s `output: 'export'` — výstup je čistě statický HTML/JS |
| UI | **React 19** + TypeScript (strict) |
| Styling | **Tailwind CSS v4** (přes `@tailwindcss/postcss`, bez `tailwind.config.js` — theme je v `app/globals.css`) |
| Animace | **Framer Motion** v12 |
| Fonty | **Playfair Display** (nadpisy) + **DM Sans** (text), Google Fonts |
| ZIP export | **JSZip** (stahování celých alb v galerii) |
| Hosting webu | **WEDOS** sdílený hosting, deploy přes FTP |
| CDN | `cdn.filiprosa.cz` — vlastní PHP endpointy + flat-file úložiště |
| Analytika | Google Analytics (G-9HDBSK2C68) |
| CI/CD | **GitHub Actions** (`.github/workflows/deploy.yml`) |

> **Žádná databáze.** Veškerý dynamický obsah je v JSON manifestech na CDN. Web sám je 100 % statický.

---

## Architektura ve zkratce

```
┌────────────────────────┐         ┌──────────────────────────┐
│  Browser (statický web)│ ───────▶│  cdn.filiprosa.cz        │
│  filiprosa.cz          │  GET    │  (PHP + flat-file)       │
│  (Next.js export)      │ ◀───────│  gallery.json, museum.json│
│                        │  JSON   │  rosnik.json, gear.json  │
│  /panel0x (admin)      │         │  services.json, site.json│
│                        │ ───────▶│  pricelist.json,         │
│                        │ POST    │  graphics.json, faq.json │
└────────────────────────┘  auth   │  users.json              │
                                   │                          │
                                   │  /api/upload             │
                                   │  /api/manifest           │
                                   │  /api/delete             │
                                   │  /api/save-users         │
                                   │  /api/contact            │
                                   │                          │
                                   │  /gallery/<slug>/*.jpg   │
                                   │  /museum/<id>/*.jpg      │
                                   │  /rosnik/*.pdf           │
                                   │  /gear/*.jpg             │
                                   │  /services/*.jpg         │
                                   │  /pricelist/*.jpg        │
                                   │  /graphics/*.{jpg,zip,…} │
                                   │  /site/*.jpg             │
                                   └──────────────────────────┘
```

- **Public part of the site (pubp)** čte manifesty z CDN přes `fetch(...{cache:'no-store'})` na klientu — proto se obsah aktualizuje hned po uložení v adpanu, bez rebuildu webu.
- **Admin panel (adpan)** je obyčejná chráněná routa stejné Next.js appky. Žádný server, vše běží v prohlížeči a komunikuje s CDN přes `Bearer` token uložený v `sessionStorage`.
- **Obrázky** se před uploadem na CDN zmenšují **v prohlížeči** (canvas → JPEG): full = 1920 px na delší hraně, thumb = 720 px.

---

## Struktura projektu

```
new/
├── app/                        # Next.js App Router (každá složka = routa)
│   ├── layout.tsx              # Root layout — <html>, fonty, GA, JSON-LD, <Providers>
│   ├── page.tsx                # Homepage (sekce přes komponenty)
│   ├── globals.css             # Tailwind v4 theme + custom CSS
│   ├── not-found.tsx           # 404
│   ├── galerie/                # Veřejná galerie
│   ├── muzeum/                 # Muzeum foťáků
│   ├── rosnik/                 # Časopis Nerovný Rosník + PDF viewer
│   ├── mafos/                  # Projekt Mafoš (DSLR skener)
│   ├── vybaveni/               # Vybavení
│   ├── cenik/                  # Ceník (3 podsekce + technical + extras + travel)
│   ├── qna/                    # Časté dotazy (FAQ akordeon, parser [text](url))
│   ├── grafika/                # Grafika ke stažení (zip/psd/ai/jpg ke stažení)
│   └── panel0x/                # Admin panel (chráněný)
│       ├── layout.tsx          # AdminAuth wrapper + ToastProvider + červené glow okraje
│       ├── page.tsx            # Dashboard
│       ├── gallery/            # Správa alb a fotek
│       ├── museum/             # Správa fotoaparátů
│       ├── rosnik/             # Správa časopisu
│       ├── gear/               # Obrázky v sekci Vybavení
│       ├── services/           # Pozadí karet služeb
│       ├── pricelist/          # Položky ceníku (3 foto karty, technical, extras, travel)
│       ├── graphics/           # CRUD grafik ke stažení (obrázek + soubor + metadata)
│       ├── faq/                # CRUD otázek a odpovědí (bilingvální)
│       ├── contact-section/    # Profilovka + bio (homepage About)
│       ├── landing/            # Pozadí + nadpis hera
│       ├── users/              # Správa uživatelů (jen admin)
│       └── debug/              # Diagnostika CDN / uploadu
│
├── components/                 # Sdílené React komponenty
│   ├── Navigation.tsx          # Top bar + dropdown menu + jazykový přepínač (čte site-nav)
│   ├── Hero.tsx                # Hero sekce
│   ├── Services.tsx            # 4 karty služeb (Capture/Digital/Processing/Prints) + CTA na ceník
│   ├── ServiceCard.tsx
│   ├── FeaturedPhotos.tsx      # Featured fotky z galerie (bez nadpisů alb)
│   ├── Projects.tsx            # Karty projektů (Mafoš, Muzeum, Rosník, Grafika) — čte PROJECTS z site-nav
│   ├── About.tsx               # About sekce na homepage
│   ├── Contact.tsx             # Kontaktní formulář + kopírovací tlačítka (hideSectionNum prop)
│   ├── Footer.tsx              # Kontaktní údaje + nav (čte MAIN_NAV) + IG
│   ├── Lightbox.tsx            # Lightbox se zoomem (1×–5×), pan, swipe, klávesnice
│   ├── WorkGallery.tsx         # Mřížka prací
│   ├── MarqueeStrip.tsx        # Běžící pruh
│   ├── Logo.tsx
│   ├── GrainOverlay.tsx        # Filmové zrno přes celou stránku
│   ├── BottomBlur.tsx          # Blur na spodním okraji viewportu
│   ├── HashScroll.tsx          # Fix scrollu na #anchor + skrytá zkratka 0→x
│   ├── Providers.tsx           # I18nProvider
│   └── admin/
│       ├── AdminAuth.tsx       # Login form, session check, rate limit
│       └── Toast.tsx           # Toast notifikace (kontext + hook)
│
├── lib/                        # Sdílená logika (bez UI)
│   ├── cdn.ts                  # CDN_URL + helpery (cdnUrl, placeholderUrl, asset)
│   ├── cdn-api.ts              # Fetch manifestů + upload + resize + URL buildery
│   ├── auth.ts                 # Hash hesel (SHA-256 + salt), session, rate limit, users
│   ├── i18n.tsx                # I18nProvider, useI18n, slovník překladů
│   ├── site-nav.tsx            # MAIN_NAV + PROJECTS + ABOUT_LINKS — jediný zdroj pravdy navu
│   ├── gallery-data.ts         # Re-export typů z cdn-api
│   ├── museum-data.ts          # Re-export typů z cdn-api
│   └── magazine-data.ts        # Re-export typů z cdn-api
│
├── public/                     # Statické soubory (kopírují se 1:1 do `/out/`)
│   ├── favicon.svg / .png
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── lims.txt                # Popis webu pro LLM (Anthropic, OpenAI)
│   ├── images/                 # Lokální obrázky (profil, hero bg, Mafoš diagramy…)
│   ├── colors/                 # Reference paleta (txt + png)
│   ├── gear.txt, services.txt, story.txt   # Pomocné textovky
│
├── cdn-upload/                 # !!! Snapshot CDN obsahu + seed manifesty — neuploaduje se s webem
│   ├── api/                    # PHP konfigurace (allowed manifest types, allowed extensions)
│   ├── gallery.json            # Záloha aktuálního stavu (jen pro referenci)
│   ├── graphics.json           # Seed manifestu grafik (prázdný)
│   └── faq.json                # Seed manifestu FAQ (10 otázek CS/EN)
│
├── brand-assets/               # Loga, brand zdroje (neuploaduje se)
├── screenshots/                # Výstup playwright screenshot scriptu (.gitignored)
├── .github/workflows/
│   └── deploy.yml              # FTP deploy na push do main
├── next.config.ts              # output: 'export', images.unoptimized, trailingSlash
├── postcss.config.mjs          # Tailwind v4 PostCSS plugin
├── tsconfig.json               # strict, paths: "@/*"
├── package.json
├── screenshot.mjs              # `npm run screenshot` — playwright fullpage screenshot
├── serve.mjs                   # Mini HTTP server pro lokální servování `/out/`
├── CLAUDE.md                   # Pravidla pro AI asistenty pracující na repu
└── README.md                   # Tento dokument
```

---

## Routing a stránky

Next.js App Router → každá složka v `app/` se mapuje na URL. Díky `trailingSlash: true` v `next.config.ts` všechny URL končí lomítkem.

| URL | Soubor | Popis |
|---|---|---|
| `/` | [app/page.tsx](app/page.tsx) | Homepage — Hero, Služby, Featured, Projekty, About, Kontakt |
| `/#sluzby` | (kotva v `Services`) | |
| `/#projekty` | (kotva v `Projects`) | |
| `/#o-mne` | (kotva v `About`) | |
| `/#kontakt` | (kotva v `Contact`) | |
| `/galerie/` | [app/galerie/page.tsx](app/galerie/page.tsx) | Galerie s filtrováním podle alb a tagů, lightbox, stahování |
| `/muzeum/` | [app/muzeum/page.tsx](app/muzeum/page.tsx) | Muzeum foťáků se specifikacemi |
| `/rosnik/` | [app/rosnik/page.tsx](app/rosnik/page.tsx) | Archiv časopisu + PDF viewer |
| `/mafos/` | [app/mafos/page.tsx](app/mafos/page.tsx) | Statická landing stránka projektu Mafoš |
| `/vybaveni/` | [app/vybaveni/page.tsx](app/vybaveni/page.tsx) | Sekce s obrázky vybavení |
| `/cenik/` | [app/cenik/page.tsx](app/cenik/page.tsx) | Ceník — 3 foto karty + technical/extras + travel poznámka |
| `/qna/` | [app/qna/page.tsx](app/qna/page.tsx) | Časté dotazy (FAQ akordeon, `[text](url)` v odpovědích → odkaz) |
| `/grafika/` | [app/grafika/page.tsx](app/grafika/page.tsx) | Grafika ke stažení (force-download přes blob) |
| `/panel0x/` | [app/panel0x/page.tsx](app/panel0x/page.tsx) | Admin panel — dashboard |
| `/panel0x/<sekce>/` | viz `app/panel0x/*/page.tsx` | Editace jednotlivých sekcí |

**Externí**: `meetup.filiprosa.cz` — samostatný projekt (není v tomto repu).

**Skrytá zkratka**: na veřejné části stiskni `0` a do 600 ms `x` — přesměruje na `/panel0x`. Implementováno v [components/HashScroll.tsx](components/HashScroll.tsx#L37-L60).

---

## Datový tok a CDN

### Struktura CDN (`cdn.filiprosa.cz`)

```
cdn.filiprosa.cz/
├── api/                        # PHP endpointy (viz CDN API endpointy níže)
├── gallery.json                # Manifest galerie (alba + obrázky)
├── museum.json                 # Manifest muzea (fotoaparáty)
├── rosnik.json                 # Manifest časopisu (vydání)
├── gear.json                   # Manifest sekce vybavení (sectionKey → filename)
├── services.json               # Manifest sekce služby (cardKey → filename)
├── site.json                   # Hero + About texty a obrázky
├── pricelist.json              # Ceník (3 foto karty + technical + extras + travel)
├── graphics.json               # Grafiky ke stažení (image, file, format, popis)
├── faq.json                    # Otázky a odpovědi (bilingvální)
├── users.json                  # Hashe hesel uživatelů adpanu (SHA-256 + salt)
│
├── gallery/<album-slug>/       # Fotky alba — full velikost (1920 px)
│   ├── landscape001.jpg
│   ├── landscape002.jpg
│   └── thumbs/                 # Náhledy (720 px) se STEJNÝMI jmény
│       ├── landscape001.jpg
│       └── landscape002.jpg
│
├── museum/<camera-id>/         # Obrázky fotoaparátu (id = číslo z manifestu)
│   ├── thumb.jpg
│   └── <gallery_images_filenames>
│
├── rosnik/                     # Časopis
│   ├── Noviny1.pdf
│   ├── Noviny2.pdf
│   └── thumbs/                 # Náhledy obálek
│
├── gear/                       # Obrázky sekce vybavení
├── services/                   # Obrázky karet služeb
├── pricelist/                  # Obrázky karet ceníku
├── graphics/                   # Náhledy + downloadable soubory (jpg, png, zip, psd, ai)
└── site/                       # Profilovka + landing bg + případně další
```

### Manifesty (zdroj pravdy)

Typy jsou definované v [lib/cdn-api.ts](lib/cdn-api.ts#L28-L103):

- `GalleryManifest` → `{ albums: GalleryAlbum[], updatedAt }`
  - `GalleryAlbum` → `{ slug, title:{cs,en}, description:{cs,en}, hidden?, images: GalleryImage[] }`
  - `GalleryImage` → `{ filename, caption:{cs,en}, tags?, featured?, analog?, year? }`
- `MuseumManifest` → `{ cameras: Camera[], cameraTypes: string[] }`
- `RosnikManifest` → `{ issues: MagazineIssue[] }`
- `GearManifest` / `ServicesManifest` → `{ images: Record<sectionKey, filename> }`
- `SiteManifest` → hero a about texty + jména profilovky a landing bg
- `PricelistManifest` → `{ photography: PricelistPhotoItem[], technical: PricelistSection, extras: PricelistSection, travel: {cs,en} }`
- `GraphicsManifest` → `{ items: GraphicsItem[] }` (každá položka: id, title{cs,en}, format, description{cs,en}, file?, image?)
- `FaqManifest` → `{ items: FaqItem[] }` (každá položka: id, question{cs,en}, answer{cs,en})

### Cache busting

`saveManifest()` při uložení automaticky doplní `updatedAt: Date.now()`. Klient u stáhne manifest přes `fetch(..., { cache: 'no-store' })` a u kritických obrázků přidává `?v=<timestamp>` query parametr (viz `galleryImageUrl(slug, name, version)`).

### URL helpery

Vždy používej helpery z [lib/cdn-api.ts](lib/cdn-api.ts) místo ručního skládání URL:

```ts
galleryImageUrl(albumSlug, filename, version?)       // full velikost
galleryThumbUrl(albumSlug, filename, version?)        // náhled 720 px
museumImageUrl(cameraId, filename)
rosnikAssetUrl(path)
gearImageUrl(filename)
servicesImageUrl(filename)
siteImageUrl(filename)
pricelistImageUrl(filename)
graphicsAssetUrl(filename)                            // obrázek i downloadable soubor
```

### Lokální přepínač CDN

V prohlížeči se dá CDN base URL přepsat:

```js
localStorage.setItem('__fr_cdn_url', 'https://staging-cdn.example.com/')
```

Logika je v [lib/cdn.ts](lib/cdn.ts#L26-L36).

---

## Internacionalizace (CS / EN)

- **Žádná lokalizovaná routa.** Veškerá lokalizace běží na klientu přes `I18nProvider` ([lib/i18n.tsx](lib/i18n.tsx)).
- Výchozí jazyk: **čeština**. Uložené `locale` je v `localStorage` pod klíčem `locale`.
- V komponentě: `const { locale, setLocale, t } = useI18n()` — `t('klic.podklic')` vrátí překlad.
- **Klíče i překlady** jsou v jednom souboru: [lib/i18n.tsx](lib/i18n.tsx#L50-L412) (`translations.cs` a `translations.en`).
- **Bilingvální data** (obsah z CDN, např. titulek alba) jsou v objektech `{ cs: '...', en: '...' }` — vyber jazyk přes `data.title[locale]`.

### Přidání nového překladu

1. Přidej dvojici klíčů do `translations.cs` a `translations.en` v [lib/i18n.tsx](lib/i18n.tsx).
2. V komponentě: `t('moje.nove.heslo')`.
3. Pro nezalomitelné mezery použij ` ` (vidíš to v existujících klíčích).

---

## Design systém a stylování

### Tailwind v4 bez configu

Tailwind 4 nepoužívá `tailwind.config.js`. Veškeré téma je v [app/globals.css](app/globals.css) v bloku `@theme { ... }`. Když chceš přidat novou barvu/font, přidej proměnnou tam.

### Paleta

| Token | Hex | Použití |
|---|---|---|
| `--color-lime` | `#3bc442` | Primární akcent (CTA, kotvy, highlighty) |
| `--color-lime-light` | `#62d067` | Hover, glow |
| `--color-lime-dark` | `#2f9d34` | |
| `--color-dark` | `#131010` | Hlavní pozadí |
| `--color-charcoal` | `#1c1717` | Karty, sekce |
| `--color-warmblack` | `#0e0c0c` | Tmavší ploška |
| `--color-offwhite` | `#f2f2f2` | Hlavní text |
| `--color-cream` | `#e6e6e6` | |
| `--color-muted` | `#8b7474` | Sekundární text |
| `--color-darkroom` | `#2b1e08` | |
| `--color-accent` | `#e0b05e` | Zlatá / amber (lampa v temné komoře, drobné highlighty) |

RGB kanály pro `rgba(var(--lime-rgb) / 0.5)` jsou pod `:root`.

> Změna barvy se promítne do celého webu — vždy upravuj proměnnou v `@theme`, nikdy hex přímo v komponentě.

### Fonty

- `--font-display: Playfair Display` (nadpisy, decor)
- `--font-body: DM Sans` (běžný text, navigace, tlačítka)
- Načtené v `<head>` v [app/layout.tsx](app/layout.tsx#L91-L94) — pokud přidáš váhu, doplň ji do URL `&family=...`.

### Speciální UI prvky (CSS v `globals.css`)

- `.grain-overlay` — filmové zrno přes celou stránku
- `.film-strip` — perforovaná lišta mezi sekcemi (`<div className="film-strip" />`)
- `.section-num` — kolečko s číslem sekce
- `.viewport-blur` — spodní blur viewportu (`<BottomBlur />`)
- `.marquee-track` — nekonečný posun
- `.cursor-glow` — radiální záře pod kurzorem (Services)
- `.work-grid`, `.work-item-hero` — grid pro mřížku prací

---

## Komponenty

### Klíčové komponenty na homepage

| Komponenta | Soubor | Co dělá |
|---|---|---|
| `Navigation` | [components/Navigation.tsx](components/Navigation.tsx) | Top bar, dropdown Projects/About, jazykový přepínač CS/EN, mobilní menu — čte `MAIN_NAV` |
| `Hero` | [components/Hero.tsx](components/Hero.tsx) | Headline, scroll indikátor, BG s gradientem a teturou |
| `Services` | [components/Services.tsx](components/Services.tsx) | 4 karty (Capture / Digital / Processing / Prints) + CTA tlačítko na ceník |
| `FeaturedPhotos` | [components/FeaturedPhotos.tsx](components/FeaturedPhotos.tsx) | Featured fotky z `gallery.json` (`featured: true`); bez podnadpisů alb |
| `Projects` | [components/Projects.tsx](components/Projects.tsx) | Karty Mafoš / Muzeum / Rosník / Grafika — čte `PROJECTS` z `site-nav.tsx` |
| `About` | [components/About.tsx](components/About.tsx) | Profilovka + 2× odstavec + 3 staty (texty z `site.json`) |
| `Contact` | [components/Contact.tsx](components/Contact.tsx) | Formulář (POST `/api/contact`), kopírovací btn na e-mail/telefon; `hideSectionNum` prop |
| `Footer` | [components/Footer.tsx](components/Footer.tsx) | Levý sloupec: copyright + IČO + adresa + telefon + e-mail; střed: nav (`MAIN_NAV`); vpravo: IG |

### Utility komponenty

- **`HashScroll`** — fix scrollu na `#anchor` po hydrataci + skrytá zkratka `0`+`x` na adpan.
- **`Lightbox`** — používá galerie i muzeum. Zoom 1–5× (kolečko / pinch), drag pan, swipe, klávesnice (`←`/`→`/`Esc`/`+`/`-`).
- **`GrainOverlay`**, **`BottomBlur`**, **`MarqueeStrip`** — dekorativní.
- **`admin/AdminAuth`** — wrapper, který zablokuje render dokud uživatel není přihlášen.
- **`admin/Toast`** — `useToast()` hook + `<ToastProvider>`.

---

## Admin panel `/panel0x`

### Sekce

| Sekce | Co spravuje | Manifest |
|---|---|---|
| **Gallery** | alba (CRUD), fotky (upload + caption + tagy + featured/analog/year), klient-side resize na 1920 + 720 px | `gallery.json` |
| **Museum** | fotoaparáty (vlastnosti, thumb, galerie a sample obrázky), seznam typů kamer | `museum.json` |
| **Rosnik** | vydání časopisu (PDF + náhled + popis + datum) | `rosnik.json` |
| **Gear** | obrázky pro sekce vybavení (`gear/<key>.jpg`) | `gear.json` |
| **Services** | obrázky pozadí karet služeb | `services.json` |
| **Pricelist** | 3 foto karty (Portrait/Event/Product), technical sekce, extras sekce, travel poznámka — bilingvální | `pricelist.json` |
| **Graphics** | grafiky ke stažení — CRUD s nahráním obrázku + souboru, formát, popisy, řazení šipkami | `graphics.json` |
| **FAQ** | otázky a odpovědi — bilingvální, řazení šipkami; odpovědi podporují `[text](url)` syntaxi | `faq.json` |
| **Contact section** | profilovka + 2× odstavec About (CS/EN) | `site.json` |
| **Landing** | landing bg + headline texty | `site.json` |
| **Users** | správa uživatelů (jen admin) — vytvoření, smazání, oprávnění | `users.json` |
| **Debug** | diagnostika — test endpointů, kontrola tokenu, výpis CDN URL | – |

### Layout adpanu

- [app/panel0x/layout.tsx](app/panel0x/layout.tsx) obaluje vše do `<ToastProvider>` + `<AdminAuth>`.
- Přes celý viewport je vykreslen **červený glow okraj** (`box-shadow: inset`), aby bylo na první pohled vidět, že se jedná o admin režim.
- Titulek v záložce: `[Admin panel] Filip Rosa`.

### Workflow uploadu fotek do galerie

Implementace v [lib/cdn-api.ts](lib/cdn-api.ts) (`uploadGalleryImagesWithResize`):

1. Pro každý vstupní soubor:
   - Smaž diakritiku ze slugu alba → `landscape`, `portrety`, …
   - Vygeneruj jméno: `{cleanSlug}{NNN}.jpg` — pořadové číslo se odvozuje z **maxima numerických suffixů** v `existingFilenames`, ne z `existingCount` (důležité po smazání fotek uprostřed alba — jinak by se přepsala existující fotka).
   - Defensivní `do...while` kontrola kolize s `existingFilenames` před uploadem.
   - Resize na **1920 px** delší hrana, JPEG kvalita 0.88 → POST na `gallery/<slug>/`.
   - Resize na **720 px** delší hrana, JPEG kvalita 0.80 → POST na `gallery/<slug>/thumbs/`.
2. Po uploadu se zavolá `saveManifest('gallery', ...)`.
3. Soubory se uploadují **sériově** (po jednom) — kvůli stabilitě na shared hostingu.

> Při mazání fotky maže `handleDeleteImage` / `handleDeleteSelected` v adpan zároveň full i `thumbs/` verzi.

### Stahování celého alba

Tlačítko v adpan i v pubp galerii — používá [JSZip](https://stuk.github.io/jszip/) k stažení všech full-size fotek a zabalení do ZIPu v prohlížeči.

---

## Autentizace a oprávnění

### Princip

- Hesla se **nikdy** neposílají na server v plaintextu (kromě prvního migration loginu).
- Hash = `SHA-256(salt + password)`, kde `salt` je 32 náhodných bajtů jako hex.
- Web Crypto API (`crypto.subtle.digest`) — viz `hashPassword()` v [lib/auth.ts](lib/auth.ts#L57-L61).
- **Constant-time porovnání** v `verifyPassword()` → ochrana proti timing útokům.
- Po loginu se uloží:
  - `sessionStorage.__fr_admin_user` — username
  - `sessionStorage.__fr_admin_role` — `admin` / `editor`
  - `sessionStorage.__fr_admin_perms` — JSON s `UserPermissions`
  - `sessionStorage.__fr_admin_auth` — **CDN bearer token** (sdílený s API)
  - `localStorage.__fr_admin_pass` — CDN token (persistuje napříč sessions)

### Role

- **`admin`** — má všechna oprávnění implicitně (viz `hasPermission()` v [lib/auth.ts](lib/auth.ts#L154-L159)).
- **`editor`** — má jen explicitně přidělená oprávnění.

### Oprávnění

`UserPermissions` = `{ gallery: Permission[], museum: Permission[], rosnik: Permission[] }`, kde `Permission = 'upload' | 'delete' | 'edit'`.

V adpan komponentách se používá:

```ts
import { hasPermission } from '@/lib/auth'
const canDelete = hasPermission('gallery', 'delete')
```

### Rate limiting

Po **5 neúspěšných pokusech** se login zablokuje na `30 s × (attempts - 4)`, max 5 minut. Stav je v `sessionStorage.__fr_login_attempts`. Po úspěšném loginu se počítadlo resetuje.

### Migration login (první spuštění)

Pokud je `users.json` prázdný, adpan očekává starý CDN token (`darkroom2026`) jako heslo a vytvoří z něj prvního admin uživatele (`username: admin`). Viz `AdminAuth.tsx`.

---

## CDN API endpointy

Všechny endpointy běží na `https://cdn.filiprosa.cz/api/*` a vyžadují hlavičky:

```
Authorization: Bearer <token>
X-Api-Key: <token>
```

(Token = `sessionStorage.__fr_admin_auth`.)

| Endpoint | Metoda | Body | Použití |
|---|---|---|---|
| `/api/upload` | POST | `FormData { path, files[] }` | Upload jednoho nebo více souborů do cílové cesty na CDN |
| `/api/manifest` | POST | `JSON { type, data }` | Uložení manifestu (gallery / museum / rosnik / gear / services / site / pricelist / graphics / faq) |
| `/api/save-users` | POST | `JSON UsersManifest` | Uložení `users.json` (separátní endpoint kvůli citlivosti) |
| `/api/delete` | POST | `JSON { path }` | Smazání souboru z CDN |
| `/api/contact` | POST | `JSON { name, email, message, locale }` | Odeslání kontaktního emailu (auth NENÍ potřeba) |

### Server-side část

PHP skripty jsou nasazené přímo na `cdn.filiprosa.cz` mimo tento repozitář (WEDOS sdílený hosting). **Tento repo neobsahuje jejich zdroj** — pokud potřebuješ k nim přístup, požádej Filipa.

---

## Lokální vývoj

### Předpoklady

- Node.js ≥ 20
- npm

### Setup

```bash
npm install
npm run dev      # spustí Next.js dev server na http://localhost:3000
```

V dev režimu se obrázky/manifesty stahují z **produkčního CDN** (`cdn.filiprosa.cz`). Pokud chceš mířit jinam (např. staging), nastav v prohlížeči:

```js
localStorage.setItem('__fr_cdn_url', 'https://staging-cdn.example.com/')
```

### Užitečné skripty

```bash
npm run dev          # Next.js dev server
npm run build        # Produkční statický build → /out/
npm run start        # `next start` — ale POZOR: build je `output: 'export'`, takže preferuj `node serve.mjs`
npm run screenshot   # Playwright fullpage screenshot — `node screenshot.mjs <url> <outDir>`
```

- `serve.mjs` — minimalistický HTTP server pro lokální servování `/out/` (po `npm run build`).

---

## Build a deploy

### Konfigurace Next.js ([next.config.ts](next.config.ts))

```ts
output: 'export'         // generuje statické HTML/JS do /out/
images.unoptimized: true // bez Next image optimizeru (nepotřebujeme — máme CDN)
trailingSlash: true      // /galerie/ místo /galerie
```

### GitHub Actions workflow

Soubor: [.github/workflows/deploy.yml](.github/workflows/deploy.yml)

1. `push` do `main` → spustí job na `ubuntu-latest`.
2. `npm install` → `npm run build` → výstup v `/out/`.
3. **FTP deploy** přes `SamKirkland/FTP-Deploy-Action@v4.3.4`:
   - Server: `ftp.filiprosa.cz`
   - Credentials: GitHub secrets `FTP_USERNAME`, `FTP_PASSWORD`
   - Vzdálená cesta: `/www/domains/filiprosa.cz/`
   - Vyloučeno: `.git*`, `node_modules`, `.htaccess`, `.txt`

> **Pravidlo z CLAUDE.md**: Nikdy nepushuj do mainu sám. Vždy předem ukaž změny Filipovi.

### Deploy CDN

CDN PHP endpointy a `.htaccess` se nasazují **odděleně** přes FTP do `cdn.filiprosa.cz`. Tento repo neobsahuje aktuální verzi `cdn-upload/api/` — historicky tam ležely, ale dnes je tam jen referenční `gallery.json`.

---

## Konvence v kódu

### TypeScript

- `strict: true` — žádné implicitní `any`.
- Path alias: `@/*` → kořen projektu. Importuj `@/lib/cdn-api`, ne relativně.
- `paths` v [tsconfig.json](tsconfig.json#L26-L29).

### Komponenty

- **`'use client'`** dej na začátek souboru jen tam, kde to vyžaduje `useState`, `useEffect`, event handlery nebo Framer Motion. Server komponenty jsou výchozí (rychlejší).
- Pojmenování komponent v `PascalCase.tsx`, jeden default export per soubor.
- Pro typy: `interface Props { ... }` přímo nad komponentou.

### Tailwind

- Místo arbitrary hex hodnot (`bg-[#3bc442]`) používej tokeny (`bg-lime`, `text-offwhite`).
- Pro alfa varianty: `color-mix(in srgb, var(--color-lime) 25%, transparent)` v inline `style` nebo `rgba(var(--lime-rgb) / 0.25)`.

### Czech / English

- Texty na webu nepiš natvrdo do JSX. Vytvoř klíč v [lib/i18n.tsx](lib/i18n.tsx) a používej `t('...')`.
- Pro bilingvální data z CDN: `data.title[locale]`.

### Slovník zkratek (z CLAUDE.md)

- **btn** = button
- **adpan** = admin panel (`/panel0x`)
- **pubp** = public part of the site

### Placeholdery v textech

Když přidáváš nový důležitý text (copy, marketing, popisy služeb), nech v něm placeholder typu `TODO: Filip doplní` — Filip si finální copy napíše sám (viz [CLAUDE.md](CLAUDE.md)).

---

## Časté úkoly — kuchařka

### Přidat novou stránku

1. Vytvoř složku `app/<slug>/` se souborem `page.tsx`.
2. Pokud má mít navigaci/footer, přidej ji ručně (root layout neobaluje obsah `<Navigation>` automaticky).
3. Přidej překlady do [lib/i18n.tsx](lib/i18n.tsx).
4. Přidej odkaz do navigace v [lib/site-nav.tsx](lib/site-nav.tsx) (`MAIN_NAV` nebo `PROJECTS` / `ABOUT_LINKS`) — propaguje se automaticky do headeru, footeru i Projects sekce.
5. Přidej routu do [public/sitemap.xml](public/sitemap.xml).

### Přidat nové album (z kódu, bez adpan)

Album se vytváří přes adpan — ale strukturou musí odpovídat:

```json
{
  "slug": "novalbum",
  "title": { "cs": "Nové album", "en": "New album" },
  "description": { "cs": "...", "en": "..." },
  "hidden": false,
  "images": []
}
```

Slug musí být `[a-z0-9]` bez diakritiky — používá se jako jméno složky na CDN.

### Přidat nový jazyk

1. V [lib/i18n.tsx](lib/i18n.tsx) přidej do `type Locale` další hodnotu (např. `'de'`).
2. Přidej překlady do `translations.de = { ... }`.
3. Uprav `setLocale` UI v [components/Navigation.tsx](components/Navigation.tsx).
4. **Bilingvální datové objekty** (`{cs, en}`) v manifestech budou potřeba rozšířit — buď udělej fallback (`data.title[locale] ?? data.title.cs`), nebo přidej do adpanu pole pro nový jazyk.

### Změnit barvy webu

Uprav proměnné v `@theme` v [app/globals.css](app/globals.css#L9-L20). Promítne se to do celé Tailwind palety (`bg-lime`, `text-offwhite`, …) i do inline `style` přes `var(--color-*)`.

### Vyřadit album / fotku z veřejné části, ale ponechat v adpan

- Album: nastav `hidden: true` v manifestu.
- Fotka: zatím není UI flag — buď ji smaž, nebo přejmenuj v adpan.

### Otestovat CDN endpoint bez adpan

Použij [app/panel0x/debug/page.tsx](app/panel0x/debug/page.tsx) — má ručně volatelné kroky pro každý endpoint.

### Spustit produkční build a otestovat lokálně

```bash
npm run build
node serve.mjs        # poslouchá na http://localhost:3000
```

---

## Známé zvláštnosti

- **Žádný `next start`.** Build je statický export, `next start` nemá smysl — používej `serve.mjs`.
- **`/out/`, `.next/`** jsou v `.gitignore`. Build se generuje v CI.
- **`scroll-pt-24`** na `<html>` v root layoutu kompenzuje fixní top bar — když měníš výšku navigace, sjednoť i tohle.
- **`HashScroll`** obchází bug, kdy se prohlížeč při prvním načtení s `#anchor` posune příliš brzy (než se načtou obrázky výš). Re-scroll proběhne 600 ms po hydrataci.
- **Lightbox** používá fyzický element `<img>` s `transform: scale/translate` — pro velký zoom (5×) může na slabých zařízeních škubat.
- **Server-side rendering vs `window`** — komponenty, které čtou `localStorage`/`window`, musí mít `'use client'` a čtení obalit `if (typeof window !== 'undefined')` nebo přesunout do `useEffect`.
- **Migration login** s heslem `darkroom2026` funguje **jen pokud je `users.json` prázdný**. Jakmile existuje první admin, normální flow přes username + password.
- **`cdn-upload/gallery.json`** je jen historický snapshot — netřeba ho aktualizovat. Skutečný `gallery.json` žije na CDN.
- **`cdn-upload/{faq,graphics}.json`** jsou seedy pro inicializaci CDN manifestů (kdyby se omylem smazaly nebo se nasazoval staging). Po prvním uploadu už pravdu drží CDN, ne tahle kopie.
- **Force-download na `/grafika/`** — tlačítko `Stáhnout` načte soubor `fetch`em jako blob a vyvolá `<a download>` přes object URL; bez toho by se obrázky otevřely v prohlížeči. Vyžaduje, aby CDN servírovala soubory s povoleným CORS (`Access-Control-Allow-Origin`). Když fetch selže, je fallback na přímý odkaz.
- **FAQ odpovědi** podporují jednoduchou syntaxi `[text](url)` — interní cesty (`/vybaveni`) jako normální odkaz, `http(s)://` v novém tabu. Implementováno v [app/qna/page.tsx](app/qna/page.tsx) (`renderAnswer`).

---

## Licence

Všechna práva vyhrazena. Soukromý projekt, ne open-source.
