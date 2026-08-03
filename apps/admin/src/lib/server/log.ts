/**
 * Structured server logs.
 *
 * The deployment had no supervision at all: failures reached `console.error`
 * as free prose, so the only way to know the back-office had broken was to
 * open it.
 * One JSON object per line is the smallest thing that changes that — it is
 * readable in `docker compose logs`, and it is already parseable the day a
 * collector is put in front of it, without touching a single call site.
 *
 * Nothing here sends anything anywhere. Shipping the lines off the host is a
 * deployment concern, not an application one.
 */

export type LogLevel = 'info' | 'warn' | 'error'

/** Anything a log line can carry. Deliberately not `any`: it has to serialise. */
export type LogValue = string | number | boolean | null | undefined

export interface LogFields {
  [key: string]: LogValue
}

/**
 * Field names whose values never belong in a log, whatever the caller thinks.
 * A log line is the easiest place in a system to leak a credential, because
 * nobody reviews the shape of an object being spread into one.
 */
const REDACTED = new Set([
  'password',
  'session',
  'cookie',
  'authorization',
  'token',
  'secret',
  'sessionSecret',
  'adminPassword',
  'databaseUrl',
])

function redact(fields: LogFields): LogFields {
  const safe: LogFields = {}
  for (const [key, value] of Object.entries(fields)) {
    safe[key] = REDACTED.has(key) ? '[redacted]' : value
  }
  return safe
}

/** The serialisable shape of a thrown value, without its stack in production. */
export function describeError(error: unknown): LogFields {
  if (error instanceof Error) {
    return {
      errorName: error.name,
      errorMessage: error.message,
      // A stack names internal paths. Useful in a terminal, not in a log that
      // may end up somewhere less private.
      stack: process.env.NODE_ENV === 'production' ? undefined : error.stack,
    }
  }
  return { errorName: 'NonError', errorMessage: String(error) }
}

function emit(level: LogLevel, message: string, fields: LogFields = {}): void {
  const line = JSON.stringify({
    level,
    message,
    at: new Date().toISOString(),
    ...redact(fields),
  })
  // `console.error` for both warn and error so nothing operational lands on
  // stdout next to request logs.
  if (level === 'info') console.warn(line)
  else console.error(line)
}

export const log = {
  info: (message: string, fields?: LogFields) => emit('info', message, fields),
  warn: (message: string, fields?: LogFields) => emit('warn', message, fields),
  error: (message: string, fields?: LogFields) => emit('error', message, fields),
}

/**
 * A short identifier shown to the visitor and written to the log line, so a
 * reported failure can be found without asking them what they were doing.
 */
export function errorReference(): string {
  return Math.random().toString(36).slice(2, 10)
}
