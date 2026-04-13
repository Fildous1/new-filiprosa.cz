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

export default function ContactSectionAdmin() {
  const [manifest, setManifest] = useState<SiteManifest>({})
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canUpload = hasPermission('gallery', 'upload')
  const canDelete = hasPermission('gallery', 'delete')

  // Text field states
  const [aboutP1Cs, setAboutP1Cs] = useState('')
  const [aboutP1En, setAboutP1En] = useState('')
  const [aboutP2Cs, setAboutP2Cs] = useState('')
  const [aboutP2En, setAboutP2En] = useState('')

  useEffect(() => {
    fetchSite().then(data => {
      setManifest(data)
      setAboutP1Cs(data.aboutP1Cs || '')
      setAboutP1En(data.aboutP1En || '')
      setAboutP2Cs(data.aboutP2Cs || '')
      setAboutP2En(data.aboutP2En || '')
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    setUploading(true)

    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const renamedFile = new File([file], `profile.${ext}`, { type: file.type })
      await uploadFilesWithProgress([renamedFile], 'site', () => {})
      const updated: SiteManifest = { ...manifest, profileImage: renamedFile.name }
      await saveManifest('site', updated)
      setManifest(updated)
      toast('Profile image uploaded')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveImage() {
    if (!manifest.profileImage) return
    setUploading(true)
    try {
      await deleteFile(`site/${manifest.profileImage}`)
      const { profileImage: _, ...rest } = manifest
      await saveManifest('site', rest)
      setManifest(rest)
      toast('Profile image removed')
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
        aboutP1Cs: aboutP1Cs || undefined,
        aboutP1En: aboutP1En || undefined,
        aboutP2Cs: aboutP2Cs || undefined,
        aboutP2En: aboutP2En || undefined,
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
          <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Contact Section</h1>
          <p className="text-[0.78rem] text-muted mt-1">Edit the about/contact section — profile photo and bio text</p>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

        {/* Profile image */}
        <p className="text-[0.65rem] tracking-[0.14em] uppercase text-muted/50 mb-3">Profile Image</p>
        <div className="bg-charcoal border border-white/[0.05] rounded-[3px] flex items-center gap-4 px-4 py-3 mb-8">
          {manifest.profileImage ? (
            <img
              src={siteImageUrl(manifest.profileImage)}
              alt="Profile"
              className="w-16 h-16 object-cover rounded-[2px] flex-shrink-0"
            />
          ) : (
            <div className="w-16 h-16 bg-warmblack rounded-[2px] flex items-center justify-center flex-shrink-0">
              <span className="text-[0.6rem] text-muted/30">---</span>
            </div>
          )}
          <p className="text-[0.82rem] text-offwhite font-medium flex-1">profile.jpg</p>
          <div className="flex gap-2 flex-shrink-0">
            {canUpload && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1 text-[0.72rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 disabled:opacity-40 transition-colors duration-200"
              >
                {uploading ? '...' : manifest.profileImage ? 'Replace' : 'Upload'}
              </button>
            )}
            {canDelete && manifest.profileImage && (
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

        {/* About text */}
        <p className="text-[0.65rem] tracking-[0.14em] uppercase text-muted/50 mb-3">About Text</p>
        <div className="flex flex-col gap-4 bg-charcoal border border-white/[0.05] rounded-[3px] p-5 mb-6">

          <div>
            <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Paragraph 1 — CS</label>
            <textarea
              rows={4}
              value={aboutP1Cs}
              onChange={e => setAboutP1Cs(e.target.value)}
              placeholder="[placeholder]"
              className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
            />
          </div>
          <div>
            <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Paragraph 1 — EN</label>
            <textarea
              rows={4}
              value={aboutP1En}
              onChange={e => setAboutP1En(e.target.value)}
              placeholder="[placeholder]"
              className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
            />
          </div>
          <div>
            <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Paragraph 2 — CS</label>
            <textarea
              rows={3}
              value={aboutP2Cs}
              onChange={e => setAboutP2Cs(e.target.value)}
              placeholder="[placeholder]"
              className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
            />
          </div>
          <div>
            <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Paragraph 2 — EN</label>
            <textarea
              rows={3}
              value={aboutP2En}
              onChange={e => setAboutP2En(e.target.value)}
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
