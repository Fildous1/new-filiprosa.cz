'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

const CDN_TOKEN_KEY = '__fr_admin_pass'

export default function DebugAdmin() {
  const [cdnResult, setCdnResult] = useState<string | null>(null)
  const [cdnLoading, setCdnLoading] = useState(false)
  const [storageInfo, setStorageInfo] = useState<{ key: string; value: string; store: string }[]>([])

  useEffect(() => {
    refreshStorageInfo()
  }, [])

  function refreshStorageInfo() {
    const items: { key: string; value: string; store: string }[] = []
    const sessionKeys = ['__fr_admin_user', '__fr_admin_auth', '__fr_admin_role', '__fr_admin_perms', '__fr_login_attempts']
    const localKeys = [CDN_TOKEN_KEY, '__fr_cdn_url']

    for (const key of sessionKeys) {
      const val = sessionStorage.getItem(key)
      if (val !== null) {
        const display = key === '__fr_admin_auth' || key === CDN_TOKEN_KEY
          ? val.length > 0 ? `${'*'.repeat(Math.min(val.length, 8))} (${val.length} chars)` : '(empty)'
          : val.length > 100 ? val.slice(0, 100) + '...' : val
        items.push({ key, value: display, store: 'session' })
      }
    }
    for (const key of localKeys) {
      const val = localStorage.getItem(key)
      if (val !== null) {
        const display = key === CDN_TOKEN_KEY
          ? val.length > 0 ? `${'*'.repeat(Math.min(val.length, 8))} (${val.length} chars)` : '(empty)'
          : val
        items.push({ key, value: display, store: 'local' })
      }
    }
    setStorageInfo(items)
  }

  async function runCdnDebug() {
    setCdnLoading(true)
    setCdnResult(null)
    try {
      const cdnUrl = localStorage.getItem('__fr_cdn_url') || 'https://cdn.filiprosa.cz/'
      const token = sessionStorage.getItem('__fr_admin_auth') || ''
      const res = await fetch(`${cdnUrl}api/debug`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Api-Key': token,
          'Content-Type': 'application/json',
        },
      })
      const text = await res.text()
      setCdnResult(`HTTP ${res.status}\n\n${text}`)
    } catch (err) {
      setCdnResult(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setCdnLoading(false)
    }
  }

  async function testManifests() {
    setCdnLoading(true)
    setCdnResult(null)
    const cdnUrl = localStorage.getItem('__fr_cdn_url') || 'https://cdn.filiprosa.cz/'
    const manifests = ['gallery', 'museum', 'rosnik', 'gear', 'services', 'users']
    const results: string[] = []

    for (const m of manifests) {
      try {
        const res = await fetch(`${cdnUrl}${m}.json`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          const size = JSON.stringify(data).length
          results.push(`${m}.json: OK (${size} bytes)`)
        } else {
          results.push(`${m}.json: ${res.status} ${res.statusText}`)
        }
      } catch (err) {
        results.push(`${m}.json: Error - ${err instanceof Error ? err.message : String(err)}`)
      }
    }

    setCdnResult(results.join('\n'))
    setCdnLoading(false)
  }

  async function testUploadAuth() {
    setCdnLoading(true)
    setCdnResult(null)
    try {
      const cdnUrl = localStorage.getItem('__fr_cdn_url') || 'https://cdn.filiprosa.cz/'
      const token = sessionStorage.getItem('__fr_admin_auth') || ''
      const res = await fetch(`${cdnUrl}api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Api-Key': token,
        },
        body: new FormData(),
      })
      const text = await res.text()
      setCdnResult(`Upload endpoint: HTTP ${res.status}\n\n${text}`)
    } catch (err) {
      setCdnResult(`Error: ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setCdnLoading(false)
    }
  }

  const cdnUrl = (typeof window !== 'undefined' && localStorage.getItem('__fr_cdn_url')) || 'https://cdn.filiprosa.cz/'

  return (
    <div className="min-h-dvh bg-dark text-offwhite font-body px-6 py-12">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <Link
            href="/panel0x"
            className="text-[0.7rem] tracking-[0.14em] uppercase text-muted hover:text-offwhite transition-colors duration-200"
          >
            &larr; panel0x
          </Link>
          <h1 className="text-2xl font-display font-semibold text-offwhite tracking-[-0.02em] mt-2">Debug</h1>
          <p className="text-[0.78rem] text-muted mt-1">Diagnostics and debug tools</p>
        </div>

        {/* CDN Info */}
        <div className="mb-4 px-5 py-4 bg-charcoal border border-white/[0.05] rounded-[3px]">
          <p className="text-[0.72rem] text-muted/50 uppercase tracking-wider mb-2">CDN Server</p>
          <p className="text-[0.82rem] text-lime/70 font-mono">{cdnUrl}</p>
        </div>

        {/* Auth Storage */}
        <div className="mb-4 px-5 py-4 bg-charcoal border border-white/[0.05] rounded-[3px]">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[0.72rem] text-muted/50 uppercase tracking-wider">Auth Storage</p>
            <button
              onClick={refreshStorageInfo}
              className="px-2 py-0.5 text-[0.65rem] font-medium text-muted border border-white/[0.07] rounded-[2px] hover:text-offwhite transition-colors duration-200"
            >
              Refresh
            </button>
          </div>
          {storageInfo.length === 0 ? (
            <p className="text-[0.75rem] text-muted/40">No auth keys found</p>
          ) : (
            <div className="space-y-1.5">
              {storageInfo.map(item => (
                <div key={item.key} className="flex items-start gap-3 text-[0.72rem]">
                  <span className="text-[0.6rem] text-muted/30 uppercase tracking-wide w-14 flex-shrink-0 pt-0.5">{item.store}</span>
                  <span className="text-muted/60 font-mono flex-shrink-0">{item.key}</span>
                  <span className="text-offwhite/60 font-mono break-all">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CDN Tests */}
        <div className="mb-4 px-5 py-4 bg-charcoal border border-orange-500/20 rounded-[3px]">
          <p className="text-[0.72rem] text-orange-400/80 font-medium uppercase tracking-wider mb-3">CDN Tests</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={runCdnDebug}
              disabled={cdnLoading}
              className="px-3 py-1 text-[0.72rem] font-medium text-orange-400 border border-orange-500/30 rounded-[2px] hover:bg-orange-500/10 disabled:opacity-40 transition-colors duration-200"
            >
              {cdnLoading ? 'Testing...' : 'Debug Endpoint'}
            </button>
            <button
              onClick={testManifests}
              disabled={cdnLoading}
              className="px-3 py-1 text-[0.72rem] font-medium text-orange-400 border border-orange-500/30 rounded-[2px] hover:bg-orange-500/10 disabled:opacity-40 transition-colors duration-200"
            >
              Test Manifests
            </button>
            <button
              onClick={testUploadAuth}
              disabled={cdnLoading}
              className="px-3 py-1 text-[0.72rem] font-medium text-orange-400 border border-orange-500/30 rounded-[2px] hover:bg-orange-500/10 disabled:opacity-40 transition-colors duration-200"
            >
              Test Upload Auth
            </button>
          </div>
          {cdnResult && (
            <pre className="mt-3 p-3 bg-dark border border-white/[0.06] rounded-[2px] text-[0.65rem] text-offwhite/70 font-mono overflow-x-auto whitespace-pre-wrap max-h-[400px] overflow-y-auto">
              {cdnResult}
            </pre>
          )}
        </div>

        {/* Environment */}
        <div className="px-5 py-4 bg-charcoal border border-white/[0.05] rounded-[3px]">
          <p className="text-[0.72rem] text-muted/50 uppercase tracking-wider mb-2">Environment</p>
          <div className="space-y-1 text-[0.72rem] font-mono">
            <p><span className="text-muted/40">User Agent:</span> <span className="text-offwhite/50">{typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 80) : 'N/A'}...</span></p>
            <p><span className="text-muted/40">Window:</span> <span className="text-offwhite/50">{typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'N/A'}</span></p>
            <p><span className="text-muted/40">Protocol:</span> <span className="text-offwhite/50">{typeof location !== 'undefined' ? location.protocol : 'N/A'}</span></p>
            <p><span className="text-muted/40">Host:</span> <span className="text-offwhite/50">{typeof location !== 'undefined' ? location.host : 'N/A'}</span></p>
          </div>
        </div>
      </div>
    </div>
  )
}
