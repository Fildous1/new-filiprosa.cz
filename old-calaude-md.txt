# CLAUDE.md — Personal Portfolio & Photography Rules

## Project Overview
- **Stack:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Framer Motion
- **Purpose:** Personal portfolio – analog and product photography, service sales, and digital museum
- **Deployment:** WEDOS Hosting (via GitHub Hook / Plain FTP)
- **Export Mode:** Static Site Generation (SSG) — `output: 'export'` in `next.config.js`

## Deployment & Build Rules
- **Static Export:** Always make sure the code is compatible with `next export`. Do not use functions that require Node.js runtime on the server (e.g., dynamic real-time API routes).
- **GitHub Hook:** After each push to the main branch, an automatic build and upload to WEDOS FTP will take place. 
- **Asset Optimization:** Due to FTP limits, optimize image sizes (WebP/Avif) directly in the build to ensure fast transfer.

## Architecture Guidelines
- **Framework:** Next.js 16 App Router using Server Components for static rendering
- **Styling:** Tailwind CSS v4 with custom "Late Afternoon" yellow palette
- **Animations:** Framer Motion for "spring-style" interactions and 3D effects

## Always Do First
- [cite_start]**Invoke the `frontend-design` skill** before writing any frontend code, every session, no exceptions[cite: 1].
- [cite_start]Check for existing brand assets in `brand_assets/` (logos, color guides, or specific analog shots) before generating placeholders[cite: 14, 15].

## Visual Identity: Analog & Golden Hour
- **Core Aesthetic:** Modern vintage, nostalgic, warm, "late afternoon" vibe. Dark theme.
- **Color Palette:**
  - **Primary:** Custom Warm Yellow (e.g., `#FDB813` or `#E1AD01`).
  - [cite_start]**Hard Rule:** Never use default Tailwind palette (indigo-500, yellow-400, etc.)[cite: 18]. [cite_start]Pick a custom brand color and derive from it[cite: 19].
  - **Backgrounds:** Warm off-whites, deep charcoal, or "darkroom" reds for sub-sections.
- **Typography:**
  - [cite_start]**Headings:** High-contrast Serif (e.g., *Playfair Display*, *Telma*, or *EB Garamond*)[cite: 20].
  - [cite_start]**Body:** Clean Sans-serif (e.g., *Inter* or *PP Neue Montreal*)[cite: 20].
  - [cite_start]**Finishing:** Apply tight tracking (`-0.03em`) on large headings and generous line-height (`1.7`) on body text[cite: 21].
- **Texture & Depth:**
  - [cite_start]**Grain:** Layer multiple radial gradients and add grain/texture via SVG noise filter for depth, mimicking film grain[cite: 22].
  - [cite_start]**Lighting:** Use glows and 3D layering (base → elevated → floating) so elements don't sit on the same z-plane[cite: 27].
  - [cite_start]**Shadows:** Never use flat `shadow-md`[cite: 19]. [cite_start]Use layered, color-tinted shadows with low opacity[cite: 20].

## Page Structure & Content
- **Main Page:** Personal brand, "About Me", includes ervices in services.txt
- **Sub-pages:**
  - A space for self created magazine issues PDFs, that can be viewed and downloaded
  - A high-craft grid of the vintage camera collection ("Digital Museum").
  - [cite_start]**Image Treatment:** Add a gradient overlay (`bg-gradient-to-t from-black/60`) and a color treatment layer with `mix-blend-multiply`[cite: 25].

## Technical Workflow
- [cite_start]**Output Defaults:** Single `index.html` (and sub-pages), Tailwind CSS via CDN, mobile-first responsive[cite: 14].
- [cite_start]**Local Server:** Always serve on `http://localhost:3000` via `node serve.mjs` before taking screenshots[cite: 7, 8].
- **Screenshot Workflow:**
  - [cite_start]Use `node screenshot.mjs http://localhost:3000`[cite: 11].
  - [cite_start]Perform at least 2 comparison rounds to ensure the "grain" and "glows" look perfect[cite: 5, 6].
  - Keep them in a screenshot folder and always leave there just the screentshots from the last screen checking (all pasess)
- **Interactivity:**
  - [cite_start]Only animate `transform` and `opacity`[cite: 23].
  - [cite_start]**Hard Rule:** Never use `transition-all`[cite: 23, 28].
  - [cite_start]Every clickable element needs hover, focus-visible, and active states[cite: 24].

## Hard Rules
- [cite_start]Do not add sections, features, or content not discussed[cite: 28].
- [cite_start]Do not use default Tailwind blue/indigo/yellow as primary colors[cite: 28].
- [cite_start]Do not stop after one screenshot pass[cite: 28].
- [cite_start]Use intentional, consistent spacing tokens — not random Tailwind steps[cite: 26].