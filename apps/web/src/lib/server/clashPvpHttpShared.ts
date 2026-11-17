import { json } from '@sveltejs/kit'
import { ClashPvpError } from './clashPvp'
import { rateLimit } from './rateLimit'
import { log, describeError } from './log'
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
    STALE_INPUT: 409,
    NOT_READY: 409,
    CAPACITY: 503,
    RESULT_STORAGE: 503,
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
