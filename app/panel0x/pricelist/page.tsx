'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  fetchPricelist,
  saveManifest,
  uploadFilesWithProgress,
  deleteFile,
  pricelistImageUrl,
  type PricelistManifest,
  type PricelistPhotoItem,
  type PricelistSection,
} from '@/lib/cdn-api'
import { useToast } from '@/components/admin/Toast'
import { hasPermission } from '@/lib/auth'

const PHOTO_KEYS = ['portrait', 'event', 'product'] as const

function emptyManifest(): PricelistManifest {
  return {
    photography: PHOTO_KEYS.map(key => ({
      key,
      name: { cs: '', en: '' },
      price: { cs: '', en: '' },
      note: { cs: '', en: '' },
      description: { cs: '', en: '' },
    })),
    technical: {
      title: { cs: 'Technické služby', en: 'Technical services' },
      items: [],
    },
    extras: {
      title: { cs: 'Doplňkové služby', en: 'Extras' },
      items: [],
    },
    travel: { cs: 'Brno a Vyškov zdarma, jinde 12 Kč/km.', en: 'Brno and Vyškov free, elsewhere 12 CZK/km.' },
  }
}

function normalizePhotography(manifest: PricelistManifest): PricelistManifest {
  const existing = new Map(manifest.photography.map(p => [p.key, p]))
  const photography = PHOTO_KEYS.map(key =>
    existing.get(key) ?? {
      key,
      name: { cs: '', en: '' },
      price: { cs: '', en: '' },
      note: { cs: '', en: '' },
      description: { cs: '', en: '' },
    }
  )
  return { ...manifest, photography }
}

export default function PricelistAdmin() {
  const [manifest, setManifest] = useState<PricelistManifest>(emptyManifest())
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activePhotoKey, setActivePhotoKey] = useState<string | null>(null)
  const canUpload = hasPermission('gallery', 'upload')
  const canDelete = hasPermission('gallery', 'delete')

  useEffect(() => {
    fetchPricelist()
      .then(data => {
        setManifest(data ? normalizePhotography(data) : emptyManifest())
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  function updatePhoto(key: string, field: keyof Omit<PricelistPhotoItem, 'key' | 'image'>, lang: 'cs' | 'en', value: string) {
    setManifest(m => ({
      ...m,
      photography: m.photography.map(p =>
        p.key === key ? { ...p, [field]: { ...p[field], [lang]: value } } : p
      ),
    }))
  }

  function updateSection(section: 'technical' | 'extras', field: 'title', lang: 'cs' | 'en', value: string) {
    setManifest(m => ({
      ...m,
      [section]: { ...m[section], [field]: { ...m[section][field], [lang]: value } },
    }))
  }

  function updateRow(section: 'technical' | 'extras', idx: number, field: 'name' | 'note' | 'price', lang: 'cs' | 'en', value: string) {
    setManifest(m => {
      const items = m[section].items.map((row, i) =>
        i === idx ? { ...row, [field]: { ...row[field], [lang]: value } } : row
      )
      return { ...m, [section]: { ...m[section], items } }
    })
  }

  function addRow(section: 'technical' | 'extras') {
    setManifest(m => {
      const items = [...m[section].items, {
        name: { cs: '', en: '' },
        note: { cs: '', en: '' },
        price: { cs: '', en: '' },
      }]
      return { ...m, [section]: { ...m[section], items } }
    })
  }

  function removeRow(section: 'technical' | 'extras', idx: number) {
    setManifest(m => {
      const items = m[section].items.filter((_, i) => i !== idx)
      return { ...m, [section]: { ...m[section], items } }
    })
  }

  function moveRow(section: 'technical' | 'extras', idx: number, delta: -1 | 1) {
    setManifest(m => {
      const items = [...m[section].items]
      const target = idx + delta
      if (target < 0 || target >= items.length) return m
      ;[items[idx], items[target]] = [items[target], items[idx]]
      return { ...m, [section]: { ...m[section], items } }
    })
  }

  function updateTravel(lang: 'cs' | 'en', value: string) {
    setManifest(m => ({ ...m, travel: { ...m.travel, [lang]: value } }))
  }

  function triggerUpload(photoKey: string) {
    setActivePhotoKey(photoKey)
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || !activePhotoKey) return
    const file = e.target.files[0]
    const key = activePhotoKey
    setUploading(key)

    try {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
      const renamedFile = new File([file], `${key}.${ext}`, { type: file.type })
      await uploadFilesWithProgress([renamedFile], 'pricelist', () => {})
      const updated: PricelistManifest = {
        ...manifest,
        photography: manifest.photography.map(p =>
          p.key === key ? { ...p, image: renamedFile.name } : p
        ),
      }
      await saveManifest('pricelist', updated)
      setManifest(updated)
      toast(`Image uploaded for ${key}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploading(null)
      setActivePhotoKey(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveImage(key: string) {
    const photo = manifest.photography.find(p => p.key === key)
    if (!photo?.image) return
    setUploading(key)
    try {
      await deleteFile(`pricelist/${photo.image}`)
      const updated: PricelistManifest = {
        ...manifest,
        photography: manifest.photography.map(p =>
          p.key === key ? { ...p, image: undefined } : p
        ),
      }
      await saveManifest('pricelist', updated)
      setManifest(updated)
      toast(`Image removed from ${key}`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remove failed', 'error')
    } finally {
      setUploading(null)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveManifest('pricelist', manifest)
      setSaved(true)
      toast('Pricelist saved')
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
      <div className="max-w-4xl mx-auto">
        <div className="mb-10">
          <Link
            href="/panel0x"
            className="text-[0.7rem] tracking-[0.14em] uppercase text-muted hover:text-offwhite transition-colors duration-200"
          >
            &larr; panel0x
          </Link>
          <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Pricelist</h1>
          <p className="text-[0.78rem] text-muted mt-1">Edit photography cards, technical / extras services and travel note</p>
        </div>

        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />

        {/* Photography cards */}
        <p className="text-[0.65rem] tracking-[0.14em] uppercase text-muted/50 mb-3">Photography (large cards)</p>
        <div className="flex flex-col gap-3 mb-8">
          {manifest.photography.map(photo => (
            <div key={photo.key} className="bg-charcoal border border-white/[0.05] rounded-[3px] p-4">
              <div className="flex items-center gap-4 mb-4">
                {photo.image ? (
                  <img
                    src={pricelistImageUrl(photo.image)}
                    alt={photo.key}
                    className="w-24 h-16 object-cover rounded-[2px] flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-16 bg-warmblack rounded-[2px] flex items-center justify-center flex-shrink-0">
                    <span className="text-[0.6rem] text-muted/30">---</span>
                  </div>
                )}
                <p className="text-[0.9rem] text-offwhite font-medium flex-1 capitalize">{photo.key}</p>
                <div className="flex gap-2 flex-shrink-0">
                  {canUpload && (
                    <button
                      onClick={() => triggerUpload(photo.key)}
                      disabled={uploading === photo.key}
                      className="px-3 py-1 text-[0.72rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 disabled:opacity-40 transition-colors duration-200"
                    >
                      {uploading === photo.key ? '...' : photo.image ? 'Replace' : 'Upload'}
                    </button>
                  )}
                  {canDelete && photo.image && (
                    <button
                      onClick={() => handleRemoveImage(photo.key)}
                      disabled={uploading === photo.key}
                      className="px-3 py-1 text-[0.72rem] font-medium text-red-400/60 border border-red-500/20 rounded-[2px] hover:bg-red-500/10 disabled:opacity-40 transition-colors duration-200"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <BilingualInput label="Name" lang="cs" value={photo.name.cs} onChange={v => updatePhoto(photo.key, 'name', 'cs', v)} />
                <BilingualInput label="Name" lang="en" value={photo.name.en} onChange={v => updatePhoto(photo.key, 'name', 'en', v)} />
                <BilingualInput label="Price" lang="cs" value={photo.price.cs} onChange={v => updatePhoto(photo.key, 'price', 'cs', v)} />
                <BilingualInput label="Price" lang="en" value={photo.price.en} onChange={v => updatePhoto(photo.key, 'price', 'en', v)} />
                <BilingualInput label="Note" lang="cs" value={photo.note.cs} onChange={v => updatePhoto(photo.key, 'note', 'cs', v)} />
                <BilingualInput label="Note" lang="en" value={photo.note.en} onChange={v => updatePhoto(photo.key, 'note', 'en', v)} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <BilingualTextarea label="Description" lang="cs" value={photo.description.cs} onChange={v => updatePhoto(photo.key, 'description', 'cs', v)} />
                <BilingualTextarea label="Description" lang="en" value={photo.description.en} onChange={v => updatePhoto(photo.key, 'description', 'en', v)} />
              </div>
            </div>
          ))}
        </div>

        {/* Technical + Extras sections */}
        {(['technical', 'extras'] as const).map(sectionKey => (
          <div key={sectionKey} className="mb-8">
            <p className="text-[0.65rem] tracking-[0.14em] uppercase text-muted/50 mb-3 capitalize">{sectionKey} (small tile)</p>
            <div className="bg-charcoal border border-white/[0.05] rounded-[3px] p-4">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <BilingualInput
                  label="Section title"
                  lang="cs"
                  value={manifest[sectionKey].title.cs}
                  onChange={v => updateSection(sectionKey, 'title', 'cs', v)}
                />
                <BilingualInput
                  label="Section title"
                  lang="en"
                  value={manifest[sectionKey].title.en}
                  onChange={v => updateSection(sectionKey, 'title', 'en', v)}
                />
              </div>

              <div className="flex flex-col gap-3">
                {manifest[sectionKey].items.map((row, idx) => (
                  <div key={idx} className="bg-dark/40 border border-white/[0.04] rounded-[2px] p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[0.65rem] text-muted/50 uppercase tracking-wide">Item {idx + 1}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => moveRow(sectionKey, idx, -1)}
                          disabled={idx === 0}
                          aria-label="Move up"
                          title="Move up"
                          className="w-6 h-6 flex items-center justify-center text-muted/60 hover:text-lime disabled:opacity-25 disabled:hover:text-muted/60 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => moveRow(sectionKey, idx, 1)}
                          disabled={idx === manifest[sectionKey].items.length - 1}
                          aria-label="Move down"
                          title="Move down"
                          className="w-6 h-6 flex items-center justify-center text-muted/60 hover:text-lime disabled:opacity-25 disabled:hover:text-muted/60 disabled:cursor-not-allowed transition-colors"
                        >
                          <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                          </svg>
                        </button>
                        <button
                          onClick={() => removeRow(sectionKey, idx)}
                          className="ml-2 text-[0.7rem] text-red-400/60 hover:text-red-400 transition-colors"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <BilingualInput label="Name" lang="cs" value={row.name.cs} onChange={v => updateRow(sectionKey, idx, 'name', 'cs', v)} />
                      <BilingualInput label="Name" lang="en" value={row.name.en} onChange={v => updateRow(sectionKey, idx, 'name', 'en', v)} />
                      <BilingualInput label="Note" lang="cs" value={row.note.cs} onChange={v => updateRow(sectionKey, idx, 'note', 'cs', v)} />
                      <BilingualInput label="Note" lang="en" value={row.note.en} onChange={v => updateRow(sectionKey, idx, 'note', 'en', v)} />
                      <BilingualInput label="Price" lang="cs" value={row.price.cs} onChange={v => updateRow(sectionKey, idx, 'price', 'cs', v)} />
                      <BilingualInput label="Price" lang="en" value={row.price.en} onChange={v => updateRow(sectionKey, idx, 'price', 'en', v)} />
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => addRow(sectionKey)}
                  className="self-start px-3 py-1.5 text-[0.72rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 transition-colors duration-200"
                >
                  + Add item
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Travel note */}
        <p className="text-[0.65rem] tracking-[0.14em] uppercase text-muted/50 mb-3">Travel note (shown at end of extras)</p>
        <div className="bg-charcoal border border-white/[0.05] rounded-[3px] p-4 mb-8">
          <div className="grid grid-cols-2 gap-3">
            <BilingualInput label="Travel note" lang="cs" value={manifest.travel.cs} onChange={v => updateTravel('cs', v)} />
            <BilingualInput label="Travel note" lang="en" value={manifest.travel.en} onChange={v => updateTravel('en', v)} />
          </div>
        </div>

        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="px-5 py-2 text-[0.78rem] font-medium bg-lime/10 text-lime border border-lime/30 rounded-[2px] hover:bg-lime/20 disabled:opacity-40 transition-colors duration-200 backdrop-blur-sm"
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save pricelist'}
          </button>
        </div>
      </div>
    </div>
  )
}

function BilingualInput({ label, lang, value, onChange }: { label: string; lang: 'cs' | 'en'; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[0.62rem] text-muted/50 uppercase tracking-wide mb-1">
        {label} — {lang.toUpperCase()}
      </label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.78rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
      />
    </div>
  )
}

function BilingualTextarea({ label, lang, value, onChange }: { label: string; lang: 'cs' | 'en'; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[0.62rem] text-muted/50 uppercase tracking-wide mb-1">
        {label} — {lang.toUpperCase()}
      </label>
      <textarea
        rows={4}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.78rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
      />
    </div>
  )
}
