import { json } from '@sveltejs/kit'
import { parseNetworkAction } from '$lib/arena/pvp/protocol'
import { arenaPvpRegistry, ArenaPvpRegistryError } from '$lib/server/arenaPvp'
import { rateLimit } from '$lib/server/rateLimit'
import type { RequestHandler } from './$types'

export const POST: RequestHandler = async ({ params, request, getClientAddress }) => {
  const throttle = rateLimit(`arena:pvp:command:${getClientAddress()}`, 240, 60_000)
  if (!throttle.allowed)
    return json(
      { error: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(throttle.retryAfterSeconds) } },
    )
  const body = await request.json().catch(() => null)
  const sequence = record(body) ? body.sequence : null
  const action = record(body) ? parseNetworkAction(body.action) : null
  if (!Number.isInteger(sequence) || Number(sequence) < 0 || !action)
    return json({ error: 'INVALID_COMMAND' }, { status: 400 })
  try {
    return json(
      arenaPvpRegistry.submit(params.matchId, {
        token: bearer(request),
        sequence: Number(sequence),
        action,
      }),
      { headers: { 'cache-control': 'no-store' } },
    )
  } catch (error) {
    return registryFailure(error)
  }
}

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object'
}

function bearer(request: Request): string {
  const value = request.headers.get('authorization') ?? ''
  return value.startsWith('Bearer ') ? value.slice(7) : ''
}

function registryFailure(error: unknown) {
  if (!(error instanceof ArenaPvpRegistryError)) return json({ error: 'INTERNAL' }, { status: 500 })
  const status =
    error.code === 'MATCH_NOT_FOUND'
      ? 404
      : error.code === 'UNAUTHORIZED'
        ? 401
        : error.code === 'OUT_OF_ORDER'
          ? 409
          : 400
  return json({ error: error.code }, { status })
}
