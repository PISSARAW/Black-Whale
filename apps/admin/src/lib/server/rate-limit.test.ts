import { afterEach, describe, expect, it, vi } from 'vitest'
import { rateLimit, resetRateLimit } from './rate-limit'

afterEach(() => {
  vi.useRealTimers()
})

const WINDOW = 60_000

describe('rateLimit', () => {
  it('allows exactly `limit` calls inside a window, then refuses', () => {
    const key = `allow:${Math.random()}`
    for (let attempt = 0; attempt < 3; attempt += 1) {
      expect(rateLimit(key, 3, WINDOW).allowed).toBe(true)
    }
    const refused = rateLimit(key, 3, WINDOW)
    expect(refused.allowed).toBe(false)
    expect(refused.retryAfterSeconds).toBeGreaterThan(0)
  })

  it('keys buckets independently, so one address cannot lock out another', () => {
    const mine = `mine:${Math.random()}`
    const theirs = `theirs:${Math.random()}`
    for (let attempt = 0; attempt < 4; attempt += 1) rateLimit(mine, 2, WINDOW)
    expect(rateLimit(mine, 2, WINDOW).allowed).toBe(false)
    expect(rateLimit(theirs, 2, WINDOW).allowed).toBe(true)
  })

  it('reopens the budget once the window has passed', () => {
    vi.useFakeTimers()
    const key = `window:${Math.random()}`
    rateLimit(key, 1, WINDOW)
    expect(rateLimit(key, 1, WINDOW).allowed).toBe(false)
    vi.advanceTimersByTime(WINDOW + 1)
    expect(rateLimit(key, 1, WINDOW).allowed).toBe(true)
  })

  it('never reports a retry delay of zero while refusing', () => {
    vi.useFakeTimers()
    const key = `retry:${Math.random()}`
    rateLimit(key, 1, 500)
    vi.advanceTimersByTime(499)
    const refused = rateLimit(key, 1, 500)
    expect(refused.allowed).toBe(false)
    expect(refused.retryAfterSeconds).toBeGreaterThanOrEqual(1)
  })
})

describe('resetRateLimit', () => {
  it('clears the counter, which is what a successful login relies on', () => {
    const key = `reset:${Math.random()}`
    rateLimit(key, 1, WINDOW)
    expect(rateLimit(key, 1, WINDOW).allowed).toBe(false)
    resetRateLimit(key)
    expect(rateLimit(key, 1, WINDOW).allowed).toBe(true)
  })
})
