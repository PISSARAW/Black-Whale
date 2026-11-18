export interface Metric {
  x: string
  y: number
}
export interface Stats {
  visitors: number
  visits: number
  pageviews: number
}
export interface AnalyticsConfig {
  url: string
  websiteId: string
  username: string
  password: string
}
type Fetch = typeof globalThis.fetch

export function createAnalyticsClient(config: AnalyticsConfig, fetcher: Fetch = globalThis.fetch) {
  let token: string | null = null
  let login: Promise<string> | null = null
  const request = (path: string, init: RequestInit = {}) =>
    fetcher(`${config.url}${path}`, {
      ...init,
      signal: AbortSignal.timeout(8000),
    })
  async function authenticate() {
    if (token) return token
    if (!login)
      login = (async () => {
        const response = await request('/api/auth/login', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ username: config.username, password: config.password }),
        })
        if (!response.ok) throw new Error('Umami authentication unavailable')
        const data = await response.json()
        if (typeof data.token !== 'string') throw new Error('Umami authentication unavailable')
        token = data.token
        return data.token as string
      })().finally(() => {
        login = null
      })
    return login
  }
  async function read<T>(path: string, query: URLSearchParams): Promise<T> {
    const endpoint = `/api/websites/${config.websiteId}/${path}?${query}`
    let response = await request(endpoint, {
      headers: { authorization: `Bearer ${await authenticate()}` },
    })
    if (response.status === 401) {
      token = null
      response = await request(endpoint, {
        headers: { authorization: `Bearer ${await authenticate()}` },
      })
    }
    if (!response.ok) throw new Error('Umami statistics unavailable')
    return response.json()
  }
  return {
    async dashboard(days: number) {
      const endAt = Date.now()
      const base = { startAt: String(endAt - days * 86_400_000), endAt: String(endAt) }
      const metrics = (type: string) =>
        read<Metric[]>('metrics', new URLSearchParams({ ...base, type, limit: '100' }))
      const values = async (eventName: string, propertyName: string): Promise<Metric[]> => {
        const rows = await read<Array<{ value: string; total: number }>>(
          'event-data/values',
          new URLSearchParams({ ...base, eventName, propertyName }),
        )
        return rows.map((row) => ({ x: row.value, y: Number(row.total) }))
      }
      const [
        stats,
        pages,
        referrers,
        devices,
        entries,
        interactions,
        starts,
        completed,
        active,
        hatsu,
        selected,
        variants,
        events,
      ] = await Promise.all([
        read<Stats>('stats', new URLSearchParams(base)),
        metrics('url'),
        metrics('referrer'),
        metrics('device'),
        values('section_enter', 'mode'),
        values('mode_interaction', 'mode'),
        values('mode_start', 'mode'),
        values('mode_complete', 'mode'),
        values('mode_active_30s', 'mode'),
        values('hatsu_use', 'surface_hatsu'),
        values('hatsu_select', 'hatsu'),
        values('mode_start', 'variant'),
        metrics('event'),
      ])
      const lookup = (rows: Metric[], key: string) =>
        Number(rows.find((row) => row.x === key)?.y ?? 0)
      const modes = entries.map((entry) => ({
        mode: entry.x,
        entries: entry.y,
        interactions: lookup(interactions, entry.x),
        starts: lookup(starts, entry.x),
        completed: lookup(completed, entry.x),
        activeMinutes: lookup(active, entry.x) / 2,
      }))
      return {
        stats,
        pages,
        referrers,
        devices,
        modes,
        hatsu,
        selected,
        variants,
        hatsuUses: lookup(events, 'hatsu_use'),
        updatedAt: endAt,
      }
    },
  }
}
