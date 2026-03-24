'use client'

import { useState, useEffect, type ReactNode } from 'react'

const ADMIN_KEY = '__fr_admin_auth'
const ADMIN_PASS_KEY = '__fr_admin_pass'
const DEFAULT_PASS = 'darkroom2026'

function getAdminPass(): string {
  return localStorage.getItem(ADMIN_PASS_KEY) || DEFAULT_PASS
}

export default function AdminAuth({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem(ADMIN_KEY)
    if (stored && stored === getAdminPass()) {
      setAuthed(true)
    }
    setChecking(false)

    // Console activation: window.__adminUnlock('password')
    ;(window as unknown as Record<string, unknown>).__adminUnlock = (pass: string) => {
      if (pass === getAdminPass()) {
        sessionStorage.setItem(ADMIN_KEY, pass)
        setAuthed(true)
        return 'Admin unlocked.'
      }
      return 'Invalid.'
    }
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input === getAdminPass()) {
      sessionStorage.setItem(ADMIN_KEY, input)
      setAuthed(true)
      setError(false)
    } else {
      setError(true)
    }
  }

  if (checking) return null

  if (!authed) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-dark">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4">
          <input
            type="password"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(false) }}
            placeholder="..."
            autoFocus
            className={`w-48 px-4 py-2 bg-charcoal border ${error ? 'border-red-500/50' : 'border-white/[0.08]'} rounded-[2px] text-offwhite text-[0.85rem] font-body placeholder:text-muted/30 focus:outline-none focus:border-lime/40`}
          />
          <button
            type="submit"
            className="px-5 py-2 text-[0.8rem] font-medium bg-lime/10 text-lime/60 border border-lime/20 rounded-[2px] hover:bg-lime/20 hover:text-lime transition-colors duration-300"
          >
            OK
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
