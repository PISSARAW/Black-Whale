import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The session module reads its secrets through `process.env` at call time, but
 * `passwordBinding()` derives from them, so a test that changes the password has
 * to re-import to be sure nothing is memoised. Importing fresh in each block is
 * cheap and keeps the assertions honest.
 */
async function loadSession() {
  vi.resetModules()
  return import('./session')
}

const ORIGINAL_ENV = { ...process.env }

beforeEach(() => {
  process.env.NODE_ENV = 'test'
  process.env.ADMIN_PASSWORD = 'correct horse battery staple'
  process.env.SESSION_SECRET = 'a'.repeat(48)
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
  vi.useRealTimers()
})

describe('verifyPassword', () => {
  it('accepts the configured password and refuses anything else', async () => {
    const { verifyPassword } = await loadSession()
    expect(verifyPassword('correct horse battery staple')).toBe(true)
    expect(verifyPassword('correct horse battery stapl')).toBe(false)
    expect(verifyPassword('')).toBe(false)
    expect(verifyPassword('correct horse battery staple ')).toBe(false)
  })
})

describe('createSession / verifySession', () => {
  it('accepts a token it issued itself', async () => {
    const { createSession, verifySession } = await loadSession()
    expect(verifySession(createSession())).toBe(true)
  })

  it('issues a distinct token every time', async () => {
    const { createSession } = await loadSession()
    const tokens = new Set(Array.from({ length: 20 }, () => createSession()))
    expect(tokens.size).toBe(20)
  })

  it('refuses absent, malformed or truncated values', async () => {
    const { createSession, verifySession } = await loadSession()
    const token = createSession()
    expect(verifySession(undefined)).toBe(false)
    expect(verifySession('')).toBe(false)
    expect(verifySession('a.b.c')).toBe(false)
    expect(verifySession('a.b.c.d.e')).toBe(false)
    expect(verifySession(token.slice(0, -1))).toBe(false)
    expect(verifySession(`not-a-number.${token.split('.').slice(1).join('.')}`)).toBe(false)
  })

  it('refuses a token whose signature was replaced', async () => {
    const { createSession, verifySession } = await loadSession()
    const [expiresAt, nonce, binding] = createSession().split('.')
    expect(verifySession(`${expiresAt}.${nonce}.${binding}.forged`)).toBe(false)
  })

  it('refuses a token whose payload was edited to extend its life', async () => {
    const { createSession, verifySession } = await loadSession()
    const [expiresAt, nonce, binding, signature] = createSession().split('.')
    const later = String(Number(expiresAt) + 86_400)
    expect(verifySession(`${later}.${nonce}.${binding}.${signature}`)).toBe(false)
  })

  it('refuses a token past its expiry', async () => {
    vi.useFakeTimers()
    const { createSession, verifySession } = await loadSession()
    const token = createSession()
    vi.advanceTimersByTime(13 * 60 * 60 * 1000)
    expect(verifySession(token)).toBe(false)
  })

  it('refuses a token issued against the previous password', async () => {
    const before = await loadSession()
    const token = before.createSession()

    process.env.ADMIN_PASSWORD = 'a completely different password'
    const after = await loadSession()
    expect(after.verifySession(token)).toBe(false)
  })

  it('refuses a token signed with a different secret', async () => {
    const before = await loadSession()
    const token = before.createSession()

    process.env.SESSION_SECRET = 'b'.repeat(48)
    const after = await loadSession()
    expect(after.verifySession(token)).toBe(false)
  })
})

describe('production secrets', () => {
  it('refuses to run without them, and refuses weak ones', async () => {
    process.env.NODE_ENV = 'production'
    delete process.env.SESSION_SECRET
    const { createSession } = await loadSession()
    expect(() => createSession()).toThrow(/SESSION_SECRET is required/)

    process.env.SESSION_SECRET = 'too-short'
    const short = await loadSession()
    expect(() => short.createSession()).toThrow(/at least 32 characters/)

    process.env.SESSION_SECRET = 'a'.repeat(48)
    process.env.ADMIN_PASSWORD = 'short'
    const weak = await loadSession()
    expect(() => weak.createSession()).toThrow(/at least 12 characters/)
  })
})

describe('sessionCookieOptions', () => {
  it('keeps the cookie out of scripts and off cross-site requests', async () => {
    const { sessionCookieOptions } = await loadSession()
    expect(sessionCookieOptions.httpOnly).toBe(true)
    expect(sessionCookieOptions.sameSite).toBe('strict')
    expect(sessionCookieOptions.path).toBe('/')
  })

  it('marks the cookie secure in production', async () => {
    process.env.NODE_ENV = 'production'
    const { sessionCookieOptions } = await loadSession()
    expect(sessionCookieOptions.secure).toBe(true)
  })
})
