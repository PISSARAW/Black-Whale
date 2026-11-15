import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from './+server'
import { rateLimit } from '$lib/server/rateLimit'

vi.mock('$env/dynamic/private', () => ({ env: {} }))
vi.mock('$lib/server/rateLimit', () => ({ rateLimit: vi.fn(() => ({ allowed: true })) }))

function event(body: unknown, cap?: string) {
  return {
    request: new Request('https://black-whale.test/search', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json' },
    }),
    cookies: { get: (key: string) => (key === 'userSpoilerLimit' ? cap : undefined) },
    getClientAddress: () => 'test-search',
  } as unknown as Parameters<typeof POST>[0]
}

beforeEach(() => vi.mocked(rateLimit).mockReturnValue({ allowed: true, retryAfterSeconds: 0 }))

describe('global search boundary', () => {
  it('takes the cap from the HttpOnly cookie, ignoring body and query claims', async () => {
    const response = await POST(
      event(
        { query: 'Komiya', locale: 'fr', semantic: false, spoilerLimit: 9999, maxChapter: 9999 },
        '399',
      ),
    )
    expect(response.status).toBe(200)
    expect(response.headers.get('cache-control')).toBe('private, no-store')
    expect(response.headers.get('vary')).toBe('Cookie')
    const body = await response.json()
    expect(body.spoilerLimit).toBe(399)
    expect(JSON.stringify(body)).not.toContain('Komiya')
  })

  it('rejects empty, malformed and overlong queries', async () => {
    for (const query of ['', '   ', 42, 'x'.repeat(161)]) {
      expect((await POST(event({ query }))).status).toBe(400)
    }
  })

  it('bounds anonymous traffic and does not cache rate-limit responses', async () => {
    vi.mocked(rateLimit).mockReturnValue({ allowed: false, retryAfterSeconds: 12 })
    const response = await POST(event({ query: 'Kurapika' }))
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('12')
    expect(response.headers.get('cache-control')).toBe('private, no-store')
  })
})
