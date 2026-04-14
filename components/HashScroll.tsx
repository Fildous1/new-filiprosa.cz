'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Re-scrolls to the URL hash after the page has hydrated and painted.
 * Fixes the issue where anchor links (e.g. /#projekty) land one section
 * above the target on first load, because images above haven't loaded yet
 * and the layout hasn't settled.
 *
 * Also registers the secret keyboard shortcut: press 0 then x within 600 ms
 * (while focus is not in a text field) to navigate to /panel0x.
 */
export default function HashScroll() {
  const router = useRouter()

  useEffect(() => {
    // ── Anchor scroll fix ──────────────────────────────────────────────────
    const hash = window.location.hash
    if (hash) {
      const id = hash.slice(1)
      const scrollToId = () => {
        const el = document.getElementById(id)
        if (el) el.scrollIntoView({ behavior: 'instant' })
      }
      const raf = requestAnimationFrame(() => {
        scrollToId()
        const timer = setTimeout(scrollToId, 600)
        return () => clearTimeout(timer)
      })
      // Cleanup only the rAF; the inner timer cleanup runs inside rAF callback
      const cleanup = () => cancelAnimationFrame(raf)
      setTimeout(cleanup, 700) // safe upper bound
    }

    // ── Secret shortcut: type "0" then "x" within 600 ms → /panel0x ───────
    let lastKey = ''
    let lastTime = 0

    function onKeyDown(e: KeyboardEvent) {
      // Ignore if focus is inside any interactive/text element
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return
      if ((e.target as HTMLElement).isContentEditable) return

      const now = Date.now()
      if (e.key === '0') {
        lastKey = '0'
        lastTime = now
      } else if (e.key === 'x' && lastKey === '0' && now - lastTime < 600) {
        lastKey = ''
        router.push('/panel0x')
      } else {
        lastKey = ''
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [router])

  return null
}
