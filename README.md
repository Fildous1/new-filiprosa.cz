# filiprosa.cz

Personal photography portfolio and services website for Filip Rosa.

## Tech Stack

- **Framework:** Next.js (React 19) with static export
- **Styling:** Tailwind CSS v4, Framer Motion
- **Language:** TypeScript
- **CMS:** Headless — JSON manifests on CDN (`cdn.filiprosa.cz`)
- **Hosting:** FTP deployment via GitHub Actions
- **CDN API:** PHP endpoints for upload, manifest, delete, contact

## Features

- Bilingual (Czech / English) with client-side i18n
- Photo gallery with album filtering, lightbox with zoom/pan
- Camera museum with detailed specs and sample shots
- Magazine archive (Nerovny Rosnik) with PDF viewer
- Gear showcase with museum cross-links
- Contact form
- Admin panel (`/panel0x`) with role-based permissions
  - Gallery, museum, magazine, and gear management
  - Client-side image resizing (1920px full + 720px thumb)
  - User management with SHA-256 hashed passwords

## Development

```bash
npm install
npm run dev
```

## Deployment

Static export is deployed via FTP through GitHub Actions on push to `main`.

CDN server files are in `cdn-upload/` — upload the `api/` directory and root `.htaccess` to `cdn.filiprosa.cz`.

## License

All rights reserved. This is a personal project, not open source.
