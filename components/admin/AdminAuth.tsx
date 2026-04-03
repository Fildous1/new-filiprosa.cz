'use client'

import { useState, useEffect, type ReactNode } from 'react'
import {
  getSession,
  setSession,
  loadUsers,
  saveUsersToCdn,
  verifyPassword,
  createDefaultAdmin,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
} from '@/lib/auth'

const CDN_TOKEN_KEY = '__fr_admin_pass'
const DEFAULT_PASS = 'darkroom2026'

function getCdnToken(): string {
  return localStorage.getItem(CDN_TOKEN_KEY) || DEFAULT_PASS
}

export default function AdminAuth({ children }: { children: ReactNode }) {
  const [authed, setAuthed] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [checking, setChecking] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [lockSeconds, setLockSeconds] = useState(0)

  // Check existing session on mount
  useEffect(() => {
    const session = getSession()
    if (session) {
      setAuthed(true)
    }
    setChecking(false)
  }, [])

  // Countdown timer for rate limiting
  useEffect(() => {
    if (lockSeconds <= 0) return
    const timer = setInterval(() => {
      setLockSeconds(s => {
        if (s <= 1) { clearInterval(timer); return 0 }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [lockSeconds])

  // Check rate limit on mount
  useEffect(() => {
    const remaining = checkRateLimit()
    if (remaining > 0) setLockSeconds(remaining)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (submitting || lockSeconds > 0) return

    const remaining = checkRateLimit()
    if (remaining > 0) {
      setLockSeconds(remaining)
      setError(`Too many attempts. Try again in ${remaining}s.`)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Fetch users from CDN
      const manifest = await loadUsers()

      // Migration: if no users exist, create admin from existing password
      if (manifest.users.length === 0) {
        const cdnToken = getCdnToken()
        if (password !== cdnToken) {
          const lockDuration = recordFailedAttempt()
          if (lockDuration > 0) {
            setLockSeconds(lockDuration)
            setError(`Too many attempts. Try again in ${lockDuration}s.`)
          } else {
            setError('Invalid credentials')
          }
          setSubmitting(false)
          return
        }

        // Create admin user and save to CDN
        const adminUser = await createDefaultAdmin(password)
        adminUser.username = username.trim() || 'admin'

        localStorage.setItem(CDN_TOKEN_KEY, password)
        sessionStorage.setItem('__fr_admin_auth', password)

        // Save the new users manifest to CDN
        await saveUsersToCdn({ users: [adminUser] })

        setSession(adminUser, password)
        resetRateLimit()
        setAuthed(true)
        setSubmitting(false)
        return
      }

      // Normal login: find user and verify password
      const user = manifest.users.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase()
      )

      if (!user) {
        const lockDuration = recordFailedAttempt()
        if (lockDuration > 0) {
          setLockSeconds(lockDuration)
          setError(`Too many attempts. Try again in ${lockDuration}s.`)
        } else {
          setError('Invalid credentials')
        }
        setSubmitting(false)
        return
      }

      const valid = await verifyPassword(password, user)
      if (!valid) {
        const lockDuration = recordFailedAttempt()
        if (lockDuration > 0) {
          setLockSeconds(lockDuration)
          setError(`Too many attempts. Try again in ${lockDuration}s.`)
        } else {
          setError('Invalid credentials')
        }
        setSubmitting(false)
        return
      }

      // Success
      const cdnToken = getCdnToken()
      setSession(user, cdnToken)
      resetRateLimit()
      setAuthed(true)
    } catch {
      setError('Login failed. Check your connection.')
    }

    setSubmitting(false)
  }

  if (checking) return null

  if (!authed) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-dark">
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 w-full max-w-[220px]">
          <input
            type="text"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setError('') }}
            placeholder="username"
            autoFocus
            autoComplete="username"
            className={`w-full px-4 py-2 bg-charcoal border ${error ? 'border-red-500/50' : 'border-white/[0.08]'} rounded-[2px] text-offwhite text-[0.85rem] font-body placeholder:text-muted/30 focus:outline-none focus:border-lime/40`}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            placeholder="password"
            autoComplete="current-password"
            className={`w-full px-4 py-2 bg-charcoal border ${error ? 'border-red-500/50' : 'border-white/[0.08]'} rounded-[2px] text-offwhite text-[0.85rem] font-body placeholder:text-muted/30 focus:outline-none focus:border-lime/40`}
          />
          {error && (
            <p className="text-[0.72rem] text-red-400/80 text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={submitting || lockSeconds > 0}
            className="w-full px-5 py-2 text-[0.8rem] font-medium bg-lime/10 text-lime/60 border border-lime/20 rounded-[2px] hover:bg-lime/20 hover:text-lime disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-300"
          >
            {submitting ? '...' : lockSeconds > 0 ? `Wait ${lockSeconds}s` : 'OK'}
          </button>
        </form>
      </div>
    )
  }

  return <>{children}</>
}
