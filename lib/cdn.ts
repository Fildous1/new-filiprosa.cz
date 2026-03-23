/**
 * CDN Configuration for filiprosa.cz
 *
 * CDN Directory Structure (cdn.filiprosa.cz):
 * ├── images/
 * │   ├── gallery/
 * │   │   ├── landscape/    — Landscape album photos
 * │   │   ├── cozy/         — Cozy album photos
 * │   │   ├── portrety/     — Portrait album photos
 * │   │   └── skupinove/    — Group album photos
 * │   ├── museum/
 * │   │   ├── 1/            — Camera ID folders with thumb.jpg + gallery images
 * │   │   ├── 2/
 * │   │   └── .../
 * │   ├── brand/            — Logo, profile, hero bg, work showcase images
 * │   └── misc/             — Fallback images (unknown.png etc.)
 * ├── docs/
 * │   └── magazine/         — PDF files (Noviny1.pdf, Noviny2.pdf, etc.)
 * └── media/
 *     └── magazine/
 *         └── thumbs/       — Magazine issue thumbnails
 *
 * Upload the contents of /public/cdn-upload/ to the CDN root.
 */

const DEFAULT_CDN_URL = 'https://cdn.filiprosa.cz/'

function getCdnUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('__fr_cdn_url')
    if (custom) return custom.endsWith('/') ? custom : custom + '/'
  }
  return DEFAULT_CDN_URL
}

export const CDN_URL = typeof window !== 'undefined' ? getCdnUrl() : DEFAULT_CDN_URL

/**
 * Resolves an asset path: tries local brand_assets first, then CDN, then placeholder.
 */
export function cdnUrl(path: string): string {
  return `${CDN_URL}${path.startsWith('/') ? path.slice(1) : path}`
}

export function placeholderUrl(width: number, height: number, text?: string): string {
  const t = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://placehold.co/${width}x${height}/0c0a08/b9d026${t}`
}

/**
 * Returns CDN url with local fallback.
 * For static export, we use local paths from /public/ during dev,
 * and CDN paths in production.
 * Since we can't detect environment in static export,
 * we use local paths and the CDN is set up as a mirror.
 */
export function asset(localPath: string, cdnPath?: string): string {
  // In static export, always use local paths.
  // The deployment process mirrors /public/ assets to CDN.
  // To switch to CDN, replace this return with: return cdnUrl(cdnPath || localPath)
  return localPath
}
