'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import {
  fetchRosnik,
  saveManifest,
  uploadFilesWithProgress,
  rosnikAssetUrl,
  type RosnikManifest,
  type MagazineIssue,
} from '@/lib/cdn-api'
import { hasPermission } from '@/lib/auth'

const EMPTY_ISSUE: Omit<MagazineIssue, 'id'> = {
  title: { cs: '', en: '' },
  date: { cs: '', en: '' },
  description: { cs: '', en: '' },
  pdf: '',
  thumbnail: '',
}

export default function RosnikAdmin() {
  const [manifest, setManifest] = useState<RosnikManifest | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{ loaded: number; total: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [editing, setEditing] = useState<MagazineIssue | null>(null)
  const [isNew, setIsNew] = useState(false)
  const [pdfFile, setPdfFile] = useState<File | null>(null)
  const [thumbFile, setThumbFile] = useState<File | null>(null)

  const pdfInputRef = useRef<HTMLInputElement>(null)
  const thumbInputRef = useRef<HTMLInputElement>(null)

  const canUpload = hasPermission('rosnik', 'upload')
  const canDelete = hasPermission('rosnik', 'delete')
  const canEdit = hasPermission('rosnik', 'edit')

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const data = await fetchRosnik()
      setManifest(data)
      setLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
      setLoading(false)
    }
  }

  function flash(msg: string) {
    setSuccess(msg)
    setTimeout(() => setSuccess(null), 3000)
  }

  function startAdd() {
    const nextId = manifest ? Math.max(0, ...manifest.issues.map(i => i.id)) + 1 : 1
    setEditing({ ...EMPTY_ISSUE, id: nextId } as MagazineIssue)
    setIsNew(true)
    setPdfFile(null)
    setThumbFile(null)
  }

  function startEdit(issue: MagazineIssue) {
    setEditing({ ...issue })
    setIsNew(false)
    setPdfFile(null)
    setThumbFile(null)
  }

  async function handleSaveIssue() {
    if (!manifest || !editing) return
    setSaving(true)
    setError(null)

    try {
      // Upload PDF if provided
      if (pdfFile) {
        setUploading(true)
        setUploadProgress(null)
        await uploadFilesWithProgress([pdfFile], 'rosnik', (loaded, total) => {
          setUploadProgress({ loaded, total })
        })
        editing.pdf = pdfFile.name
      }

      // Upload thumbnail if provided
      if (thumbFile) {
        setUploading(true)
        setUploadProgress(null)
        await uploadFilesWithProgress([thumbFile], 'rosnik/thumbs', (loaded, total) => {
          setUploadProgress({ loaded, total })
        })
        editing.thumbnail = `thumbs/${thumbFile.name}`
      }

      setUploading(false)
      setUploadProgress(null)

      let updated: RosnikManifest
      if (isNew) {
        updated = { issues: [...manifest.issues, editing] }
      } else {
        updated = {
          issues: manifest.issues.map(i => i.id === editing.id ? editing : i),
        }
      }

      await saveManifest('rosnik', updated)
      setManifest(updated)
      setEditing(null)
      setIsNew(false)
      flash(isNew ? 'Issue added' : 'Issue updated')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  async function handleDeleteIssue(id: number) {
    if (!manifest) return
    const updated: RosnikManifest = {
      issues: manifest.issues.filter(i => i.id !== id),
    }
    setSaving(true)
    try {
      await saveManifest('rosnik', updated)
      setManifest(updated)
      flash('Issue deleted')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
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
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="flex items-start justify-between mb-10">
          <div>
            <Link
              href="/panel0x"
              className="text-[0.7rem] tracking-[0.14em] uppercase text-muted hover:text-offwhite focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30 transition-colors duration-200"
            >
              &larr; panel0x
            </Link>
            <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Rosnik</h1>
            <p className="text-[0.78rem] text-muted mt-1">{manifest?.issues.length ?? 0} issues</p>
          </div>
          {canEdit && (
            <button
              onClick={startAdd}
              className="px-4 py-1.5 text-[0.75rem] font-medium text-lime border border-lime/30 rounded-[2px] hover:bg-lime/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-lime/50 active:scale-[0.97] transition-colors duration-200"
            >
              + Issue
            </button>
          )}
        </div>

        {/* Status messages */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-[2px] text-[0.78rem] text-red-400">
            {error}
            <button onClick={() => setError(null)} className="ml-3 text-red-400/50 hover:text-red-400">&times;</button>
          </div>
        )}
        {success && (
          <div className="mb-6 px-4 py-3 bg-lime/10 border border-lime/20 rounded-[2px] text-[0.78rem] text-lime">
            {success}
          </div>
        )}

        {/* Issue Form Modal */}
        {editing && (
          <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-12 pb-12 overflow-y-auto bg-dark/80 backdrop-blur-sm">
            <div className="flex flex-col items-end gap-2 w-full max-w-lg my-auto">
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
                {isNew ? 'Add Issue' : `Edit: ${editing.title.cs}`}
              </h3>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Title (CS)</label>
                    <input
                      value={editing.title.cs}
                      onChange={e => setEditing(p => p ? { ...p, title: { ...p.title, cs: e.target.value } } : null)}
                      className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Title (EN)</label>
                    <input
                      value={editing.title.en}
                      onChange={e => setEditing(p => p ? { ...p, title: { ...p.title, en: e.target.value } } : null)}
                      className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Date (CS)</label>
                    <input
                      value={editing.date.cs}
                      onChange={e => setEditing(p => p ? { ...p, date: { ...p.date, cs: e.target.value } } : null)}
                      placeholder="e.g. Březen 2026"
                      className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
                    />
                  </div>
                  <div>
                    <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Date (EN)</label>
                    <input
                      value={editing.date.en}
                      onChange={e => setEditing(p => p ? { ...p, date: { ...p.date, en: e.target.value } } : null)}
                      placeholder="e.g. March 2026"
                      className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Description (CS)</label>
                  <textarea
                    value={editing.description.cs}
                    onChange={e => setEditing(p => p ? { ...p, description: { ...p.description, cs: e.target.value } } : null)}
                    rows={2}
                    className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
                  />
                </div>
                <div>
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Description (EN)</label>
                  <textarea
                    value={editing.description.en}
                    onChange={e => setEditing(p => p ? { ...p, description: { ...p.description, en: e.target.value } } : null)}
                    rows={2}
                    className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
                  />
                </div>

                {/* PDF upload */}
                <div>
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">PDF File</label>
                  <div className="flex items-center gap-3">
                    {!isNew && editing.pdf && (
                      <a
                        href={rosnikAssetUrl(editing.pdf)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[0.72rem] text-lime/50 font-mono hover:text-lime transition-colors duration-200"
                      >
                        {editing.pdf}
                      </a>
                    )}
                    {canUpload && (
                      <>
                        <button
                          onClick={() => pdfInputRef.current?.click()}
                          className="px-3 py-1.5 text-[0.72rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite hover:border-white/20 transition-colors duration-200"
                        >
                          {pdfFile ? pdfFile.name : 'Choose PDF...'}
                        </button>
                        <input
                          ref={pdfInputRef}
                          type="file"
                          accept=".pdf"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) setPdfFile(f)
                          }}
                          className="hidden"
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Thumbnail upload */}
                <div>
                  <label className="block text-[0.68rem] text-muted/50 uppercase tracking-wide mb-1">Thumbnail</label>
                  <div className="flex items-center gap-3">
                    {!isNew && editing.thumbnail && (
                      <div className="w-12 h-16 bg-dark border border-white/[0.06] rounded-[2px] overflow-hidden flex-shrink-0">
                        <img
                          src={rosnikAssetUrl(editing.thumbnail)}
                          alt="Current"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    {canUpload && (
                      <>
                        <button
                          onClick={() => thumbInputRef.current?.click()}
                          className="px-3 py-1.5 text-[0.72rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite hover:border-white/20 transition-colors duration-200"
                        >
                          {thumbFile ? thumbFile.name : 'Choose thumbnail...'}
                        </button>
                        <input
                          ref={thumbInputRef}
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const f = e.target.files?.[0]
                            if (f) setThumbFile(f)
                          }}
                          className="hidden"
                        />
                      </>
                    )}
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
                    {' '}&middot;{' '}
                    {uploadProgress.total > 0 ? ((uploadProgress.total - uploadProgress.loaded) / (1024 * 1024)).toFixed(1) : '0'} MB left
                  </span>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleSaveIssue}
                  disabled={saving || !editing.title.cs}
                  className="px-4 py-1.5 text-[0.75rem] font-medium bg-lime/10 text-lime border border-lime/20 rounded-[2px] hover:bg-lime/20 disabled:opacity-40 transition-colors duration-200"
                >
                  {saving ? (uploading ? 'Uploading...' : 'Saving...') : isNew ? 'Add Issue' : 'Save Changes'}
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

        {/* Issue cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {manifest?.issues.map(issue => (
            <div
              key={issue.id}
              className="flex gap-4 px-4 py-4 bg-charcoal border border-white/[0.05] rounded-[3px] hover:border-white/[0.1] transition-colors duration-200"
            >
              {/* Thumbnail */}
              <div className="w-16 flex-shrink-0 aspect-[3/4] bg-dark border border-white/[0.06] rounded-[2px] overflow-hidden">
                {issue.thumbnail && (
                  <img
                    src={rosnikAssetUrl(issue.thumbnail)}
                    alt={issue.title.en}
                    className="w-full h-full object-cover opacity-80"
                    loading="lazy"
                  />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[0.85rem] font-medium text-offwhite leading-snug">{issue.title.en}</p>
                <p className="text-[0.72rem] text-muted mt-0.5">{issue.date.en}</p>

                <div className="mt-2.5 space-y-1">
                  <div className="flex items-start gap-1.5">
                    <span className="text-[0.65rem] text-muted/40 uppercase tracking-wide mt-px w-7 flex-shrink-0">PDF</span>
                    <span className="text-[0.68rem] text-lime/50 font-mono truncate">{issue.pdf || '—'}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-[0.65rem] text-muted/40 uppercase tracking-wide mt-px w-7 flex-shrink-0">IMG</span>
                    <span className="text-[0.68rem] text-lime/50 font-mono truncate">{issue.thumbnail || '—'}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-3">
                  {canEdit && (
                    <button
                      onClick={() => startEdit(issue)}
                      className="px-3 py-1 text-[0.68rem] font-medium text-lime/60 border border-lime/15 rounded-[2px] hover:bg-lime/10 hover:text-lime transition-colors duration-200"
                    >
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDeleteIssue(issue.id)}
                      className="px-3 py-1 text-[0.68rem] font-medium text-red-400/40 border border-red-500/15 rounded-[2px] hover:bg-red-500/10 hover:text-red-400 transition-colors duration-200"
                    >
                      Delete
                    </button>
                  )}
                  {issue.pdf && (
                    <a
                      href={rosnikAssetUrl(issue.pdf)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-[0.68rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite transition-colors duration-200"
                    >
                      Open PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
