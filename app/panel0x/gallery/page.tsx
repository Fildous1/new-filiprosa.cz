'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  fetchGallery,
  saveManifest,
  uploadFilesWithProgress,
  uploadGalleryImagesWithResize,
  deleteFile,
  galleryImageUrl,
  type GalleryManifest,
  type GalleryAlbum,
  type GalleryImage,
} from '@/lib/cdn-api'
import { useToast } from '@/components/admin/Toast'

type EditingImage = GalleryImage & { _albumSlug: string; _index: number }


export default function GalleryAdmin() {
  const [manifest, setManifest] = useState<GalleryManifest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ loaded: number; total: number } | null>(null)
  const { toast } = useToast()
  const [activeSlug, setActiveSlug] = useState('')

  // Add album form
  const [showAddAlbum, setShowAddAlbum] = useState(false)
  const [newAlbum, setNewAlbum] = useState({ slug: '', titleCs: '', titleEn: '', descCs: '', descEn: '' })

  // Edit album
  const [editingAlbum, setEditingAlbum] = useState<{ slug: string; titleCs: string; titleEn: string; descCs: string; descEn: string } | null>(null)

  // Edit image
  const [editingImage, setEditingImage] = useState<EditingImage | null>(null)

  // Selection
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const [cacheKey, setCacheKey] = useState(() => Date.now())
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const data = await fetchGallery()
      setManifest(data)
      setCacheKey(data.updatedAt ?? Date.now())
      if (!activeSlug && data.albums.length > 0) {
        setActiveSlug(data.albums[0].slug)
      }
      setLoading(false)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load', 'error')
      setLoading(false)
    }
  }

  const activeAlbum = manifest?.albums.find(a => a.slug === activeSlug)
  const totalImages = manifest?.albums.reduce((n, a) => n + a.images.length, 0) ?? 0

  async function handleSave(updated: GalleryManifest) {
    setSaving(true)
    try {
      await saveManifest('gallery', updated)
      setManifest(updated)
      setCacheKey(Date.now())
      toast('Saved')
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleAddAlbum() {
    if (!manifest || !newAlbum.slug || !newAlbum.titleCs) return
    const album: GalleryAlbum = {
      slug: newAlbum.slug.toLowerCase().replace(/[^a-z0-9-]/g, ''),
      title: { cs: newAlbum.titleCs, en: newAlbum.titleEn || newAlbum.titleCs },
      description: { cs: newAlbum.descCs, en: newAlbum.descEn || newAlbum.descCs },
      images: [],
    }
    const updated = { albums: [...manifest.albums, album] }
    await handleSave(updated)
    setActiveSlug(album.slug)
    setShowAddAlbum(false)
    setNewAlbum({ slug: '', titleCs: '', titleEn: '', descCs: '', descEn: '' })
  }

  function startEditAlbum(album: GalleryAlbum) {
    setEditingAlbum({
      slug: album.slug,
      titleCs: album.title.cs,
      titleEn: album.title.en,
      descCs: album.description.cs,
      descEn: album.description.en,
    })
  }

  async function handleSaveAlbumEdit() {
    if (!manifest || !editingAlbum) return
    const updated: GalleryManifest = {
      albums: manifest.albums.map(a =>
        a.slug === editingAlbum.slug
          ? {
              ...a,
              title: { cs: editingAlbum.titleCs, en: editingAlbum.titleEn },
              description: { cs: editingAlbum.descCs, en: editingAlbum.descEn },
            }
          : a
      ),
    }
    await handleSave(updated)
    setEditingAlbum(null)
  }

  async function handleUploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.length || !manifest || !activeSlug) return
    const files = Array.from(e.target.files)
    setUploading(true)
    setUploadProgress(null)

    try {
      const album = manifest.albums.find(a => a.slug === activeSlug)
      const existingCount = album?.images.length ?? 0

      // Resize images (1920px full + 720px thumb) and upload both versions
      const { filenames } = await uploadGalleryImagesWithResize(
        files,
        activeSlug,
        existingCount,
        (loaded, total) => setUploadProgress({ loaded, total }),
      )

      const newImages: GalleryImage[] = filenames.map(f => ({
        filename: f,
        caption: { cs: '', en: '' },
        analog: false,
      }))

      const updated: GalleryManifest = {
        albums: manifest.albums.map(a => {
          if (a.slug !== activeSlug) return a
          // Deduplicate by filename — prevent duplicates if upload is retried
          const merged = [...a.images, ...newImages]
          const seen = new Set<string>()
          const deduped = merged.filter(img => {
            if (seen.has(img.filename)) return false
            seen.add(img.filename)
            return true
          })
          return { ...a, images: deduped }
        }),
      }
      await saveManifest('gallery', updated)
      setManifest(updated)
      setCacheKey(Date.now())
      toast(`${files.length} photo(s) uploaded & resized`)
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
      setUploadProgress(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleDeleteImage(albumSlug: string, index: number) {
    if (!manifest) return
    const album = manifest.albums.find(a => a.slug === albumSlug)
    if (!album) return
    const img = album.images[index]

    try {
      await deleteFile(`gallery/${albumSlug}/${img.filename}`)
    } catch {
      // File might not exist on CDN, continue with manifest update
    }

    const updated: GalleryManifest = {
      albums: manifest.albums.map(a =>
        a.slug === albumSlug
          ? { ...a, images: a.images.filter((_, i) => i !== index) }
          : a
      ),
    }
    await handleSave(updated)
  }

  async function handleSaveImageEdit() {
    if (!manifest || !editingImage) return
    const updated: GalleryManifest = {
      albums: manifest.albums.map(a =>
        a.slug === editingImage._albumSlug
          ? {
              ...a,
              images: a.images.map((img, i) =>
                i === editingImage._index
                  ? { filename: editingImage.filename, caption: editingImage.caption, featured: editingImage.featured, analog: editingImage.analog }
                  : img
              ),
            }
          : a
      ),
    }
    await handleSave(updated)
    setEditingImage(null)
  }

  async function handleDeleteAlbum(slug: string) {
    if (!manifest) return
    const updated: GalleryManifest = {
      albums: manifest.albums.filter(a => a.slug !== slug),
    }
    await handleSave(updated)
    if (activeSlug === slug) {
      setActiveSlug(updated.albums[0]?.slug ?? '')
    }
  }

  function toggleSelect(index: number) {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  function selectAll() {
    if (!activeAlbum) return
    if (selected.size === activeAlbum.images.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(activeAlbum.images.map((_, i) => i)))
    }
  }

  async function handleDeleteSelected() {
    if (!manifest || !activeAlbum || selected.size === 0) return
    const indices = Array.from(selected).sort((a, b) => b - a)

    // Delete files from CDN
    for (const idx of indices) {
      const img = activeAlbum.images[idx]
      try {
        await deleteFile(`gallery/${activeSlug}/${img.filename}`)
      } catch { /* continue */ }
    }

    const keepImages = activeAlbum.images.filter((_, i) => !selected.has(i))
    const updated: GalleryManifest = {
      albums: manifest.albums.map(a =>
        a.slug === activeSlug ? { ...a, images: keepImages } : a
      ),
    }
    await handleSave(updated)
    setSelected(new Set())
  }

  async function handleDownloadSelected() {
    if (!activeAlbum || selected.size === 0) return
    const indices = Array.from(selected).sort((a, b) => a - b)
    for (const idx of indices) {
      const img = activeAlbum.images[idx]
      const url = galleryImageUrl(activeSlug, img.filename)
      const a = document.createElement('a')
      a.href = url
      a.download = img.filename
      a.target = '_blank'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      // Small delay between downloads to avoid browser blocking
      await new Promise(r => setTimeout(r, 200))
    }
  }

  async function handleToggleAnalogSelected() {
    if (!manifest || !activeAlbum || selected.size === 0) return
    // If all selected are already analog, turn off; otherwise turn on
    const allAnalog = Array.from(selected).every(i => activeAlbum.images[i].analog)
    const newValue = !allAnalog
    const updated: GalleryManifest = {
      albums: manifest.albums.map(a =>
        a.slug === activeSlug
          ? { ...a, images: a.images.map((img, i) => selected.has(i) ? { ...img, analog: newValue } : img) }
          : a
      ),
    }
    await handleSave(updated)
  }

  async function handleToggleFeaturedSelected() {
    if (!manifest || !activeAlbum || selected.size === 0) return
    // If all selected are already featured, turn off; otherwise turn on
    const allFeatured = Array.from(selected).every(i => activeAlbum.images[i].featured)
    const newValue = !allFeatured
    const updated: GalleryManifest = {
      albums: manifest.albums.map(a =>
        a.slug === activeSlug
          ? { ...a, images: a.images.map((img, i) => selected.has(i) ? { ...img, featured: newValue } : img) }
          : a
      ),
    }
    await handleSave(updated)
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
            <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Gallery</h1>
            <p className="text-[0.78rem] text-muted mt-1">
              {manifest?.albums.length ?? 0} albums &middot; {totalImages} total images
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAddAlbum(true)}
              className="px-4 py-1.5 text-[0.75rem] font-medium text-lime border border-lime/30 rounded-[2px] hover:bg-lime/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime/50 active:scale-[0.97] transition-colors duration-200"
            >
              + Album
            </button>
          </div>
        </div>

        {/* Add Album Form */}
        {showAddAlbum && (
          <div className="mb-8 px-5 py-5 bg-charcoal border border-white/[0.08] rounded-[3px]">
            <h3 className="text-[0.85rem] font-medium text-offwhite mb-4">New Album</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                placeholder="Slug (e.g. portrety)"
                value={newAlbum.slug}
                onChange={e => setNewAlbum(p => ({ ...p, slug: e.target.value }))}
                className="px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
              />
              <div />
              <input
                placeholder="Title (CS)"
                value={newAlbum.titleCs}
                onChange={e => setNewAlbum(p => ({ ...p, titleCs: e.target.value }))}
                className="px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
              />
              <input
                placeholder="Title (EN)"
                value={newAlbum.titleEn}
                onChange={e => setNewAlbum(p => ({ ...p, titleEn: e.target.value }))}
                className="px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
              />
              <input
                placeholder="Description (CS)"
                value={newAlbum.descCs}
                onChange={e => setNewAlbum(p => ({ ...p, descCs: e.target.value }))}
                className="px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
              />
              <input
                placeholder="Description (EN)"
                value={newAlbum.descEn}
                onChange={e => setNewAlbum(p => ({ ...p, descEn: e.target.value }))}
                className="px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
              />
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddAlbum}
                disabled={saving || !newAlbum.slug || !newAlbum.titleCs}
                className="px-4 py-1.5 text-[0.75rem] font-medium bg-lime/10 text-lime border border-lime/20 rounded-[2px] hover:bg-lime/20 disabled:opacity-40 transition-colors duration-200"
              >
                {saving ? 'Saving...' : 'Create Album'}
              </button>
              <button
                onClick={() => setShowAddAlbum(false)}
                className="px-4 py-1.5 text-[0.75rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Album tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {manifest?.albums.map(album => (
            <button
              key={album.slug}
              onClick={() => { setActiveSlug(album.slug); setSelected(new Set()) }}
              className={`px-4 py-1.5 text-[0.78rem] rounded-[2px] border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 active:scale-[0.97] ${
                activeSlug === album.slug
                  ? 'bg-lime/10 text-lime border-lime/30'
                  : 'bg-charcoal text-muted border-white/[0.07] hover:border-white/20 hover:text-offwhite'
              }`}
            >
              {album.title.en}
              <span className="ml-1.5 text-[0.68rem] opacity-50">({album.images.length})</span>
            </button>
          ))}
        </div>

        {/* Active album info */}
        {activeAlbum && (
          <div className="mb-6 px-5 py-3.5 bg-charcoal border border-white/[0.05] rounded-[3px] flex items-center justify-between">
            <div>
              <p className="text-[0.78rem] text-offwhite font-medium">{activeAlbum.title.en} <span className="text-muted font-normal">/ {activeAlbum.title.cs}</span></p>
              <p className="text-[0.72rem] text-muted mt-0.5">{activeAlbum.description.en}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => startEditAlbum(activeAlbum)}
                className="px-3 py-1.5 text-[0.72rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite hover:border-white/20 transition-colors duration-200"
              >
                Edit Album
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="px-3 py-1.5 text-[0.72rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 disabled:opacity-40 transition-colors duration-200"
              >
                {uploading ? 'Uploading...' : 'Upload Photos'}
              </button>
              {uploading && uploadProgress && (
                <UploadProgressBar loaded={uploadProgress.loaded} total={uploadProgress.total} />
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleUploadPhotos}
                className="hidden"
              />
              {activeAlbum.images.length === 0 && (
                <button
                  onClick={() => handleDeleteAlbum(activeAlbum.slug)}
                  className="px-3 py-1.5 text-[0.72rem] font-medium text-red-400/60 border border-red-500/20 rounded-[2px] hover:bg-red-500/10 transition-colors duration-200"
                >
                  Delete Album
                </button>
              )}
            </div>
          </div>
        )}

        {/* Selection toolbar */}
        {activeAlbum && activeAlbum.images.length > 0 && (
          <div className="mb-3 flex items-center gap-3">
            <button
              onClick={selectAll}
              className="px-3 py-1 text-[0.72rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite hover:border-white/20 transition-colors duration-200"
            >
              {selected.size === activeAlbum.images.length ? 'Deselect All' : 'Select All'}
            </button>
            {selected.size > 0 && (
              <>
                <span className="text-[0.72rem] text-muted">{selected.size} selected</span>
                <button
                  onClick={handleDeleteSelected}
                  disabled={saving}
                  className="px-3 py-1 text-[0.72rem] font-medium text-red-400/80 border border-red-500/20 rounded-[2px] hover:bg-red-500/10 disabled:opacity-40 transition-colors duration-200"
                >
                  Delete Selected
                </button>
                <button
                  onClick={handleToggleAnalogSelected}
                  disabled={saving}
                  className="px-3 py-1 text-[0.72rem] font-medium text-offwhite/60 border border-white/[0.07] rounded-[2px] hover:text-lime hover:border-lime/20 disabled:opacity-40 transition-colors duration-200"
                >
                  {activeAlbum && Array.from(selected).every(i => activeAlbum.images[i]?.analog) ? 'Unmark Analog' : 'Mark Analog'}
                </button>
                <button
                  onClick={handleToggleFeaturedSelected}
                  disabled={saving}
                  className="px-3 py-1 text-[0.72rem] font-medium text-offwhite/60 border border-white/[0.07] rounded-[2px] hover:text-lime hover:border-lime/20 disabled:opacity-40 transition-colors duration-200"
                >
                  {activeAlbum && Array.from(selected).every(i => activeAlbum.images[i]?.featured) ? 'Unmark Featured' : 'Mark Featured'}
                </button>
                <button
                  onClick={handleDownloadSelected}
                  className="px-3 py-1 text-[0.72rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 transition-colors duration-200"
                >
                  Download Selected
                </button>
              </>
            )}
          </div>
        )}

        {/* Image grid */}
        {activeAlbum && activeAlbum.images.length > 0 ? (
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
            {activeAlbum.images.map((img, i) => {
              const isSelected = selected.has(i)
              return (
                <div
                  key={img.filename}
                  className={`group relative aspect-square bg-charcoal border rounded-[2px] overflow-hidden cursor-pointer ${
                    isSelected ? 'border-lime/50 ring-1 ring-lime/30' : 'border-white/[0.05]'
                  }`}
                  onClick={() => toggleSelect(i)}
                >
                  <img
                    src={galleryImageUrl(activeAlbum.slug, img.filename, cacheKey)}
                    alt={img.filename}
                    className={`w-full h-full object-cover transition-opacity duration-200 ${
                      isSelected ? 'opacity-90' : 'opacity-70 group-hover:opacity-100'
                    }`}
                    loading="lazy"
                  />
                  {/* Top bar: checkbox + edit + delete */}
                  <div className={`absolute top-0 left-0 right-0 flex items-center gap-0.5 p-1 transition-opacity duration-200 ${
                    isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <div className={`w-4 h-4 rounded-[2px] border flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? 'bg-lime border-lime'
                        : 'border-white/30 bg-dark/50'
                    }`}>
                      {isSelected && (
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-dark">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                        </svg>
                      )}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditingImage({ ...img, _albumSlug: activeAlbum.slug, _index: i }) }}
                      className="px-1.5 py-0.5 text-[0.5rem] font-medium text-lime bg-dark/80 rounded-[2px] hover:bg-dark"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeleteImage(activeAlbum.slug, i) }}
                      className="px-1.5 py-0.5 text-[0.5rem] font-medium text-red-400 bg-dark/80 rounded-[2px] hover:bg-dark"
                    >
                      Del
                    </button>
                    {img.featured && (
                      <div className="w-3.5 h-3.5 bg-lime/80 rounded-full flex items-center justify-center ml-auto" title="Featured">
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor" className="text-dark">
                          <path d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                        </svg>
                      </div>
                    )}
                    {img.analog && (
                      <span className="px-1 py-0.5 text-[0.5rem] font-semibold bg-lime/10 text-lime/70 rounded-[2px]" title="Analog">A</span>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                    <p className="w-full px-1 py-0.5 text-[0.55rem] text-white/80 bg-black/70 font-mono truncate">{img.filename}</p>
                  </div>
                </div>
              )
            })}
          </div>
        ) : activeAlbum ? (
          <div className="px-5 py-8 bg-charcoal border border-white/[0.05] rounded-[3px] text-center">
            <p className="text-[0.8rem] text-muted">No images in this album.</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 px-4 py-1.5 text-[0.75rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 transition-colors duration-200"
            >
              Upload Photos
            </button>
          </div>
        ) : null}

        {/* Edit image modal */}
        {editingImage && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark/80 backdrop-blur-sm" onClick={() => setEditingImage(null)}>
            <div className="bg-charcoal border border-white/[0.08] rounded-[3px] p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-[0.9rem] font-medium text-offwhite mb-4">Edit Photo</h3>
              <p className="text-[0.72rem] text-muted/60 font-mono mb-4">{editingImage.filename}</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Caption (CS)</label>
                  <input
                    value={editingImage.caption.cs}
                    onChange={e => setEditingImage(p => p ? { ...p, caption: { ...p.caption, cs: e.target.value } } : null)}
                    className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Caption (EN)</label>
                  <input
                    value={editingImage.caption.en}
                    onChange={e => setEditingImage(p => p ? { ...p, caption: { ...p.caption, en: e.target.value } } : null)}
                    className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
                  />
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingImage(p => p ? { ...p, featured: !p.featured } : null)}
                    className={`w-9 h-5 rounded-full border transition-colors duration-200 relative ${
                      editingImage.featured ? 'bg-lime/20 border-lime/40' : 'bg-dark border-white/[0.1]'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-200 ${
                      editingImage.featured ? 'translate-x-4 bg-lime' : 'translate-x-0 bg-muted/40'
                    }`} />
                  </button>
                  <span className="text-[0.75rem] text-muted">Show on homepage</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer select-none pt-1">
                  <button
                    type="button"
                    onClick={() => setEditingImage(p => p ? { ...p, analog: p.analog === false ? true : false } : null)}
                    className={`w-9 h-5 rounded-full border transition-colors duration-200 relative ${
                      editingImage.analog !== false ? 'bg-lime/20 border-lime/40' : 'bg-dark border-white/[0.1]'
                    }`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 rounded-full transition-transform duration-200 ${
                      editingImage.analog !== false ? 'translate-x-4 bg-lime' : 'translate-x-0 bg-muted/40'
                    }`} />
                  </button>
                  <span className="text-[0.75rem] text-muted">Analog</span>
                </label>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleSaveImageEdit}
                  disabled={saving}
                  className="px-4 py-1.5 text-[0.75rem] font-medium bg-lime/10 text-lime border border-lime/20 rounded-[2px] hover:bg-lime/20 disabled:opacity-40 transition-colors duration-200"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingImage(null)}
                  className="px-4 py-1.5 text-[0.75rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Edit album modal */}
        {editingAlbum && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-dark/80 backdrop-blur-sm" onClick={() => setEditingAlbum(null)}>
            <div className="bg-charcoal border border-white/[0.08] rounded-[3px] p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
              <h3 className="text-[0.9rem] font-medium text-offwhite mb-4">Edit Album</h3>
              <p className="text-[0.72rem] text-muted/60 font-mono mb-4">{editingAlbum.slug}</p>

              <div className="space-y-3">
                <div>
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Title (CS)</label>
                  <input
                    value={editingAlbum.titleCs}
                    onChange={e => setEditingAlbum(p => p ? { ...p, titleCs: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Title (EN)</label>
                  <input
                    value={editingAlbum.titleEn}
                    onChange={e => setEditingAlbum(p => p ? { ...p, titleEn: e.target.value } : null)}
                    className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Description (CS)</label>
                  <textarea
                    value={editingAlbum.descCs}
                    onChange={e => setEditingAlbum(p => p ? { ...p, descCs: e.target.value } : null)}
                    rows={2}
                    className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Description (EN)</label>
                  <textarea
                    value={editingAlbum.descEn}
                    onChange={e => setEditingAlbum(p => p ? { ...p, descEn: e.target.value } : null)}
                    rows={2}
                    className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-5">
                <button
                  onClick={handleSaveAlbumEdit}
                  disabled={saving}
                  className="px-4 py-1.5 text-[0.75rem] font-medium bg-lime/10 text-lime border border-lime/20 rounded-[2px] hover:bg-lime/20 disabled:opacity-40 transition-colors duration-200"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setEditingAlbum(null)}
                  className="px-4 py-1.5 text-[0.75rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

function UploadProgressBar({ loaded, total }: { loaded: number; total: number }) {
  const pct = total > 0 ? Math.round((loaded / total) * 100) : 0

  function toMB(bytes: number): string {
    return (bytes / (1024 * 1024)).toFixed(1)
  }

  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <div className="flex-1 h-1.5 bg-dark border border-white/[0.06] rounded-full overflow-hidden">
        <div
          className="h-full bg-lime/60 rounded-full transition-[width] duration-150"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[0.65rem] text-muted font-mono whitespace-nowrap w-[10rem] text-right tabular-nums">
        {String(pct).padStart(3, '\u2007')}&thinsp;% &middot; {toMB(loaded)}&thinsp;/&thinsp;{toMB(total)}&thinsp;MB
      </span>
    </div>
  )
}
