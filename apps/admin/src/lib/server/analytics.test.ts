import { describe, expect, it, vi } from 'vitest'
import { createAnalyticsClient } from './analytics'

const config = {
  url: 'http://umami:3000',
  websiteId: 'test-site',
  username: 'private',
  password: 'secret',
}
describe('private dashboard', () => {
  it('shares one server-side login and aggregates activity without sending credentials to reads', async () => {
    const calls: { url: string; init?: RequestInit }[] = []
    const fetcher = vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init })
      if (url.endsWith('/login')) return Response.json({ token: 'private-token' })
      if (url.includes('/stats?')) return Response.json({ visitors: 2, visits: 3, pageviews: 4 })
      const query = new URL(url).searchParams
      if (
        url.includes('/metrics?') &&
        !['path', 'referrer', 'device', 'event'].includes(query.get('type') ?? '')
      )
        return new Response(null, { status: 400 })
      const event = query.get('eventName')
      if (event === 'section_enter') return Response.json([{ value: 'ship', total: 4 }])
      if (event === 'mode_active_30s') return Response.json([{ value: 'ship', total: 5 }])
      return Response.json([])
    })
    const result = await createAnalyticsClient(
      config,
      fetcher as unknown as typeof fetch,
    ).dashboard(7)
    expect(calls.filter((call) => call.url.endsWith('/login'))).toHaveLength(1)
    expect(result.modes).toEqual([
      { mode: 'ship', entries: 4, interactions: 0, starts: 0, completed: 0, activeMinutes: 2.5 },
    ])
    expect(JSON.stringify(result)).not.toContain('secret')
    expect(
      calls.filter((call) => !call.url.endsWith('/login')).every((call) => !call.init?.body),
    ).toBe(true)
  })

  it('surfaces collector failure instead of inventing zero visits', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 503 }))
    await expect(
      createAnalyticsClient(config, fetcher as typeof fetch).dashboard(30),
    ).rejects.toThrow('authentication unavailable')
  })
})
