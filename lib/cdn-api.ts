/**
 * CDN API Client for admin operations.
 *
 * The CDN server (cdn.filiprosa.cz) exposes a simple API:
 *   POST /api/upload   — Upload file(s), body: FormData { file, path }
 *   POST /api/manifest — Save manifest, body: { type: 'gallery'|'museum'|'rosnik', data: object }
 *   POST /api/delete   — Delete a file, body: { path: string }
 *
 * All endpoints require Authorization header with the admin token.
 */

import { CDN_URL } from './cdn'

const API_BASE = `${CDN_URL}api`

function authHeaders(): HeadersInit {
  const token = sessionStorage.getItem('__fr_admin_auth') || ''
  return {
    'Authorization': `Bearer ${token}`,
    'X-Api-Key': token,
  }
}

/* ------------------------------------------------------------------ */
/*  Manifest fetching (public — no auth needed)                       */
/* ------------------------------------------------------------------ */

export interface GalleryImage {
  filename: string
  caption: { cs: string; en: string }
  featured?: boolean
  analog?: boolean
  year?: number
}

export interface GalleryAlbum {
  slug: string
  title: { cs: string; en: string }
  description: { cs: string; en: string }
  hidden?: boolean
  images: GalleryImage[]
}

export interface GalleryManifest {
  albums: GalleryAlbum[]
  updatedAt?: number  // Unix timestamp for cache-busting
}

export interface Camera {
  id: number
  brand: string
  model: string
  description: { cs: string; en: string }
  type: string
  sensor: string
  isAnalog: boolean
  hasFlash: boolean
  isWorking: boolean
  releaseYear: number
  releaseCountry: { cs: string; en: string }
  acquisitionYear: number
  purchasePrice: number
  note?: { cs: string; en: string }
  link?: string
  image: string
  galleryImages?: string[]
  sampleImages?: string[]
}

export interface MuseumManifest {
  cameras: Camera[]
  cameraTypes: string[]
}

export interface MagazineIssue {
  id: number
  title: { cs: string; en: string }
  date: { cs: string; en: string }
  description: { cs: string; en: string }
  pdf: string
  thumbnail: string
}

export interface RosnikManifest {
  issues: MagazineIssue[]
}

/** Fetch a manifest JSON from the CDN. */
export async function fetchManifest<T>(type: 'gallery' | 'museum' | 'rosnik' | 'gear' | 'services' | 'users'): Promise<T> {
  const res = await fetch(`${CDN_URL}${type}.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`Failed to fetch ${type} manifest: ${res.status}`)
  return res.json()
}

export async function fetchGallery(): Promise<GalleryManifest> {
  return fetchManifest<GalleryManifest>('gallery')
}

export async function fetchMuseum(): Promise<MuseumManifest> {
  return fetchManifest<MuseumManifest>('museum')
}

export async function fetchRosnik(): Promise<RosnikManifest> {
  return fetchManifest<RosnikManifest>('rosnik')
}

export interface GearManifest {
  images: Record<string, string> // sectionKey -> filename
}

export async function fetchGear(): Promise<GearManifest> {
  try {
    return await fetchManifest<GearManifest>('gear')
  } catch {
    return { images: {} }
  }
}

export function gearImageUrl(filename: string): string {
  return `${CDN_URL}gear/${filename}`
}

export interface ServicesManifest {
  images: Record<string, string> // cardKey -> filename
}

export async function fetchServices(): Promise<ServicesManifest> {
  try {
    return await fetchManifest<ServicesManifest>('services')
  } catch {
    return { images: {} }
  }
}

export function servicesImageUrl(filename: string): string {
  return `${CDN_URL}services/${filename}`
}

/* ------------------------------------------------------------------ */
/*  CDN asset URL helpers                                             */
/* ------------------------------------------------------------------ */

/** Build full CDN URL for a gallery image (full-size). */
export function galleryImageUrl(albumSlug: string, filename: string, version?: number): string {
  const base = `${CDN_URL}gallery/${encodeURIComponent(albumSlug)}/${encodeURIComponent(filename)}`
  return version ? `${base}?v=${version}` : base
}

/** Build full CDN URL for a gallery thumbnail (720px). */
export function galleryThumbUrl(albumSlug: string, filename: string, version?: number): string {
  const base = `${CDN_URL}gallery/${encodeURIComponent(albumSlug)}/thumbs/${encodeURIComponent(filename)}`
  return version ? `${base}?v=${version}` : base
}

/** Build full CDN URL for a museum camera image. */
export function museumImageUrl(cameraId: number, filename: string): string {
  return `${CDN_URL}museum/${encodeURIComponent(cameraId)}/${encodeURIComponent(filename)}`
}

/** Build full CDN URL for a rosnik asset (pdf or thumbnail). */
export function rosnikAssetUrl(path: string): string {
  // Encode each segment but preserve path separators
  const safePath = path.split('/').map(s => encodeURIComponent(s)).join('/')
  return `${CDN_URL}rosnik/${safePath}`
}

/* ------------------------------------------------------------------ */
/*  Admin operations (require auth)                                   */
/* ------------------------------------------------------------------ */

/** Upload file(s) to a CDN path. */
export async function uploadFiles(
  files: File[],
  destinationPath: string,
): Promise<{ success: boolean; urls: string[] }> {
  const formData = new FormData()
  formData.append('path', destinationPath)
  for (const file of files) {
    formData.append('files', file)
  }

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    headers: authHeaders(),
    body: formData,
  })

  if (!res.ok) {
    throw new Error(`Upload failed (${res.status})`)
  }

  return res.json()
}

/** Save a manifest to the CDN. Automatically adds `updatedAt` timestamp. */
export async function saveManifest(
  type: 'gallery' | 'museum' | 'rosnik' | 'gear' | 'services',
  data: GalleryManifest | MuseumManifest | RosnikManifest | GearManifest | ServicesManifest,
): Promise<void> {
  // Stamp with current time for cache-busting
  const stamped = { ...data, updatedAt: Date.now() }
  const res = await fetch(`${API_BASE}/manifest`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, data: stamped }),
  })

  if (!res.ok) {
    throw new Error(`Manifest save failed (${res.status})`)
  }
}

/** Upload a single batch of files with XHR progress tracking. */
function uploadBatchWithProgress(
  files: File[],
  destinationPath: string,
  onProgress: (loaded: number, total: number) => void,
): Promise<{ success: boolean; urls: string[] }> {
  return new Promise((resolve, reject) => {
    const formData = new FormData()
    formData.append('path', destinationPath)
    for (const file of files) {
      formData.append('files', file)
    }

    const xhr = new XMLHttpRequest()
    xhr.open('POST', `${CDN_URL}api/upload`)

    const token = sessionStorage.getItem('__fr_admin_auth') || ''
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.setRequestHeader('X-Api-Key', token)

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded, e.total)
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText))
        } catch {
          resolve({ success: true, urls: [] })
        }
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.responseText}`))
      }
    })

    xhr.addEventListener('error', () => reject(new Error('Upload failed: network error')))
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

    xhr.send(formData)
  })
}

/**
 * Upload file(s) with progress tracking.
 * Files are uploaded one at a time for maximum reliability on shared hosting.
 */
export async function uploadFilesWithProgress(
  files: File[],
  destinationPath: string,
  onProgress: (loaded: number, total: number) => void,
): Promise<{ success: boolean; urls: string[] }> {
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)
  let uploadedSize = 0
  const allUrls: string[] = []

  for (let i = 0; i < files.length; i++) {
    const file = files[i]

    const result = await uploadBatchWithProgress([file], destinationPath, (loaded, total) => {
      const fileProgress = total > 0 ? loaded / total : 0
      onProgress(uploadedSize + fileProgress * file.size, totalSize)
    })

    uploadedSize += file.size
    onProgress(uploadedSize, totalSize)
    allUrls.push(...result.urls)
  }

  return { success: true, urls: allUrls }
}

/* ------------------------------------------------------------------ */
/*  Client-side image resizing                                        */
/* ------------------------------------------------------------------ */

/**
 * Resize an image file so the longer edge is at most `maxEdge` px.
 * If the image is already smaller, returns the original file unchanged.
 * Output is always JPEG at the given quality (0-1).
 */
export function resizeImage(
  file: File,
  maxEdge: number,
  quality = 0.85,
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img

      // Don't enlarge
      if (width <= maxEdge && height <= maxEdge) {
        resolve(file)
        return
      }

      const ratio = Math.min(maxEdge / width, maxEdge / height)
      const newW = Math.round(width * ratio)
      const newH = Math.round(height * ratio)

      const canvas = document.createElement('canvas')
      canvas.width = newW
      canvas.height = newH
      const ctx = canvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, newW, newH)

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error('Failed to resize image')); return }
          // Keep original extension for naming, but content is JPEG
          const ext = file.name.split('.').pop()?.toLowerCase()
          const name = ext === 'jpg' || ext === 'jpeg' ? file.name : file.name.replace(/\.[^.]+$/, '.jpg')
          resolve(new File([blob], name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        quality,
      )
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image for resizing')) }
    img.src = url
  })
}

/** Resize and upload both full-size (1920px) and thumbnail (720px) versions. */
export async function uploadGalleryImagesWithResize(
  files: File[],
  albumSlug: string,
  existingCount: number,
  onProgress: (loaded: number, total: number) => void,
): Promise<{ filenames: string[] }> {
  const stripAccents = (str: string) => str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  const clean = stripAccents(albumSlug).replace(/[^a-z0-9]/g, '')
  const filenames: string[] = []

  // Process and upload sequentially for reliability
  const totalSteps = files.length * 2 // full + thumb per file
  let completedSteps = 0

  for (let i = 0; i < files.length; i++) {
    const file = files[i]
    const idx = existingCount + i + 1
    const baseName = `${clean}${String(idx).padStart(3, '0')}.jpg`
    filenames.push(baseName)

    // Resize to full-size (1920px longer edge)
    const fullSize = await resizeImage(file, 1920, 0.88)
    const fullFile = new File([fullSize], baseName, { type: 'image/jpeg' })

    // Upload full-size
    await uploadBatchWithProgressExported([fullFile], `gallery/${albumSlug}`, (loaded, total) => {
      const stepProgress = total > 0 ? loaded / total : 0
      onProgress(completedSteps + stepProgress * 0.5, totalSteps)
    })
    completedSteps += 1

    // Resize to thumbnail (720px longer edge)
    const thumb = await resizeImage(file, 720, 0.80)
    const thumbFile = new File([thumb], baseName, { type: 'image/jpeg' })

    // Upload thumbnail
    await uploadBatchWithProgressExported([thumbFile], `gallery/${albumSlug}/thumbs`, (loaded, total) => {
      const stepProgress = total > 0 ? loaded / total : 0
      onProgress(completedSteps + stepProgress * 0.5, totalSteps)
    })
    completedSteps += 1
    onProgress(completedSteps, totalSteps)
  }

  return { filenames }
}

/** Exported version of batch upload for use by resize function. */
function uploadBatchWithProgressExported(
  files: File[],
  destinationPath: string,
  onProgress: (loaded: number, total: number) => void,
): Promise<{ success: boolean; urls: string[] }> {
  return uploadBatchWithProgress(files, destinationPath, onProgress)
}

/* ------------------------------------------------------------------ */
/*  Contact form                                                      */
/* ------------------------------------------------------------------ */

/**
 * Send a contact form email via the CDN API.
 * Requires POST /api/contact endpoint on cdn.filiprosa.cz.
 */
export async function sendContactEmail(data: {
  name: string
  email: string
  message: string
  locale: string
}): Promise<void> {
  const res = await fetch(`${CDN_URL}api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Contact send failed: ${res.status}`)
  }
}

/** Delete a file from the CDN. */
export async function deleteFile(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}/delete`, {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ path }),
  })

  if (!res.ok) {
    throw new Error(`Delete failed (${res.status})`)
  }
}
