'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  fetchSite,
  saveManifest,
  type SiteManifest,
  type ContactNotice,
} from '@/lib/cdn-api'
import { useToast } from '@/components/admin/Toast'

const DEFAULT_NOTICE: ContactNotice = {
  enabled: false,
  text: { cs: '', en: '' },
  color: '#3bc442',
  fontSize: 15,
  bold: false,
}

export default function ContactNoticeAdmin() {
  const [manifest, setManifest] = useState<SiteManifest>({})
  const [notice, setNotice] = useState<ContactNotice>(DEFAULT_NOTICE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchSite()
      .then(data => {
        setManifest(data)
        if (data.contactNotice) {
          setNotice({
            enabled: data.contactNotice.enabled ?? false,
            text: {
              cs: data.contactNotice.text?.cs ?? '',
              en: data.contactNotice.text?.en ?? '',
            },
            color: data.contactNotice.color ?? '#3bc442',
            fontSize: data.contactNotice.fontSize ?? 15,
            bold: data.contactNotice.bold ?? false,
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    try {
      const updated: SiteManifest = { ...manifest, contactNotice: notice }
      await saveManifest('site', updated)
      setManifest(updated)
      setSaved(true)
      toast('Contact notice saved')
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

  const previewText = notice.text.cs || notice.text.en || '[Preview text]'

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
          <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Contact Notice</h1>
          <p className="text-[0.78rem] text-muted mt-1">Full-width banner at the top of the Contact section</p>
        </div>

        {/* Live preview */}
        <p className="text-[0.65rem] tracking-[0.14em] uppercase text-muted/50 mb-3">Preview</p>
        <div className="bg-charcoal border border-white/[0.05] rounded-[3px] p-5 mb-8">
          <div
            className="w-full rounded-[2px] px-5 py-3 text-center"
            style={{
              backgroundColor: `color-mix(in srgb, ${notice.color} 12%, transparent)`,
              border: `1px solid color-mix(in srgb, ${notice.color} 30%, transparent)`,
              color: notice.color,
              fontSize: `${notice.fontSize}px`,
              fontWeight: notice.bold ? 700 : 400,
              lineHeight: 1.5,
              opacity: notice.enabled ? 1 : 0.4,
            }}
          >
            {previewText}
          </div>
          {!notice.enabled && (
            <p className="text-[0.7rem] text-muted/40 mt-3 text-center">
              Banner is currently disabled — it will not appear on the site.
            </p>
          )}
        </div>

        {/* Editor */}
        <p className="text-[0.65rem] tracking-[0.14em] uppercase text-muted/50 mb-3">Settings</p>
        <div className="flex flex-col gap-4 bg-charcoal border border-white/[0.05] rounded-[3px] p-5 mb-6">

          {/* Enabled toggle */}
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notice.enabled}
              onChange={e => setNotice(n => ({ ...n, enabled: e.target.checked }))}
              className="w-4 h-4 accent-lime cursor-pointer"
            />
            <span className="text-[0.85rem] text-offwhite">Show notice on the website</span>
          </label>

          {/* Text CS */}
          <div>
            <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Text — CS</label>
            <textarea
              rows={2}
              value={notice.text.cs}
              onChange={e => setNotice(n => ({ ...n, text: { ...n.text, cs: e.target.value } }))}
              placeholder="Např. Dovolená 1.–10. července, e-maily budu vyřizovat po návratu."
              className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
            />
          </div>

          {/* Text EN */}
          <div>
            <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Text — EN</label>
            <textarea
              rows={2}
              value={notice.text.en}
              onChange={e => setNotice(n => ({ ...n, text: { ...n.text, en: e.target.value } }))}
              placeholder="E.g. On vacation Jul 1–10, I'll get back to you after."
              className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite placeholder:text-muted/30 focus:outline-none focus:border-lime/40 resize-y"
            />
          </div>

          {/* Color + Font size + Bold */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={notice.color}
                  onChange={e => setNotice(n => ({ ...n, color: e.target.value }))}
                  className="w-10 h-9 bg-dark border border-white/[0.08] rounded-[2px] cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={notice.color}
                  onChange={e => setNotice(n => ({ ...n, color: e.target.value }))}
                  className="flex-1 px-2 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.78rem] text-offwhite font-mono focus:outline-none focus:border-lime/40"
                />
              </div>
            </div>

            <div>
              <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Font size (px)</label>
              <input
                type="number"
                min={10}
                max={48}
                value={notice.fontSize}
                onChange={e => setNotice(n => ({ ...n, fontSize: Math.max(10, Math.min(48, parseInt(e.target.value, 10) || 15)) }))}
                className="w-full px-3 py-2 bg-dark border border-white/[0.08] rounded-[2px] text-[0.8rem] text-offwhite focus:outline-none focus:border-lime/40"
              />
            </div>

            <div>
              <label className="block text-[0.65rem] text-muted/50 uppercase tracking-wide mb-1.5">Weight</label>
              <label className="flex items-center gap-2 h-9 px-3 bg-dark border border-white/[0.08] rounded-[2px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={notice.bold}
                  onChange={e => setNotice(n => ({ ...n, bold: e.target.checked }))}
                  className="w-4 h-4 accent-lime cursor-pointer"
                />
                <span className="text-[0.8rem] text-offwhite font-bold">Bold</span>
              </label>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="px-4 py-1.5 text-[0.75rem] font-medium bg-lime/10 text-lime border border-lime/20 rounded-[2px] hover:bg-lime/20 disabled:opacity-40 transition-colors duration-200"
            >
              {saved ? 'Saved!' : saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <p className="text-[0.68rem] text-muted/40 leading-relaxed">
          The banner appears as a full-width rectangle at the very top of the Contact section, with text centered. Stored in <span className="font-mono text-lime/40">site.json &rarr; contactNotice</span>.
        </p>
      </div>
    </div>
  )
}
