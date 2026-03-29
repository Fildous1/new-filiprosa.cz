'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  fetchGear,
  saveManifest,
  uploadFilesWithProgress,
  deleteFile,
  gearImageUrl,
  type GearManifest,
} from '@/lib/cdn-api'
import { useToast } from '@/components/admin/Toast'
import { hasPermission } from '@/lib/auth'

const SECTIONS = [
  { key: 'analog', label: 'Analog Bodies' },
  { key: 'digital', label: 'Digital Bodies' },
  { key: 'optics', label: 'Optics & Accessories' },
  { key: 'film', label: 'Films' },
  { key: 'darkroom', label: 'Darkroom' },
  { key: 'printing', label: 'Printing' },
  { key: 'digitalDarkroom', label: 'Digital Darkroom' },
]

export default function GearAdmin() {
  const [manifest, setManifest] = useState<GearManifest>({ images: {} })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const canUpload = hasPermission('gallery', 'upload')
  const canDelete = hasPermission('gallery', 'delete')

  useEffect(() => {
    fetchGear()
      .then(data => { setManifest(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function triggerUpload(sectionKey: string) {
    setActiveSection(sectionKey)
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || !activeSection) return
    const file = e.target.files[0]
    setUploading(activeSection)

    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const renamedFile = new File([file], `${activeSection}.${ext}`, { type: file.type })

      await uploadFilesWithProgress([renamedFile], 'gear', () => {})

      const updated: GearManifest = {
        images: { ...manifest.images, [activeSection]: renamedFile.name },
      }
      await saveManifest('gear', updated)
      setManifest(updated)
      toast(`Photo uploaded for ${activeSection}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploading(null)
      setActiveSection(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemove(sectionKey: string) {
    const imageFile = manifest.images[sectionKey]
    if (!imageFile) return
    setUploading(sectionKey)
    try {
      await deleteFile(`gear/${imageFile}`)
      const { [sectionKey]: _, ...rest } = manifest.images
      const updated: GearManifest = { images: rest }
      await saveManifest('gear', updated)
      setManifest(updated)
      toast(`Photo removed from ${sectionKey}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remove failed', 'error')
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-dvh bg-dark text-offwhite flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-lime/20 border-t-lime/60 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-dark text-offwhite font-body px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <Link
            href="/panel0x"
            className="text-[0.7rem] tracking-[0.14em] uppercase text-muted hover:text-offwhite transition-colors duration-200"
          >
            &larr; panel0x
          </Link>
          <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Gear</h1>
          <p className="text-[0.78rem] text-muted mt-1">Upload a photo for each gear section</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        <div className="flex flex-col gap-2">
          {SECTIONS.map(s => {
            const imageFile = manifest.images[s.key]
            return (
              <div
                key={s.key}
                className="bg-charcoal border border-white/[0.05] rounded-[3px] flex items-center gap-4 px-4 py-3"
              >
                {imageFile ? (
                  <img
                    src={gearImageUrl(imageFile)}
                    alt={s.label}
                    className="w-16 h-10 object-cover rounded-[2px] flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-10 bg-warmblack rounded-[2px] flex items-center justify-center flex-shrink-0">
                    <span className="text-[0.6rem] text-muted/30">---</span>
                  </div>
                )}
                <p className="text-[0.82rem] text-offwhite font-medium flex-1">{s.label}</p>
                <div className="flex gap-2 flex-shrink-0">
                  {canUpload && (
                    <button
                      onClick={() => triggerUpload(s.key)}
                      disabled={uploading === s.key}
                      className="px-3 py-1 text-[0.72rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 disabled:opacity-40 transition-colors duration-200"
                    >
                      {uploading === s.key ? '...' : imageFile ? 'Replace' : 'Upload'}
                    </button>
                  )}
                  {canDelete && imageFile && (
                    <button
                      onClick={() => handleRemove(s.key)}
                      disabled={uploading === s.key}
                      className="px-3 py-1 text-[0.72rem] font-medium text-red-400/60 border border-red-500/20 rounded-[2px] hover:bg-red-500/10 disabled:opacity-40 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
