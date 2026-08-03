import { afterEach, describe, expect, it, vi } from 'vitest'
import { describeError, errorReference, log } from './log'

afterEach(() => {
  vi.restoreAllMocks()
  process.env.NODE_ENV = 'test'
})

/** Captures the single JSON line an emit produces. */
function capture(emit: () => void): Record<string, unknown> {
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  emit()
  expect(spy).toHaveBeenCalledOnce()
  return JSON.parse(spy.mock.calls[0]![0] as string)
}

describe('log', () => {
  it('writes one parseable JSON object per line', () => {
    const line = capture(() => log.error('request failed', { status: 500, path: '/ship' }))
    expect(line).toMatchObject({ level: 'error', message: 'request failed', status: 500 })
    expect(typeof line.at).toBe('string')
  })

  it('redacts the fields a log line must never carry', () => {
    const line = capture(() =>
      log.error('login', { password: 'hunter2', token: 'abc', path: '/login' }),
    )
    expect(line.password).toBe('[redacted]')
    expect(line.token).toBe('[redacted]')
    expect(line.path).toBe('/login')
  })
})

describe('describeError', () => {
  it('names an Error and keeps its stack outside production', () => {
    process.env.NODE_ENV = 'test'
    const described = describeError(new TypeError('boom'))
    expect(described).toMatchObject({ errorName: 'TypeError', errorMessage: 'boom' })
    expect(described.stack).toBeTruthy()
  })

  it('drops the stack in production: it names internal paths', () => {
    process.env.NODE_ENV = 'production'
    expect(describeError(new Error('boom')).stack).toBeUndefined()
  })

  it('describes a thrown non-Error rather than losing it', () => {
    expect(describeError('just a string')).toMatchObject({
      errorName: 'NonError',
      errorMessage: 'just a string',
    })
  })
})

describe('errorReference', () => {
  it('is short and effectively unique', () => {
    const references = new Set(Array.from({ length: 500 }, errorReference))
    expect(references.size).toBeGreaterThan(495)
    for (const reference of references) expect(reference).toMatch(/^[a-z0-9]{1,8}$/)
  })
})
