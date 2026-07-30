import { describe, expect, it } from 'vitest'
import type { Cookies } from '@sveltejs/kit'
import { POST } from './+server'
import { readSpoilerLimit, SPOILER_COOKIE } from '$lib/server/spoiler'

const LEGACY_COOKIE = 'spoiler_limit'

/** Just enough of `cookies` for the endpoint and the reader to share one jar. */
function jar(initial: Record<string, string>) {
  const store = new Map(Object.entries(initial))
  const cookies = {
    get: (name: string) => store.get(name),
    set: (name: string, value: string) => void store.set(name, value),
    delete: (name: string) => void store.delete(name),
  } as unknown as Cookies
  return { cookies, store }
}

/**
 * Runs the handler and reports where it sent the reader. `redirect()` throws its
 * `Redirect` rather than returning a response, so a successful call lands here as
 * a rejection.
 */
async function post(fields: Record<string, string>, initial: Record<string, string> = {}) {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.set(key, value)
  const { cookies, store } = jar(initial)

  let redirect: { status: number; location: string } | null = null
  try {
    await POST({
      request: new Request('http://localhost/spoiler-limit', { method: 'POST', body: form }),
      cookies,
    } as never)
  } catch (thrown) {
    redirect = thrown as { status: number; location: string }
  }
  if (!redirect) throw new Error('the endpoint returned instead of redirecting')

  return { redirect, cookies, store }
}

describe('POST /spoiler-limit', () => {
  it('stores the cap the reader submitted', async () => {
    const { cookies, store } = await post({ chapter: '370', redirectTo: '/timeline' })
    expect(store.get(SPOILER_COOKIE)).toBe('370')
    expect(readSpoilerLimit(cookies)).toBe(370)
  })

  it('sends the reader back to the page they set it from', async () => {
    const { redirect } = await post({ chapter: '370', redirectTo: '/fr/ship?event=ev-1' })
    expect(redirect.status).toBe(303)
    expect(redirect.location).toBe('/fr/ship?event=ev-1')
  })

  it('refuses to bounce off site', async () => {
    const scheme = await post({ chapter: '370', redirectTo: 'https://evil.example/' })
    expect(scheme.redirect.location).toBe('/')

    // A browser reads a protocol-relative path as another origin.
    const protocolRelative = await post({ chapter: '370', redirectTo: '//evil.example/' })
    expect(protocolRelative.redirect.location).toBe('/')
  })

  it('clears the cap on the full-canon button, legacy cookie included', async () => {
    const { cookies } = await post(
      { intent: 'clear', chapter: '370', redirectTo: '/' },
      { [SPOILER_COOKIE]: '370', [LEGACY_COOKIE]: '350' },
    )
    expect(readSpoilerLimit(cookies)).toBeUndefined()
  })

  it('clears the cap when the field is submitted empty', async () => {
    const { cookies } = await post({ chapter: '', redirectTo: '/' }, { [SPOILER_COOKIE]: '370' })
    expect(readSpoilerLimit(cookies)).toBeUndefined()
  })

  it('leaves the cap alone rather than widening it on junk', async () => {
    for (const chapter of ['not-a-chapter', '-4', 'Infinity']) {
      const { cookies } = await post({ chapter, redirectTo: '/' }, { [SPOILER_COOKIE]: '370' })
      expect(readSpoilerLimit(cookies)).toBe(370)
    }
  })

  it('retires the legacy cookie when a new cap is set', async () => {
    const { store } = await post({ chapter: '380', redirectTo: '/' }, { [LEGACY_COOKIE]: '350' })
    expect(store.has(LEGACY_COOKIE)).toBe(false)
    expect(store.get(SPOILER_COOKIE)).toBe('380')
  })
})
