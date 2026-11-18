import { json } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import {
  askClashQwen,
  clashQwenConfig,
  clashQwenSeats,
  validCombatObservation,
} from '$lib/server/clashQwen'
import type { FightSide } from '$lib/fighting/types'
import { rateLimit } from '$lib/server/rateLimit'
import type { RequestHandler } from './$types'

const headers = { 'cache-control': 'no-store' }
let busy = false
const SEATS: readonly FightSide[] = ['player', 'opponent']
export const GET: RequestHandler = () => {
  const models = clashQwenSeats(env)
  return json({ available: Boolean(models), models }, { headers })
}
/** No `seat` keeps the shared configuration; an unknown seat is refused, never defaulted. */
function seatOf(url: URL): FightSide | undefined | null {
  const seat = url.searchParams.get('seat')
  if (seat === null) return undefined
  return SEATS.includes(seat as FightSide) ? (seat as FightSide) : null
}
export const POST: RequestHandler = async ({ request, url, getClientAddress }) => {
  const seat = seatOf(url)
  if (seat === null) return json({ error: 'seat' }, { status: 400, headers })
  if (!clashQwenConfig(env, seat)) return json({ error: 'unconfigured' }, { status: 503, headers })
  if (!rateLimit(`clash:qwen:${getClientAddress()}`, 40, 60_000).allowed || busy)
    return json({ error: 'busy' }, { status: 429, headers })
  const text = await request.text()
  if (text.length > 12000) return json({ error: 'body' }, { status: 413, headers })
  let body: unknown
  try {
    body = JSON.parse(text)
  } catch {
    return json({ error: 'body' }, { status: 400, headers })
  }
  if (!validCombatObservation(body)) return json({ error: 'observation' }, { status: 400, headers })
  busy = true
  try {
    const result = await askClashQwen({ env, observation: body, seat })
    return result
      ? json(result, { headers })
      : json({ error: 'unavailable' }, { status: 503, headers })
  } finally {
    busy = false
  }
}
