/**
 * Authentication utilities for the admin panel.
 * Uses Web Crypto API for password hashing (SHA-256 with random salt).
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Permission = 'upload' | 'delete' | 'edit'
export type Section = 'gallery' | 'museum' | 'rosnik'

export interface UserPermissions {
  gallery: Permission[]
  museum: Permission[]
  rosnik: Permission[]
}

export interface User {
  username: string
  passwordHash: string   // hex(SHA-256(salt + password))
  salt: string           // random hex string
  role: 'admin' | 'editor'
  permissions: UserPermissions
}

export interface UsersManifest {
  users: User[]
  updatedAt?: number
}

// ─── Constants ───────────────────────────────────────────────────────────────

const SESSION_USER_KEY = '__fr_admin_user'       // sessionStorage: logged-in username
const SESSION_AUTH_KEY = '__fr_admin_auth'        // sessionStorage: CDN auth token
const SESSION_ROLE_KEY = '__fr_admin_role'        // sessionStorage: user role
const SESSION_PERMS_KEY = '__fr_admin_perms'      // sessionStorage: JSON permissions
const CDN_TOKEN_KEY = '__fr_admin_pass'           // localStorage: CDN API token
const RATE_LIMIT_KEY = '__fr_login_attempts'      // sessionStorage: login rate limiting

const ALL_PERMISSIONS: Permission[] = ['upload', 'delete', 'edit']

export const FULL_PERMISSIONS: UserPermissions = {
  gallery: [...ALL_PERMISSIONS],
  museum: [...ALL_PERMISSIONS],
  rosnik: [...ALL_PERMISSIONS],
}

// ─── Crypto ──────────────────────────────────────────────────────────────────

/** Generate a random hex salt (32 bytes = 64 hex chars). */
export function generateSalt(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

/** Hash a password with salt using SHA-256. Returns hex string. */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(salt + password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ─── Rate Limiting ───────────────────────────────────────────────────────────

interface RateLimitState {
  attempts: number
  lockedUntil: number  // timestamp
}

function getRateLimitState(): RateLimitState {
  try {
    const raw = sessionStorage.getItem(RATE_LIMIT_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { attempts: 0, lockedUntil: 0 }
}

function setRateLimitState(state: RateLimitState): void {
  sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify(state))
}

/** Check if login is rate-limited. Returns seconds remaining or 0. */
export function checkRateLimit(): number {
  const state = getRateLimitState()
  if (state.lockedUntil > Date.now()) {
    return Math.ceil((state.lockedUntil - Date.now()) / 1000)
  }
  return 0
}

/** Record a failed login attempt. Locks after 5 failures for increasing durations. */
export function recordFailedAttempt(): number {
  const state = getRateLimitState()
  state.attempts++
  if (state.attempts >= 5) {
    // Lock for 30s * (attempts - 4), max 5 minutes
    const lockDuration = Math.min(30000 * (state.attempts - 4), 300000)
    state.lockedUntil = Date.now() + lockDuration
    setRateLimitState(state)
    return Math.ceil(lockDuration / 1000)
  }
  setRateLimitState(state)
  return 0
}

/** Reset rate limit state after successful login. */
export function resetRateLimit(): void {
  sessionStorage.removeItem(RATE_LIMIT_KEY)
}

// ─── Session Management ──────────────────────────────────────────────────────

export interface SessionInfo {
  username: string
  role: 'admin' | 'editor'
  permissions: UserPermissions
}

/** Store session info after successful login. */
export function setSession(user: User, token?: string): void {
  const cdnToken = token || localStorage.getItem(CDN_TOKEN_KEY) || ''
  sessionStorage.setItem(SESSION_AUTH_KEY, cdnToken)
  sessionStorage.setItem(SESSION_USER_KEY, user.username)
  sessionStorage.setItem(SESSION_ROLE_KEY, user.role)
  sessionStorage.setItem(SESSION_PERMS_KEY, JSON.stringify(user.permissions))
}

/** Get current session info, or null if not logged in. */
export function getSession(): SessionInfo | null {
  const username = sessionStorage.getItem(SESSION_USER_KEY)
  const role = sessionStorage.getItem(SESSION_ROLE_KEY) as 'admin' | 'editor' | null
  const permsJson = sessionStorage.getItem(SESSION_PERMS_KEY)
  const authToken = sessionStorage.getItem(SESSION_AUTH_KEY)

  if (!username || !role || !authToken) return null

  let permissions: UserPermissions = FULL_PERMISSIONS
  if (permsJson) {
    try { permissions = JSON.parse(permsJson) } catch { /* use default */ }
  }

  return { username, role, permissions }
}

/** Clear session (logout). */
export function clearSession(): void {
  sessionStorage.removeItem(SESSION_AUTH_KEY)
  sessionStorage.removeItem(SESSION_USER_KEY)
  sessionStorage.removeItem(SESSION_ROLE_KEY)
  sessionStorage.removeItem(SESSION_PERMS_KEY)
}

/** Check if current user has a specific permission on a section. */
export function hasPermission(section: Section, permission: Permission): boolean {
  const session = getSession()
  if (!session) return false
  if (session.role === 'admin') return true
  return session.permissions[section]?.includes(permission) ?? false
}

/** Check if current user is admin. */
export function isAdmin(): boolean {
  return sessionStorage.getItem(SESSION_ROLE_KEY) === 'admin'
}

// ─── User Storage (CDN) ──────────────────────────────────────────────────────

/** Fetch users manifest from CDN. Returns empty manifest if not found. */
export async function loadUsers(): Promise<UsersManifest> {
  // Dynamic import to avoid circular dependency
  const { CDN_URL } = await import('./cdn')
  try {
    const res = await fetch(`${CDN_URL}users.json`, { cache: 'no-store' })
    if (!res.ok) return { users: [] }
    const data = await res.json()
    if (data && Array.isArray(data.users)) return data
  } catch { /* ignore */ }
  return { users: [] }
}

/**
 * Save users manifest to CDN via the dedicated save-users endpoint.
 */
export async function saveUsersToCdn(manifest: UsersManifest): Promise<void> {
  const { CDN_URL } = await import('./cdn')
  const stamped = { ...manifest, updatedAt: Date.now() }
  const token = sessionStorage.getItem('__fr_admin_auth') || ''

  const res = await fetch(`${CDN_URL}api/save-users`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Api-Key': token,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(stamped),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Failed to save users (${res.status}): ${text}`)
  }
}

// ─── User Management ────────────────────────────────────────────────────────

/** Create default admin user from existing password. Used for migration. */
export async function createDefaultAdmin(password: string): Promise<User> {
  const salt = generateSalt()
  const passwordHash = await hashPassword(password, salt)
  return {
    username: 'admin',
    passwordHash,
    salt,
    role: 'admin',
    permissions: FULL_PERMISSIONS,
  }
}

/** Verify a password against a user's stored hash. */
export async function verifyPassword(password: string, user: User): Promise<boolean> {
  const hash = await hashPassword(password, user.salt)
  // Constant-time comparison to prevent timing attacks
  if (hash.length !== user.passwordHash.length) return false
  let result = 0
  for (let i = 0; i < hash.length; i++) {
    result |= hash.charCodeAt(i) ^ user.passwordHash.charCodeAt(i)
  }
  return result === 0
}
