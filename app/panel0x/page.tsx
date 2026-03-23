'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

const ADMIN_KEY = '__fr_admin_auth'

const sections = [
  {
    href: '/panel0x/gallery',
    label: 'Gallery',
    description: 'Manage photo albums and images',
    detail: 'Upload photos, manage albums, edit captions',
  },
  {
    href: '/panel0x/museum',
    label: 'Museum',
    description: 'Manage vintage camera collection',
    detail: 'Add/edit cameras, upload thumbnails',
  },
  {
    href: '/panel0x/rosnik',
    label: 'Rosnik',
    description: 'Manage magazine issues',
    detail: 'Add/edit issues, upload PDFs and thumbnails',
  },
  {
    href: '/panel0x/gear',
    label: 'Gear',
    description: 'Manage gear section images',
    detail: 'Upload photos for each gear category',
  },
]

export default function AdminDashboard() {
  const router = useRouter()

  function handleLogout() {
    sessionStorage.removeItem(ADMIN_KEY)
    router.push('/')
  }

  return (
    <div className="min-h-dvh bg-dark text-offwhite font-body px-6 py-12">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-12">
          <div>
            <p className="text-[0.7rem] tracking-[0.18em] uppercase text-muted mb-1">Admin Panel</p>
            <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em]">panel0x</h1>
          </div>
          <button
            onClick={handleLogout}
            className="mt-1 px-4 py-1.5 text-[0.75rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:border-white/20 hover:text-offwhite focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 active:scale-[0.97] transition-colors duration-200"
          >
            Logout
          </button>
        </div>

        {/* Section links */}
        <div className="flex flex-col gap-3">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group flex items-center justify-between px-5 py-4 bg-charcoal border border-white/[0.05] rounded-[3px] hover:border-white/[0.13] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 active:scale-[0.99] transition-colors duration-200"
            >
              <div>
                <p className="text-[0.95rem] font-medium text-offwhite group-hover:text-lime transition-colors duration-200">{s.label}</p>
                <p className="text-[0.78rem] text-muted mt-0.5">{s.description}</p>
                <p className="text-[0.7rem] text-muted/40 mt-1">{s.detail}</p>
              </div>
              <span className="text-muted/40 group-hover:text-lime/50 transition-colors duration-200 ml-6 text-lg leading-none">&rarr;</span>
            </Link>
          ))}
        </div>

        {/* Links */}
        <div className="mt-10 flex gap-3">
          <a
            href="https://cdn.filiprosa.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-5 py-3.5 bg-charcoal border border-white/[0.05] rounded-[3px] hover:border-white/[0.13] transition-colors duration-200 text-center"
          >
            <p className="text-[0.68rem] text-muted/40 uppercase tracking-[0.1em] mb-0.5">CDN</p>
            <p className="text-[0.8rem] text-lime/60 font-mono">cdn.filiprosa.cz</p>
          </a>
          <a
            href="https://filiprosa.cz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 px-5 py-3.5 bg-charcoal border border-white/[0.05] rounded-[3px] hover:border-white/[0.13] transition-colors duration-200 text-center"
          >
            <p className="text-[0.68rem] text-muted/40 uppercase tracking-[0.1em] mb-0.5">Main site</p>
            <p className="text-[0.8rem] text-offwhite/60 font-mono">filiprosa.cz</p>
          </a>
        </div>

        {/* Info */}
        <div className="mt-4 px-5 py-4 bg-charcoal border border-white/[0.05] rounded-[3px]">
          <p className="text-[0.72rem] text-muted/60 leading-relaxed">
            Content is managed through this panel and stored on <span className="text-lime/50 font-mono">cdn.filiprosa.cz</span>. All pages load their content from CDN manifests at runtime.
          </p>
        </div>

      </div>
    </div>
  )
}
