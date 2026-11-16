import { json } from '@sveltejs/kit'
import { clashSeasons } from '$lib/server/clashSeasons'
import { clashBody, clashThrottle } from '$lib/server/clashPvpHttp'
import { record } from '$lib/fighting/pvp/protocol'
import type { RequestHandler } from './$types'

export const GET: RequestHandler = () =>
  json(
    { ...clashSeasons.leaderboard(), ...clashSeasons.status() },
    { headers: { 'cache-control': 'no-store' } },
  )
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  const limited = clashThrottle(`profile:${getClientAddress()}`, 20)
  if (limited) return limited
  const body = await clashBody(request)
  if (!record(body) || typeof body.name !== 'string' || body.name.length > 24)
    return json({ error: 'INVALID_NAME' }, { status: 400 })
  try {
    return json(clashSeasons.register(body.name), {
      status: 201,
      headers: { 'cache-control': 'no-store' },
    })
  } catch {
    return json({ error: 'RANKING_UNAVAILABLE' }, { status: 503 })
  }
}
