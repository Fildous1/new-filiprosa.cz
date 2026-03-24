'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useToast } from '@/components/admin/Toast'
import {
  fetchMuseum,
  saveManifest,
  uploadFilesWithProgress,
  deleteFile,
  museumImageUrl,
  type MuseumManifest,
  type Camera,
} from '@/lib/cdn-api'

/** Match PHP: preg_replace('/[^a-zA-Z0-9._-]/', '_', $name) */
function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_')
}

const EMPTY_CAMERA: Omit<Camera, 'id'> = {
  brand: '',
  model: '',
  description: { cs: '', en: '' },
  type: 'Point & Shoot',
  sensor: '35mm',
  isAnalog: true,
  hasFlash: false,
  isWorking: true,
  releaseYear: 2025,
  releaseCountry: { cs: '', en: '' },
  acquisitionYear: 2025,
  purchasePrice: 0,
  note: { cs: '', en: '' },
  link: '',
  image: 'thumb.jpg',
  galleryImages: [],
  sampleImages: [],
}

export default function MuseumAdmin() {
  const [manifest, setManifest] = useState<MuseumManifest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ loaded: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [editing, setEditing] = useState<Camera | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [thumbFile, setThumbFile] = useState<File | null>(null)

  // Gallery/sample photo upload for a specific camera
  const [galleryUploadId, setGalleryUploadId] = useState<number | null>(null)
  const [galleryUploadType, setGalleryUploadType] = useState<'gallery' | 'sample'>('gallery')
  const [galleryUploading, setGalleryUploading] = useState(false)
  const [galleryProgress, setGalleryProgress] = useState<{ loaded: number; total: number } | null>(null)

  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const data = await fetchMuseum()
      setManifest(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setLoading(false)
    }
  }

  function startAdd() {
    const nextId = manifest ? Math.max(0, ...manifest.cameras.map(c => c.id)) + 1 : 1
    setEditing({ ...EMPTY_CAMERA, id: nextId } as Camera)
    setIsNew(true)
    setThumbFile(null)
  }

  function startEdit(camera: Camera) {
    setEditing({ ...camera })
    setIsNew(false)
    setThumbFile(null)
  }

  async function handleSaveCamera() {
    if (!manifest || !editing) return
    setSaving(true)

    try {
      // Upload thumbnail if provided
      if (thumbFile) {
        setUploading(true)
        setUploadProgress(null)
        await uploadFilesWithProgress([thumbFile], `museum/${editing.id}`, (loaded, total) => {
          setUploadProgress({ loaded, total })
        })
        setUploading(false)
        setUploadProgress(null)
      }

      let updated: MuseumManifest
      if (isNew) {
        updated = { ...manifest, cameras: [...manifest.cameras, editing] }
      } else {
        updated = {
          ...manifest,
          cameras: manifest.cameras.map(c => c.id === editing.id ? editing : c),
        }
      }

      await saveManifest('museum', updated)
      setManifest(updated)
      setEditing(null)
      setIsNew(false)
      toast(isNew ? 'Camera added' : 'Camera updated')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  async function handleDeleteCamera(id: number) {
    if (!manifest) return
    const updated: MuseumManifest = {
      ...manifest,
      cameras: manifest.cameras.filter(c => c.id !== id),
    }
    setSaving(true)
    try {
      await saveManifest('museum', updated)
      setManifest(updated)
      toast('Camera deleted')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleUploadGalleryPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || !manifest || galleryUploadId === null) return
    const files = Array.from(e.target.files)
    setGalleryUploading(true)
    setGalleryProgress(null)

    try {
      await uploadFilesWithProgress(files, `museum/${galleryUploadId}`, (loaded, total) => {
        setGalleryProgress({ loaded, total })
      })

      const newFilenames = files.map(f => sanitizeFilename(f.name))
      const cam = manifest.cameras.find(c => c.id === galleryUploadId)
      const field = galleryUploadType === 'sample' ? 'sampleImages' : 'galleryImages'
      const existing = cam?.[field] ?? []

      const merged = [...existing, ...newFilenames]
      const deduped = [...new Set(merged)]

      const updated: MuseumManifest = {
        ...manifest,
        cameras: manifest.cameras.map(c =>
          c.id === galleryUploadId
            ? { ...c, [field]: deduped }
            : c
        ),
      }
      await saveManifest('museum', updated)
      setManifest(updated)
      toast(`${files.length} ${galleryUploadType === 'sample' ? 'sample' : 'gallery'} photo(s) uploaded`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setGalleryUploading(false)
      setGalleryProgress(null)
      setGalleryUploadId(null)
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  async function handleDeletePhoto(cameraId: number, filename: string, type: 'gallery' | 'sample') {
    if (!manifest) return
    try {
      await deleteFile(`museum/${cameraId}/${filename}`)
    } catch { /* continue */ }

    const field = type === 'sample' ? 'sampleImages' : 'galleryImages'
    const updated: MuseumManifest = {
      ...manifest,
      cameras: manifest.cameras.map(c =>
        c.id === cameraId
          ? { ...c, [field]: (c[field] ?? []).filter((f: string) => f !== filename) }
          : c
      ),
    }
    await handleSave(updated)
  }

  async function handleSave(updated: MuseumManifest) {
    setSaving(true)
    try {
      await saveManifest('museum', updated)
      setManifest(updated)
      toast('Saved')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  const working = manifest?.cameras.filter(c => c.isWorking).length ?? 0
  const analog = manifest?.cameras.filter(c => c.isAnalog).length ?? 0

  if (loading) {
    return (
      <div className="min-h-dvh bg-dark text-offwhite flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-lime/20 border-t-lime/60 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-dark text-offwhite font-body px-6 py-12">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <Link
              href="/panel0x"
              className="text-[0.7rem] tracking-[0.14em] uppercase text-muted hover:text-offwhite focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 transition-colors duration-200"
            >
              &larr; panel0x
            </Link>
            <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Museum</h1>
            <p className="text-[0.78rem] text-muted mt-1">
              {manifest?.cameras.length ?? 0} cameras &middot; {analog} analog &middot; {working} working
            </p>
          </div>
          <button
            onClick={startAdd}
            className="px-4 py-1.5 text-[0.75rem] font-medium text-lime border border-lime/30 rounded-[2px] hover:bg-lime/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime/50 active:scale-[0.97] transition-colors duration-200"
          >
            + Camera
          </button>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-[2px] text-[0.78rem] text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-3 text-red-400/50 hover:text-red-400">&times;</button>
          </div>
        )}

        {/* Camera Form Modal */}
        {editing && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-12 pb-12 overflow-y-auto bg-dark/80 backdrop-blur-sm">
            <div className="flex flex-col items-end gap-2 w-full max-w-2xl my-auto">
              <button
                onClick={() => { setEditing(null); setIsNew(false) }}
                className="w-8 h-8 flex items-center justify-center text-muted hover:text-offwhite transition-colors duration-200 flex-shrink-0"
                aria-label="Close"
              >
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
              <div className="bg-charcoal border border-white/[0.08] rounded-[3px] p-6 w-full">
              <h3 className="text-[0.95rem] font-display font-medium text-offwhite mb-5">
                {isNew ? 'Add Camera' : `Edit: ${editing.brand} ${editing.model}`}
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Brand" value={editing.brand} onChange={v => setEditing(p => p ? { ...p, brand: v } : null)} />
                <Field label="Model" value={editing.model} onChange={v => setEditing(p => p ? { ...p, model: v } : null)} />
                <Field label="Type" value={editing.type} onChange={v => setEditing(p => p ? { ...p, type: v } : null)} />
                <Field label="Sensor / Format" value={editing.sensor} onChange={v => setEditing(p => p ? { ...p, sensor: v } : null)} />
                <Field label="Release Year" type="number" value={String(editing.releaseYear)} onChange={v => setEditing(p => p ? { ...p, releaseYear: Number(v) } : null)} />
                <Field label="Acquisition Year" type="number" value={String(editing.acquisitionYear)} onChange={v => setEditing(p => p ? { ...p, acquisitionYear: Number(v) } : null)} />
                <Field label="Country (CS)" value={editing.releaseCountry.cs} onChange={v => setEditing(p => p ? { ...p, releaseCountry: { ...p.releaseCountry, cs: v } } : null)} />
                <Field label="Country (EN)" value={editing.releaseCountry.en} onChange={v => setEditing(p => p ? { ...p, releaseCountry: { ...p.releaseCountry, en: v } } : null)} />
                <Field label="Purchase Price (CZK)" type="number" value={String(editing.purchasePrice)} onChange={v => setEditing(p => p ? { ...p, purchasePrice: Number(v) } : null)} />
                <Field label="Link" value={editing.link ?? ''} onChange={v => setEditing(p => p ? { ...p, link: v } : null)} />

                <div className="col-span-2">
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Description (CS)</label>
                  <textarea
                    value={editing.description.cs}
                    onChange={e => setEditing(p => p ? { ...p, description: { ...p.description, cs: e.target.value } } : null)}
                    rows={3}
                    className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Description (EN)</label>
                  <textarea
                    value={editing.description.en}
                    onChange={e => setEditing(p => p ? { ...p, description: { ...p.description, en: e.target.value } } : null)}
                    rows={3}
                    className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
                  />
                </div>

                <Field label="Note (CS)" value={editing.note?.cs ?? ''} onChange={v => setEditing(p => p ? { ...p, note: { cs: v, en: p.note?.en ?? '' } } : null)} />
                <Field label="Note (EN)" value={editing.note?.en ?? ''} onChange={v => setEditing(p => p ? { ...p, note: { cs: p.note?.cs ?? '', en: v } } : null)} />

                {/* Toggles */}
                <div className="col-span-2 flex flex-wrap gap-4 mt-1">
                  <Toggle label="Analog" checked={editing.isAnalog} onChange={v => setEditing(p => p ? { ...p, isAnalog: v } : null)} />
                  <Toggle label="Has Flash" checked={editing.hasFlash} onChange={v => setEditing(p => p ? { ...p, hasFlash: v } : null)} />
                  <Toggle label="Working" checked={editing.isWorking} onChange={v => setEditing(p => p ? { ...p, isWorking: v } : null)} />
                </div>

                {/* Thumbnail upload */}
                <div className="col-span-2 mt-2">
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Thumbnail Image</label>
                  <div className="flex items-center gap-3">
                    {!isNew && (
                      <div className="w-16 h-16 bg-dark border border-white/[0.06] rounded-[2px] overflow-hidden flex-shrink-0">
                        <img
                          src={museumImageUrl(editing.id, editing.image)}
                          alt="Current"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    )}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 text-[0.72rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite hover:border-white/20 transition-colors duration-200"
                    >
                      {thumbFile ? thumbFile.name : 'Choose file...'}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={e => {
                        const f = e.target.files?.[0]
                        if (f) {
                          setThumbFile(f)
                          setEditing(p => p ? { ...p, image: sanitizeFilename(f.name) } : null)
                        }
                      }}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {uploading && uploadProgress && (
                <div className="mt-4 flex items-center gap-3">
                  <div className="flex-1 h-1.5 bg-dark border border-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-lime/60 rounded-full transition-[width] duration-150"
                      style={{ width: `${uploadProgress.total > 0 ? Math.round((uploadProgress.loaded / uploadProgress.total) * 100) : 0}%` }}
                    />
                  </div>
                  <span className="text-[0.65rem] text-muted font-mono whitespace-nowrap">
                    {uploadProgress.total > 0 ? Math.round((uploadProgress.loaded / uploadProgress.total) * 100) : 0}%
                  </span>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveCamera}
                  disabled={saving || !editing.brand || !editing.model}
                  className="px-4 py-1.5 text-[0.75rem] font-medium bg-lime/10 text-lime border border-lime/20 rounded-[2px] hover:bg-lime/20 disabled:opacity-40 transition-colors duration-200"
                >
                  {saving ? (uploading ? 'Uploading...' : 'Saving...') : isNew ? 'Add Camera' : 'Save Changes'}
                </button>
                <button
                  onClick={() => { setEditing(null); setIsNew(false) }}
                  className="px-4 py-1.5 text-[0.75rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
              </div>
            </div>
          </div>
        )}

        {/* Hidden gallery file input */}
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleUploadGalleryPhotos}
          className="hidden"
        />

        {/* Table */}
        <div className="overflow-x-auto rounded-[3px] border border-white/[0.05]">
          <table className="w-full text-[0.78rem] border-collapse">
            <thead>
              <tr className="border-b border-white/[0.07] bg-charcoal">
                <th className="px-3 py-3 text-left text-[0.68rem] tracking-[0.1em] uppercase text-muted font-medium w-10">ID</th>
                <th className="px-3 py-3 text-left text-[0.68rem] tracking-[0.1em] uppercase text-muted font-medium w-10">Img</th>
                <th className="px-3 py-3 text-left text-[0.68rem] tracking-[0.1em] uppercase text-muted font-medium">Brand</th>
                <th className="px-3 py-3 text-left text-[0.68rem] tracking-[0.1em] uppercase text-muted font-medium">Model</th>
                <th className="px-3 py-3 text-left text-[0.68rem] tracking-[0.1em] uppercase text-muted font-medium">Type</th>
                <th className="px-3 py-3 text-left text-[0.68rem] tracking-[0.1em] uppercase text-muted font-medium">Sensor</th>
                <th className="px-3 py-3 text-left text-[0.68rem] tracking-[0.1em] uppercase text-muted font-medium">Year</th>
                <th className="px-3 py-3 text-left text-[0.68rem] tracking-[0.1em] uppercase text-muted font-medium">Photos</th>
                <th className="px-3 py-3 text-left text-[0.68rem] tracking-[0.1em] uppercase text-muted font-medium">Status</th>
                <th className="px-3 py-3 text-right text-[0.68rem] tracking-[0.1em] uppercase text-muted font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {manifest?.cameras.map((cam, i) => (
                <tr
                  key={cam.id}
                  className={`border-b border-white/[0.04] hover:bg-charcoal/60 transition-colors duration-150 ${i % 2 === 0 ? '' : 'bg-white/[0.015]'}`}
                >
                  <td className="px-3 py-2.5 text-muted/50 font-mono text-[0.7rem]">{cam.id}</td>
                  <td className="px-3 py-2.5">
                    <div className="w-9 h-9 bg-charcoal border border-white/[0.06] rounded-[2px] overflow-hidden flex-shrink-0">
                      <img
                        src={museumImageUrl(cam.id, cam.image)}
                        alt={`${cam.brand} ${cam.model}`}
                        className="w-full h-full object-cover opacity-80"
                        loading="lazy"
                      />
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-offwhite font-medium whitespace-nowrap">{cam.brand}</td>
                  <td className="px-3 py-2.5 text-offwhite/80 whitespace-nowrap">{cam.model}</td>
                  <td className="px-3 py-2.5 text-muted whitespace-nowrap">{cam.type}</td>
                  <td className="px-3 py-2.5 text-muted font-mono text-[0.72rem] whitespace-nowrap">{cam.sensor}</td>
                  <td className="px-3 py-2.5 text-muted whitespace-nowrap">{cam.releaseYear}</td>
                  <td className="px-3 py-2.5 text-muted whitespace-nowrap">
                    <span className="text-[0.68rem]" title="Camera photos">{cam.galleryImages?.length ?? 0}</span>
                    <span className="text-[0.58rem] text-muted/30 mx-0.5">/</span>
                    <span className="text-[0.68rem]" title="Sample shots">{cam.sampleImages?.length ?? 0}</span>
                    <button
                      onClick={() => {
                        setGalleryUploadId(cam.id)
                        setGalleryUploadType('gallery')
                        galleryInputRef.current?.click()
                      }}
                      disabled={galleryUploading}
                      className="ml-1.5 px-1 py-0.5 text-[0.55rem] font-medium text-lime/50 border border-lime/10 rounded-[2px] hover:text-lime hover:border-lime/30 disabled:opacity-30 transition-colors duration-200"
                      title="Upload camera photos"
                    >
                      +cam
                    </button>
                    <button
                      onClick={() => {
                        setGalleryUploadId(cam.id)
                        setGalleryUploadType('sample')
                        galleryInputRef.current?.click()
                      }}
                      disabled={galleryUploading}
                      className="ml-1 px-1 py-0.5 text-[0.55rem] font-medium text-muted/40 border border-white/[0.06] rounded-[2px] hover:text-offwhite hover:border-white/20 disabled:opacity-30 transition-colors duration-200"
                      title="Upload sample shots"
                    >
                      +shot
                    </button>
                  </td>
                  <td className="px-3 py-2.5 whitespace-nowrap">
                    <span className={`text-[0.65rem] ${
                      cam.isWorking ? 'text-muted/50' : 'text-red-400/40'
                    }`}>
                      {cam.isWorking ? 'OK' : 'Broken'}
                    </span>
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <button
                      onClick={() => startEdit(cam)}
                      className="px-2 py-0.5 text-[0.68rem] text-lime/60 hover:text-lime transition-colors duration-200 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteCamera(cam.id)}
                      className="px-2 py-0.5 text-[0.68rem] text-red-400/40 hover:text-red-400 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Gallery upload progress */}
        {galleryUploading && galleryProgress && (
          <div className="mt-4 flex items-center gap-3">
            <span className="text-[0.72rem] text-muted">Uploading gallery photos...</span>
            <div className="flex-1 max-w-xs h-1.5 bg-dark border border-white/[0.06] rounded-full overflow-hidden">
              <div
                className="h-full bg-lime/60 rounded-full transition-[width] duration-150"
                style={{ width: `${galleryProgress.total > 0 ? Math.round((galleryProgress.loaded / galleryProgress.total) * 100) : 0}%` }}
              />
            </div>
            <span className="text-[0.65rem] text-muted font-mono">
              {galleryProgress.total > 0 ? Math.round((galleryProgress.loaded / galleryProgress.total) * 100) : 0}%
            </span>
          </div>
        )}

        {/* Photo management for each camera */}
        {manifest?.cameras.filter(c => (c.galleryImages?.length ?? 0) > 0 || (c.sampleImages?.length ?? 0) > 0).map(cam => (
          <div key={cam.id} className="mt-6 px-4 py-3 bg-charcoal border border-white/[0.05] rounded-[3px]">
            <p className="text-[0.75rem] text-offwhite font-medium mb-3">
              {cam.brand} {cam.model}
            </p>
            {(cam.galleryImages?.length ?? 0) > 0 && (
              <>
                <p className="text-[0.65rem] text-muted uppercase tracking-wide mb-1.5">Camera photos ({cam.galleryImages?.length})</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {cam.galleryImages?.map(filename => (
                    <div key={filename} className="group relative w-16 h-16 bg-dark border border-white/[0.06] rounded-[2px] overflow-hidden">
                      <img
                        src={museumImageUrl(cam.id, filename)}
                        alt={filename}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-200"
                        loading="lazy"
                      />
                      <button
                        onClick={() => handleDeletePhoto(cam.id, filename, 'gallery')}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-dark/80 text-red-400/60 hover:text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[0.6rem]"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
            {(cam.sampleImages?.length ?? 0) > 0 && (
              <>
                <p className="text-[0.65rem] text-muted uppercase tracking-wide mb-1.5">Sample shots ({cam.sampleImages?.length})</p>
                <div className="flex flex-wrap gap-2">
                  {cam.sampleImages?.map(filename => (
                    <div key={filename} className="group relative w-16 h-16 bg-dark border border-white/[0.06] rounded-[2px] overflow-hidden">
                      <img
                        src={museumImageUrl(cam.id, filename)}
                        alt={filename}
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-200"
                        loading="lazy"
                      />
                      <button
                        onClick={() => handleDeletePhoto(cam.id, filename, 'sample')}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-dark/80 text-red-400/60 hover:text-red-400 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-[0.6rem]"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}

      </div>
    </div>
  )
}

/* Reusable form field */
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
      />
    </div>
  )
}

/* Reusable toggle */
function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`w-9 h-5 rounded-full border transition-colors duration-200 relative ${
          checked ? 'bg-lime/20 border-lime/40' : 'bg-dark border-white/[0.1]'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-200 ${
          checked ? 'translate-x-4 bg-lime' : 'translate-x-0 bg-muted/40'
        }`} />
      </button>
      <span className="text-[0.72rem] text-muted">{label}</span>
    </label>
  )
}
