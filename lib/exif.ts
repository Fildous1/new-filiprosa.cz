/**
 * Minimal client-side EXIF utilities.
 *
 * The browser Canvas API strips ALL metadata when an image is re-encoded
 * (which is what `resizeImage` in cdn-api.ts does). To keep EXIF intact we
 * lift the original APP1 (EXIF) segment out of the source JPEG as raw bytes
 * and splice it back into the resized JPEG untouched — all TIFF offsets
 * inside the segment are relative to the segment itself, so they stay valid.
 *
 * `getCaptureYear` additionally parses the segment to read the year the
 * photo was taken, so it can be pre-filled into the gallery manifest.
 */

/** Read a Blob/File into a Uint8Array. */
function readBytes(file: Blob): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(new Uint8Array(reader.result as ArrayBuffer))
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsArrayBuffer(file)
  })
}

/** True if these 4 bytes spell "Exif". */
function isExifSignature(buf: Uint8Array, at: number): boolean {
  return buf[at] === 0x45 && buf[at + 1] === 0x78 && buf[at + 2] === 0x69 && buf[at + 3] === 0x66
}

/**
 * Extract the raw APP1 (EXIF) segment from a JPEG, including its 0xFFE1
 * marker and length bytes. Returns null for non-JPEGs or JPEGs without EXIF.
 */
export async function extractExifSegment(file: Blob): Promise<Uint8Array | null> {
  const buf = await readBytes(file)
  // JPEG must start with SOI (0xFFD8)
  if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null

  let offset = 2
  while (offset + 4 <= buf.length && buf[offset] === 0xff) {
    const marker = buf[offset + 1]
    // SOS (0xDA) / EOI (0xD9) — image data starts, no more metadata segments
    if (marker === 0xda || marker === 0xd9) break
    const size = (buf[offset + 2] << 8) | buf[offset + 3]
    if (size < 2) break
    const segEnd = offset + 2 + size
    if (segEnd > buf.length) break
    // APP1 + "Exif" signature (skip APP1 segments that hold XMP instead)
    if (marker === 0xe1 && isExifSignature(buf, offset + 4)) {
      return buf.slice(offset, segEnd)
    }
    offset = segEnd
  }
  return null
}

/**
 * Splice an EXIF APP1 segment into a JPEG blob, right after the SOI marker.
 * Canvas-encoded JPEGs never carry EXIF, so we simply insert at offset 2.
 * Returns the original blob unchanged if it is not a JPEG.
 */
export async function injectExifSegment(jpeg: Blob, exifSegment: Uint8Array): Promise<Blob> {
  const buf = await readBytes(jpeg)
  if (buf.length < 2 || buf[0] !== 0xff || buf[1] !== 0xd8) return jpeg

  const out = new Uint8Array(buf.length + exifSegment.length)
  out.set(buf.subarray(0, 2), 0)                       // SOI
  out.set(exifSegment, 2)                              // EXIF APP1
  out.set(buf.subarray(2), 2 + exifSegment.length)     // rest of the JPEG
  return new Blob([out], { type: 'image/jpeg' })
}

/**
 * Read the original capture year from a JPEG's EXIF data.
 * Tries DateTimeOriginal (0x9003), then DateTimeDigitized (0x9004), then the
 * IFD0 DateTime (0x0132). Returns a 4-digit year or undefined if not found.
 */
export async function getCaptureYear(file: Blob): Promise<number | undefined> {
  try {
    const segment = await extractExifSegment(file)
    if (!segment) return undefined

    // Segment layout: FFE1 | length(2) | "Exif\0\0"(6) | TIFF header...
    const tiffStart = 10
    if (segment.length < tiffStart + 8) return undefined

    // Byte order: "II" = little-endian, "MM" = big-endian
    const le = segment[tiffStart] === 0x49 && segment[tiffStart + 1] === 0x49
    const be = segment[tiffStart] === 0x4d && segment[tiffStart + 1] === 0x4d
    if (!le && !be) return undefined

    const u16 = (o: number) =>
      le ? segment[o] | (segment[o + 1] << 8)
         : (segment[o] << 8) | segment[o + 1]
    const u32 = (o: number) =>
      (le ? segment[o] | (segment[o + 1] << 8) | (segment[o + 2] << 16) | (segment[o + 3] << 24)
          : (segment[o] << 24) | (segment[o + 1] << 16) | (segment[o + 2] << 8) | segment[o + 3]) >>> 0

    // ASCII string at a TIFF-relative offset
    const ascii = (relOffset: number, count: number) => {
      const start = tiffStart + relOffset
      let s = ''
      for (let i = 0; i < count && start + i < segment.length; i++) {
        const c = segment[start + i]
        if (c === 0) break
        s += String.fromCharCode(c)
      }
      return s
    }

    // EXIF date format is "YYYY:MM:DD HH:MM:SS"
    const yearOf = (s: string): number | undefined => {
      const m = /^\s*(\d{4}):/.exec(s)
      if (!m) return undefined
      const y = parseInt(m[1], 10)
      return y >= 1826 && y <= 2200 ? y : undefined // sanity bounds (photography era)
    }

    const DATE_TAGS = [0x0132, 0x9003, 0x9004] // DateTime, DateTimeOriginal, DateTimeDigitized

    /** Walk one IFD, collecting date strings and the ExifIFD pointer. */
    const readIfd = (ifdRelOffset: number): { exifPtr?: number; dates: Map<number, string> } => {
      const dates = new Map<number, string>()
      let exifPtr: number | undefined
      const base = tiffStart + ifdRelOffset
      if (base + 2 > segment.length) return { dates }
      const count = u16(base)
      let entry = base + 2
      for (let i = 0; i < count; i++, entry += 12) {
        if (entry + 12 > segment.length) break
        const tag = u16(entry)
        const type = u16(entry + 2)
        const num = u32(entry + 4)
        if (tag === 0x8769) {
          exifPtr = u32(entry + 8) // pointer to the ExifIFD
        } else if (type === 2 && DATE_TAGS.includes(tag)) {
          // ASCII values: stored inline if <= 4 bytes, otherwise at an offset
          const relOffset = num <= 4 ? entry + 8 - tiffStart : u32(entry + 8)
          dates.set(tag, ascii(relOffset, num))
        }
      }
      return { exifPtr, dates }
    }

    const ifd0 = readIfd(u32(tiffStart + 4))
    let dateStr: string | undefined
    if (ifd0.exifPtr != null) {
      const exifIfd = readIfd(ifd0.exifPtr)
      dateStr = exifIfd.dates.get(0x9003) || exifIfd.dates.get(0x9004)
    }
    dateStr = dateStr || ifd0.dates.get(0x0132)
    return dateStr ? yearOf(dateStr) : undefined
  } catch {
    return undefined
  }
}
