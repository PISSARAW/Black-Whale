import { json } from '@sveltejs/kit'
import { env } from '$env/dynamic/private'
import { askClashQwen, clashQwenConfig, validCombatObservation } from '$lib/server/clashQwen'
import { rateLimit } from '$lib/server/rateLimit'
import type { RequestHandler } from './$types'

const headers = { 'cache-control': 'no-store' }
let busy = false
export const GET: RequestHandler = () => {
  const config = clashQwenConfig(env)
  return json({ available: Boolean(config), model: config?.model ?? null }, { headers })
}
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
  if (!clashQwenConfig(env)) return json({ error: 'unconfigured' }, { status: 503, headers })
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
    const result = await askClashQwen({ env, observation: body })
    return result
      ? json(result, { headers })
      : json({ error: 'unavailable' }, { status: 503, headers })
  } finally {
    busy = false
  }
}
