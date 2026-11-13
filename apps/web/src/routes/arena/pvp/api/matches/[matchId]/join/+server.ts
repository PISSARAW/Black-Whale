import { json } from '@sveltejs/kit'
import { arenaPvpRegistry, ArenaPvpRegistryError } from '$lib/server/arenaPvp'
import { rateLimit } from '$lib/server/rateLimit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = ({ params, getClientAddress }) => {
  const throttle = rateLimit(`arena:pvp:join:${getClientAddress()}`, 24, 60_000)
  if (!throttle.allowed)
    return json(
      { error: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(throttle.retryAfterSeconds) } },
    )
  try {
    return json(arenaPvpRegistry.join(params.matchId), {
      status: 201,
      headers: { 'cache-control': 'no-store' },
    })
  } catch (error) {
    return registryFailure(error)
  }
}

function registryFailure(error: unknown) {
  if (!(error instanceof ArenaPvpRegistryError)) return json({ error: 'INTERNAL' }, { status: 500 })
  return json({ error: error.code }, { status: error.code === 'MATCH_NOT_FOUND' ? 404 : 409 })
}
