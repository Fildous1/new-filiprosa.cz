'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import {
  fetchFaq,
  saveManifest,
  type FaqManifest,
  type FaqItem,
} from '@/lib/cdn-api'
import { useToast } from '@/components/admin/Toast'

function emptyItem(id: string): FaqItem {
  return {
    id,
    question: { cs: '', en: '' },
    answer: { cs: '', en: '' },
  }
}

function genId(): string {
  return `q${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}

export default function FaqAdmin() {
  const [manifest, setManifest] = useState<FaqManifest>({ items: [] })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchFaq()
      .then(data => { setManifest({ items: data.items ?? [] }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  function updateItem(id: string, field: 'question' | 'answer', lang: 'cs' | 'en', value: string) {
    setManifest(m => ({
      items: m.items.map(it =>
        it.id === id ? { ...it, [field]: { ...it[field], [lang]: value } } : it
      ),
    }))
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

  async function handleSave() {
    setSaving(true)
    try {
      await saveManifest('faq', manifest)
      setSaved(true)
      toast('FAQ saved')
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
          <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">FAQ</h1>
          <p className="text-[0.78rem] text-muted mt-1">Edit questions and answers shown in the FAQ section on the homepage</p>
        </div>

        <div className="flex flex-col gap-3 mb-6">
          {manifest.items.length === 0 ? (
            <div className="px-5 py-8 bg-charcoal border border-white/[0.05] rounded-[3px] text-center">
              <p className="text-[0.8rem] text-muted">No FAQ entries yet.</p>
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

                <div className="grid grid-cols-2 gap-3 mb-3">
                  <Field label="Question" lang="cs" value={item.question.cs} onChange={v => updateItem(item.id, 'question', 'cs', v)} />
                  <Field label="Question" lang="en" value={item.question.en} onChange={v => updateItem(item.id, 'question', 'en', v)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <FieldArea label="Answer" lang="cs" value={item.answer.cs} onChange={v => updateItem(item.id, 'answer', 'cs', v)} />
                  <FieldArea label="Answer" lang="en" value={item.answer.en} onChange={v => updateItem(item.id, 'answer', 'en', v)} />
                </div>
              </div>
            ))
          )}

          <button
            onClick={addItem}
            className="self-start px-3 py-1.5 text-[0.72rem] font-medium text-lime border border-lime/20 rounded-[2px] hover:bg-lime/10 transition-colors duration-200"
          >
            + Add question
          </button>
        </div>

        <div className="sticky bottom-4 flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || saved}
            className="px-5 py-2 text-[0.78rem] font-medium bg-lime/10 text-lime border border-lime/30 rounded-[2px] hover:bg-lime/20 disabled:opacity-40 transition-colors duration-200 backdrop-blur-sm"
          >
            {saved ? 'Saved!' : saving ? 'Saving...' : 'Save FAQ'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, lang, value, onChange }: { label: string; lang: 'cs' | 'en'; value: string; onChange: (v: string) => void }) {
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

function FieldArea({ label, lang, value, onChange }: { label: string; lang: 'cs' | 'en'; value: string; onChange: (v: string) => void }) {
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
