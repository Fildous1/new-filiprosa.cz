'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  fetchSite,
  saveManifest,
  uploadFilesWithProgress,
  deleteFile,
  siteImageUrl,
  type SiteManifest,
} from '@/lib/cdn-api'
import { useToast } from '@/components/admin/Toast'
import { hasPermission } from '@/lib/auth'

export default function LandingAdmin() {
  const [manifest, setManifest] = useState<SiteManifest>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canUpload = hasPermission('gallery', 'upload')
  const canDelete = hasPermission('gallery', 'delete')

  const [heroLine1Cs, setHeroLine1Cs] = useState('')
  const [heroLine1En, setHeroLine1En] = useState('')
  const [heroLine2Cs, setHeroLine2Cs] = useState('')
  const [heroLine2En, setHeroLine2En] = useState('')
  const [heroDescCs, setHeroDescCs] = useState('')
  const [heroDescEn, setHeroDescEn] = useState('')

  useEffect(() => {
    fetchSite().then(data => {
      setManifest(data)
      setHeroLine1Cs(data.heroLine1Cs || '')
      setHeroLine1En(data.heroLine1En || '')
      setHeroLine2Cs(data.heroLine2Cs || '')
      setHeroLine2En(data.heroLine2En || '')
      setHeroDescCs(data.heroDescCs || '')
      setHeroDescEn(data.heroDescEn || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    setUploading(true)

    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const renamedFile = new File([file], `landing.${ext}`, { type: file.type })
      await uploadFilesWithProgress([renamedFile], 'site', () => {})
      const updated: SiteManifest = { ...manifest, landingImage: renamedFile.name }
      await saveManifest('site', updated)
      setManifest(updated)
      toast('Landing image uploaded')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveImage() {
    if (!manifest.landingImage) return
    setUploading(true)
    try {
      await deleteFile(`site/${manifest.landingImage}`)
      const { landingImage: _, ...rest } = manifest
      await saveManifest('site', rest)
      setManifest(rest)
      toast('Landing image removed')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remove failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleSaveText() {
    setSaving(true)
    try {
      const updated: SiteManifest = {
        ...manifest,
        heroLine1Cs: heroLine1Cs || undefined,
        heroLine1En: heroLine1En || undefined,
        heroLine2Cs: heroLine2Cs || undefined,
        heroLine2En: heroLine2En || undefined,
        heroDescCs: heroDescCs || undefined,
        heroDescEn: heroDescEn || undefined,
      }
      await saveManifest('site', updated)
      setManifest(updated)
      setSaved(true)
      toast('Text saved')
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
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
      <div className="max-w-2xl mx-auto">
        <div className="mb-10">
          <Link
            href="/panel0x"
            className="text-[0.7rem] tracking-[0.14em] uppercase text-muted hover:text-offwhite transition-colors duration-200"
          >
            &larr; panel0x
          </Link>
          <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Landing</h1>
          <p className="text-[0.78rem] text-muted mt-1">Edit the hero section — background image and headline text</p>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

        {/* Landing image */}
        <p className="text-[0.65rem] tracking-[0.14em] uppercase text-muted/50 mb-3">Background Image</p>
        <div className="bg-charcoal border border-white/[0.05] rounded-[3px] flex items-center gap-4 px-4 py-3 mb-8">
          {manifest.landingImage ? (
            <img
              src={siteImageUrl(manifest.landingImage)}
              alt="Landing"
              className="w-24 h-14 object-cover rounded-[2px] flex-shrink-0"
            />
          ) : (
            <div className="w-24 h-14 bg-warmblack rounded-[2px] flex items-center justify-center flex-shrink-0">
              <span className="text-[0.6rem] text-muted/30">---</span>
            </div>
          )}
          <p className="text-[0.82rem] text-offwhite font-medium flex-1">landing.jpg</p>
          <div className="flex gap-2 flex-shrink-0">
            {canUpload && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1 text-[0.72rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 disabled:opacity-40 transition-colors duration-200"
              >
                {uploading ? '...' : manifest.landingImage ? 'Replace' : 'Upload'}
              </button>
            )}
            {canDelete && manifest.landingImage && (
              <button
                onClick={handleRemoveImage}
                disabled={uploading}
                className="px-3 py-1 text-[0.72rem] font-medium text-red-400/60 border border-red-500/20 rounded-[2px] hover:bg-red-500/10 disabled:opacity-40 transition-colors duration-200"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Hero text */}
        <p className="text-[0.65rem] tracking-[0.14em] uppercase text-muted/50 mb-3">Headline Text</p>
        <div className="flex flex-col gap-4 bg-charcoal border border-white/[0.05] rounded-[3px] p-5 mb-6">

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Title line 1 — CS</label>
              <input
                value={heroLine1Cs}
                onChange={e => setHeroLine1Cs(e.target.value)}
                placeholder="[placeholder]"
                className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
              />
            </div>
            <div>
              <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Title line 1 — EN</label>
              <input
                value={heroLine1En}
                onChange={e => setHeroLine1En(e.target.value)}
                placeholder="[placeholder]"
                className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Title line 2 — CS</label>
              <input
                value={heroLine2Cs}
                onChange={e => setHeroLine2Cs(e.target.value)}
                placeholder="[placeholder]"
                className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
              />
            </div>
            <div>
              <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Title line 2 — EN</label>
              <input
                value={heroLine2En}
                onChange={e => setHeroLine2En(e.target.value)}
                placeholder="[placeholder]"
                className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
              />
            </div>
          </div>

          <div>
            <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Description — CS</label>
            <textarea
              rows={2}
              value={heroDescCs}
              onChange={e => setHeroDescCs(e.target.value)}
              placeholder="[placeholder]"
              className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
            />
          </div>
          <div>
            <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Description — EN</label>
            <textarea
              rows={2}
              value={heroDescEn}
              onChange={e => setHeroDescEn(e.target.value)}
              placeholder="[placeholder]"
              className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSaveText}
              disabled={saving || saved}
              className="px-4 py-1.5 text-[0.75rem] font-medium bg-lime/10 text-lime border border-lime/20 rounded-[2px] hover:bg-lime/20 disabled:opacity-40 transition-colors duration-200"
            >
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save text'}
            </button>
          </div>
        </div>

        <p className="text-[0.68rem] text-muted/40 leading-relaxed">
          Leave fields empty to use the default built-in text. Images are stored at <span className="font-mono text-lime/40">cdn/site/</span>.
        </p>
      </div>
    </div>
  )
}
