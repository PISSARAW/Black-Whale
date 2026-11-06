import { afterEach, describe, expect, it, vi } from 'vitest'
import { GET } from '../../routes/reconstruction/perspective/+server'
import { buildPerspective } from '$lib/server/perspectives'

vi.mock('$lib/server/perspectives', () => ({
  buildPerspective: vi.fn(async () => ({ visibleBodies: ['body'], knownFacts: [], beliefs: [] })),
}))
afterEach(() => vi.clearAllMocks())

describe('reconstruction perspective cap', () => {
  it.each([
    { query: '', cookie: undefined, expected: undefined },
    { query: '&spoiler=', cookie: undefined, expected: undefined },
    { query: '&spoiler=0', cookie: undefined, expected: 0 },
    { query: '&spoiler=390', cookie: '375', expected: 375 },
    { query: '&spoiler=370', cookie: '375', expected: 370 },
    { query: '&spoiler=undefined', cookie: '375', expected: 375 },
  ])('uses $expected for query $query and cookie $cookie', async ({ query, cookie, expected }) => {
    const request = {
      url: new URL(
        `http://localhost/reconstruction/perspective?observer=reader&event=event${query}`,
      ),
      cookies: { get: (name: string) => (name === 'userSpoilerLimit' ? cookie : undefined) },
    } as Parameters<typeof GET>[0]
    const response = await GET(request)
    expect(response.status).toBe(200)
    expect(buildPerspective).toHaveBeenCalledWith('reader', 'event', expected)
    expect(await response.json()).toEqual({
      visibleBodyIds: ['body'],
      knownFactCount: 0,
      beliefCount: 0,
    })
  })
})
