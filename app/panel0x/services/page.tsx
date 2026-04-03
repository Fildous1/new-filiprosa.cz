'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  fetchServices,
  saveManifest,
  uploadFilesWithProgress,
  deleteFile,
  servicesImageUrl,
  type ServicesManifest,
} from '@/lib/cdn-api'
import { useToast } from '@/components/admin/Toast'
import { hasPermission } from '@/lib/auth'

const CARDS = [
  { key: 'capture', label: 'Capture' },
  { key: 'processing', label: 'Processing' },
  { key: 'prints', label: 'Prints' },
  { key: 'digital', label: 'Digitalization' },
]

export default function ServicesAdmin() {
  const [manifest, setManifest] = useState<ServicesManifest>({ images: {} })
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeCard, setActiveCard] = useState<string | null>(null)
  const canUpload = hasPermission('gallery', 'upload')
  const canDelete = hasPermission('gallery', 'delete')

  useEffect(() => {
    fetchServices()
      .then(data => { setManifest(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function triggerUpload(cardKey: string) {
    setActiveCard(cardKey)
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || !activeCard) return
    const file = e.target.files[0]
    setUploading(activeCard)

    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const renamedFile = new File([file], `${activeCard}.${ext}`, { type: file.type })

      await uploadFilesWithProgress([renamedFile], 'services', () => {})

      const updated: ServicesManifest = {
        images: { ...manifest.images, [activeCard]: renamedFile.name },
      }
      await saveManifest('services', updated)
      setManifest(updated)
      toast(`Photo uploaded for ${activeCard}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploading(null)
      setActiveCard(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemove(cardKey: string) {
    const imageFile = manifest.images[cardKey]
    if (!imageFile) return
    setUploading(cardKey)
    try {
      await deleteFile(`services/${imageFile}`)
      const { [cardKey]: _, ...rest } = manifest.images
      const updated: ServicesManifest = { images: rest }
      await saveManifest('services', updated)
      setManifest(updated)
      toast(`Photo removed from ${cardKey}`)
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
          <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Services</h1>
          <p className="text-[0.78rem] text-muted mt-1">Upload background images for each service card</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          className="hidden"
        />

        <div className="flex flex-col gap-2">
          {CARDS.map(c => {
            const imageFile = manifest.images[c.key]
            return (
              <div
                key={c.key}
                className="bg-charcoal border border-white/[0.05] rounded-[3px] flex items-center gap-4 px-4 py-3"
              >
                {imageFile ? (
                  <img
                    src={servicesImageUrl(imageFile)}
                    alt={c.label}
                    className="w-16 h-10 object-cover rounded-[2px] flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-10 bg-warmblack rounded-[2px] flex items-center justify-center flex-shrink-0">
                    <span className="text-[0.6rem] text-muted/30">---</span>
                  </div>
                )}
                <p className="text-[0.82rem] text-offwhite font-medium flex-1">{c.label}</p>
                <div className="flex gap-2 flex-shrink-0">
                  {canUpload && (
                    <button
                      onClick={() => triggerUpload(c.key)}
                      disabled={uploading === c.key}
                      className="px-3 py-1 text-[0.72rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 disabled:opacity-40 transition-colors duration-200"
                    >
                      {uploading === c.key ? '...' : imageFile ? 'Replace' : 'Upload'}
                    </button>
                  )}
                  {canDelete && imageFile && (
                    <button
                      onClick={() => handleRemove(c.key)}
                      disabled={uploading === c.key}
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
