'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  fetchGraphics,
  saveManifest,
  uploadFilesWithProgress,
  deleteFile,
  graphicsAssetUrl,
  type GraphicsManifest,
  type GraphicsItem,
} from '@/lib/cdn-api'
import { useToast } from '@/components/admin/Toast'
import { hasPermission } from '@/lib/auth'

type UploadKind = 'image' | 'file'

function emptyItem(id: string): GraphicsItem {
  return {
    id,
    title: { cs: '', en: '' },
    format: '',
    description: { cs: '', en: '' },
  }
}

function genId(): string {
  return `g${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

function sanitizeFileBase(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '_')
}

export default function GraphicsAdmin() {
  const [manifest, setManifest] = useState<GraphicsManifest>({ items: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [uploading, setUploading] = useState<string | null>(null)
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [active, setActive] = useState<{ itemId: string; kind: UploadKind } | null>(null)
  const canUpload = hasPermission('gallery', 'upload')
  const canDelete = hasPermission('gallery', 'delete')

  useEffect(() => {
    fetchGraphics()
      .then(data => { setManifest({ items: data.items ?? [] }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function updateItem(id: string, updater: (item: GraphicsItem) => GraphicsItem) {
    setManifest(m => ({ items: m.items.map(it => it.id === id ? updater(it) : it) }))
  }

  function updateText(id: string, field: 'title' | 'description', lang: 'cs' | 'en', value: string) {
    updateItem(id, it => ({ ...it, [field]: { ...it[field], [lang]: value } }))
  }

  function updateFormat(id: string, value: string) {
    updateItem(id, it => ({ ...it, format: value }))
  }

  function addItem() {
    setManifest(m => ({ items: [...m.items, emptyItem(genId())] }))
  }

  function removeItem(id: string) {
    setManifest(m => ({ items: m.items.filter(it => it.id !== id) }))
  }

  function moveItem(id: string, delta: -1 | 1) {
    setManifest(m => {
      const idx = m.items.findIndex(it => it.id === id)
      if (idx === -1) return m
      const target = idx + delta
      if (target < 0 || target >= m.items.length) return m
      const items = [...m.items]
      ;[items[idx], items[target]] = [items[target], items[idx]]
      return { items }
    })
  }

  function triggerUpload(itemId: string, kind: UploadKind) {
    setActive({ itemId, kind })
    setTimeout(() => fileInputRef.current?.click(), 50)
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || !active) return
    const file = e.target.files[0]
    const { itemId, kind } = active
    setUploading(`${itemId}:${kind}`)

    try {
      const safeBase = sanitizeFileBase(file.name)
      const cdnFilename = `${itemId}_${kind}_${safeBase}`
      const renamedFile = new File([file], cdnFilename, { type: file.type })
      await uploadFilesWithProgress([renamedFile], 'graphics', () => {})

      // Delete the previous file/image if any, then update manifest
      const prev = manifest.items.find(it => it.id === itemId)
      const oldName = kind === 'image' ? prev?.image : prev?.file
      if (oldName && oldName !== cdnFilename) {
        try { await deleteFile(`graphics/${oldName}`) } catch { /* ignore */ }
      }

      const updated: GraphicsManifest = {
        items: manifest.items.map(it =>
          it.id === itemId ? { ...it, [kind]: cdnFilename } : it
        ),
      }
      await saveManifest('graphics', updated)
      setManifest(updated)
      toast(`${kind === 'image' ? 'Preview' : 'File'} uploaded`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploading(null)
      setActive(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleRemoveAsset(itemId: string, kind: UploadKind) {
    const item = manifest.items.find(it => it.id === itemId)
    const name = kind === 'image' ? item?.image : item?.file
    if (!name) return
    setUploading(`${itemId}:${kind}`)
    try {
      await deleteFile(`graphics/${name}`)
      const updated: GraphicsManifest = {
        items: manifest.items.map(it =>
          it.id === itemId ? { ...it, [kind]: undefined } : it
        ),
      }
      await saveManifest('graphics', updated)
      setManifest(updated)
      toast(`${kind === 'image' ? 'Preview' : 'File'} removed`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Remove failed', 'error')
    } finally {
      setUploading(null)
    }
  }

  async function handleSave() {
    setSaving(true)
    try {
      await saveManifest('graphics', manifest)
      setSaved(true)
      toast('Graphics saved')
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
          <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Graphics</h1>
          <p className="text-[0.78rem] text-muted mt-1">Wallpapers and other downloadable graphics shown on /grafika</p>
        </div>

        <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" />

        <div className="flex flex-col gap-3 mb-6">
          {manifest.items.length === 0 ? (
            <div className="px-5 py-8 bg-charcoal border border-white/[0.05] rounded-[3px] text-center">
              <p className="text-[0.8rem] text-muted">No graphics yet.</p>
            </div>
          ) : (
            manifest.items.map((item, idx) => (
              <div key={item.id} className="bg-charcoal border border-white/[0.05] rounded-[3px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[0.65rem] text-muted/50 uppercase tracking-wide font-mono">{item.id}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => moveItem(item.id, -1)}
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
                      onClick={() => moveItem(item.id, 1)}
                      disabled={idx === manifest.items.length - 1}
                      aria-label="Move down"
                      title="Move down"
                      className="w-6 h-6 flex items-center justify-center text-muted/60 hover:text-lime disabled:opacity-25 disabled:hover:text-muted/60 disabled:cursor-not-allowed transition-colors"
                    >
                      <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="ml-2 text-[0.7rem] text-red-400/60 hover:text-red-400 transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Assets row */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <AssetSlot
                    label="Preview image"
                    name={item.image}
                    url={item.image ? graphicsAssetUrl(item.image) : undefined}
                    uploading={uploading === `${item.id}:image`}
                    onUpload={() => triggerUpload(item.id, 'image')}
                    onRemove={() => handleRemoveAsset(item.id, 'image')}
                    canUpload={canUpload}
                    canDelete={canDelete}
                  />
                  <AssetSlot
                    label="Downloadable file"
                    name={item.file}
                    url={item.file ? graphicsAssetUrl(item.file) : undefined}
                    uploading={uploading === `${item.id}:file`}
                    onUpload={() => triggerUpload(item.id, 'file')}
                    onRemove={() => handleRemoveAsset(item.id, 'file')}
                    canUpload={canUpload}
                    canDelete={canDelete}
                  />
                </div>

                {/* Texts */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <TextInput label="Title" lang="cs" value={item.title.cs} onChange={v => updateText(item.id, 'title', 'cs', v)} />
                  <TextInput label="Title" lang="en" value={item.title.en} onChange={v => updateText(item.id, 'title', 'en', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[0.62rem] text-muted/50 uppercase tracking-wide mb-1">Format</label>
                    <input
                      value={item.format}
                      onChange={e => updateFormat(item.id, e.target.value)}
                      placeholder="PNG / PDF / ZIP"
                      className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.78rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <TextArea label="Description" lang="cs" value={item.description.cs} onChange={v => updateText(item.id, 'description', 'cs', v)} />
                  <TextArea label="Description" lang="en" value={item.description.en} onChange={v => updateText(item.id, 'description', 'en', v)} />
                </div>
              </div>
            ))
          )}

          <button
            onClick={addItem}
            className="self-start px-3 py-1.5 text-[0.72rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 transition-colors duration-200"
          >
            + Add graphic
          </button>
        </div>

        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="px-5 py-2 text-[0.78rem] font-medium bg-lime/10 text-lime border border-lime/30 rounded-[2px] hover:bg-lime/20 disabled:opacity-40 transition-colors duration-200 backdrop-blur-sm"
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save graphics'}
          </button>
        </div>
      </div>
    </div>
  )
}

function AssetSlot({
  label,
  name,
  url,
  uploading,
  onUpload,
  onRemove,
  canUpload,
  canDelete,
}: {
  label: string
  name?: string
  url?: string
  uploading: boolean
  onUpload: () => void
  onRemove: () => void
  canUpload: boolean
  canDelete: boolean
}) {
  return (
    <div className="bg-dark/40 border border-white/[0.04] rounded-[2px] p-3">
      <label className="block text-[0.62rem] text-muted/50 uppercase tracking-wide mb-2">{label}</label>
      <div className="flex items-center gap-3">
        {url ? (
          <img src={url} alt={label} className="w-16 h-12 object-cover rounded-[2px] flex-shrink-0 bg-warmblack" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }} />
        ) : (
          <div className="w-16 h-12 bg-warmblack rounded-[2px] flex items-center justify-center flex-shrink-0">
            <span className="text-[0.6rem] text-muted/30">---</span>
          </div>
        )}
        <p className="flex-1 text-[0.7rem] text-muted/70 truncate font-mono" title={name}>{name || '—'}</p>
        <div className="flex gap-2 flex-shrink-0">
          {canUpload && (
            <button
              onClick={onUpload}
              disabled={uploading}
              className="px-2.5 py-1 text-[0.7rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 disabled:opacity-40 transition-colors duration-200"
            >
              {uploading ? '...' : name ? 'Replace' : 'Upload'}
            </button>
          )}
          {canDelete && name && (
            <button
              onClick={onRemove}
              disabled={uploading}
              className="px-2.5 py-1 text-[0.7rem] font-medium text-red-400/60 border border-red-500/20 rounded-[2px] hover:bg-red-500/10 disabled:opacity-40 transition-colors duration-200"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function TextInput({ label, lang, value, onChange }: { label: string; lang: 'cs' | 'en'; value: string; onChange: (v: string) => void }) {
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

function TextArea({ label, lang, value, onChange }: { label: string; lang: 'cs' | 'en'; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-[0.62rem] text-muted/50 uppercase tracking-wide mb-1">
        {label} — {lang.toUpperCase()}
      </label>
      <textarea
        rows={3}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.78rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
      />
    </div>
  )
}
