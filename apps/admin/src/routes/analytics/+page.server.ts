import { env } from '$env/dynamic/private'
import { createAnalyticsClient } from '$lib/server/analytics'
import type { PageServerLoad } from './$types'

let client: ReturnType<typeof createAnalyticsClient> | null = null
export const load: PageServerLoad = async ({ url, setHeaders }) => {
  setHeaders({ 'cache-control': 'no-store, private' })
  const days = url.searchParams.get('days') === '30' ? 30 : 7
  if (!env.UMAMI_WEBSITE_ID || !env.UMAMI_PASSWORD)
    return { days, dashboard: null, unavailable: 'not-configured' }
  client ??= createAnalyticsClient({
    url: env.UMAMI_URL || 'http://umami:3000',
    websiteId: env.UMAMI_WEBSITE_ID,
    username: env.UMAMI_USERNAME || 'black-whale',
    password: env.UMAMI_PASSWORD,
  })
  try {
    return { days, dashboard: await client.dashboard(days), unavailable: null }
  } catch {
    return { days, dashboard: null, unavailable: 'unreachable' }
  }
}
