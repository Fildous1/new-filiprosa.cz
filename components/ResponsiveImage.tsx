/**
 * Renders a responsive <picture> for the build-time optimized images that live
 * in /public/images/opt (see scripts/optimize-images.mjs).
 *
 * Serves AVIF → WebP → JPEG with a width-based srcset so the browser downloads
 * the smallest sufficient variant. Use `priority` for the LCP image (eager +
 * fetchpriority=high); leave it off for below-the-fold images (lazy-loaded).
 */
type ResponsiveImageProps = {
  /** Base name of the variants, e.g. "hero" → /images/opt/hero-640.avif */
  name: string
  /** Generated widths, must match optimize-images.mjs */
  widths: number[]
  /** Width used for the plain <img src> fallback */
  fallbackWidth: number
  alt: string
  /** Responsive `sizes` attribute, e.g. "100vw" */
  sizes: string
  className?: string
  /** Intrinsic dimensions (for aspect-ratio; CSS still controls layout) */
  width: number
  height: number
  /** LCP image: eager-load with high fetch priority */
  priority?: boolean
}

export default function ResponsiveImage({
  name,
  widths,
  fallbackWidth,
  alt,
  sizes,
  className,
  width,
  height,
  priority = false,
}: ResponsiveImageProps) {
  const srcSet = (ext: string) =>
    widths.map((w) => `/images/opt/${name}-${w}.${ext} ${w}w`).join(', ')

  return (
    // display:contents removes the <picture> box so the <img> lays out exactly
    // as a bare <img> would (matters for the absolute hero + the sized About box).
    <picture style={{ display: 'contents' }}>
      <source type="image/avif" srcSet={srcSet('avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet('webp')} sizes={sizes} />
      <img
        src={`/images/opt/${name}-${fallbackWidth}.jpg`}
        srcSet={srcSet('jpg')}
        sizes={sizes}
        alt={alt}
        className={className}
        width={width}
        height={height}
        decoding="async"
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </picture>
  )
}
