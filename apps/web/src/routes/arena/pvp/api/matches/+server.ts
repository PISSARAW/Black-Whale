import { json } from '@sveltejs/kit'
import { arenaPvpRegistry } from '$lib/server/arenaPvp'
import { rateLimit } from '$lib/server/rateLimit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = ({ getClientAddress }) => {
  const throttle = rateLimit(`arena:pvp:create:${getClientAddress()}`, 12, 60_000)
  if (!throttle.allowed)
    return json(
      { error: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(throttle.retryAfterSeconds) } },
    )
  return json(arenaPvpRegistry.create(), { status: 201, headers: { 'cache-control': 'no-store' } })
}
