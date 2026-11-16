import { json } from '@sveltejs/kit'
import { clashPvpRegistry, ClashPvpError } from './clashPvp'
import { rateLimit } from './rateLimit'
import { log, describeError } from './log'
import {
  boundedInteger,
  parsePvpPacket,
  parsePvpPackets,
  parsePvpSetup,
  record,
} from '$lib/fighting/pvp/protocol'
import { PVP_RULESET } from '$lib/fighting/pvp/types'
import { clashSeasons } from './clashSeasons'

const headers = { 'cache-control': 'no-store' }
export function clashPvpFailure(error: unknown): Response {
  const code = registryErrorCode(error)
  if (!code) {
    log.error('clash pvp failure', describeError(error))
    return json({ error: 'INTERNAL' }, { status: 500, headers })
  }
  const statuses: Record<string, number> = {
    NOT_FOUND: 404,
    UNAUTHORIZED: 401,
    INVITATION: 401,
    VERSION: 426,
    FULL: 409,
    SEQUENCE: 409,
    BUSY: 409,
    NOT_PLAYING: 409,
    NOT_READY: 409,
    CAPACITY: 503,
  }
  return json({ error: code }, { status: statuses[code] ?? 400, headers })
}
function registryErrorCode(error: unknown): string | null {
  if (error instanceof ClashPvpError) return error.code
  // A development reload may retain a lobby whose class belongs to the prior module instance.
  if (
    error instanceof Error &&
    error.name === 'ClashPvpError' &&
    'code' in error &&
    typeof error.code === 'string'
  )
    return error.code
  return null
}
export function clashBearer(request: Request) {
  return request.headers.get('authorization')?.match(/^Bearer (.{1,100})$/)?.[1] ?? ''
}
export function clashThrottle(key: string, limit: number): Response | null {
  const throttle = rateLimit(`clash:pvp:${key}`, limit, 60_000)
  return throttle.allowed
    ? null
    : json(
        { error: 'RATE_LIMITED' },
        {
          status: 429,
          headers: { ...headers, 'Retry-After': String(throttle.retryAfterSeconds) },
        },
      )
}
export async function clashBody(request: Request): Promise<unknown> {
  if (!request.body) return null
  const reader = request.body.getReader(),
    chunks: Uint8Array[] = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 8192) {
        await reader.cancel()
        return null
      }
      chunks.push(value)
    }
    const bytes = new Uint8Array(size)
    let offset = 0
    for (const chunk of chunks) {
      bytes.set(chunk, offset)
      offset += chunk.length
    }
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}
export function createClashLobby(body: unknown, profileToken = ''): Response {
  if (!record(body) || body.ruleset !== PVP_RULESET)
    return json({ error: 'VERSION' }, { status: 426, headers })
  const setup = parsePvpSetup(body.setup)
  if (!setup) return json({ error: 'INVALID_SETUP' }, { status: 400, headers })
  try {
    return json(clashPvpRegistry.create(setup, clashSeasons.identify(profileToken) ?? undefined), {
      status: 201,
      headers,
    })
  } catch (error) {
    return clashPvpFailure(error)
  }
}
export function updateClashLobby(id: string, request: Request, body: unknown): Response {
  if (!record(body)) return invalid()
  try {
    if (
      body.kind === 'join' &&
      typeof body.ruleset === 'string' &&
      typeof body.invitation === 'string'
    )
      return json(
        clashPvpRegistry.join(id, body.ruleset, {
          invitation: body.invitation,
          profile: clashSeasons.identify(request.headers.get('x-clash-profile') ?? '') ?? undefined,
        }),
        { status: 201, headers },
      )
    return authenticatedUpdate(id, request, body)
  } catch (error) {
    return clashPvpFailure(error)
  }
}
function authenticatedUpdate(
  id: string,
  request: Request,
  body: Record<string, unknown>,
): Response {
  const token = clashBearer(request)
  if (body.kind === 'inputs') {
    const packets = parsePvpPackets(body.packets)
    return packets && boundedInteger(body.round, Number.MAX_SAFE_INTEGER)
      ? json(clashPvpRegistry.receiveInputs(id, { token, packets, round: body.round }), { headers })
      : invalid()
  }
  if (body.kind === 'leave') {
    clashPvpRegistry.leave(id, token)
    return json({ left: true }, { headers })
  }
  if (
    body.kind === 'ready' &&
    typeof body.ruleset === 'string' &&
    typeof body.configHash === 'string'
  )
    return json(
      clashPvpRegistry.ready(id, { token, ruleset: body.ruleset, configHash: body.configHash }),
      { headers },
    )
  const packet = body.kind === 'input' ? parsePvpPacket(body.packet) : null
  return packet ? json(clashPvpRegistry.submit(id, { token, packet }), { headers }) : invalid()
}
function invalid() {
  return json({ error: 'INVALID_COMMAND' }, { status: 400, headers })
}
