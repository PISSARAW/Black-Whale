import { describe, it, expect } from 'vitest'
import {
  ceilingOf,
  commit,
  forfeit,
  fullPool,
  MAX_AURA,
  poolOf,
  regenerate,
  release,
  spend,
} from './aura'

describe('the reservoir', () => {
  it('starts full and undivided', () => {
    expect(fullPool()).toEqual({ available: MAX_AURA, committed: 0 })
  })

  it('regenerates only at a standstill', () => {
    const walking = regenerate(poolOf(50), 1, false)
    const still = regenerate(poolOf(50), 1, true)
    expect(walking.available).toBe(50)
    expect(still.available).toBe(54)
  })

  it('never regenerates past the full hundred', () => {
    expect(regenerate(poolOf(99), 1, true).available).toBe(MAX_AURA)
  })
})

describe('placed aura lowers the ceiling — invariant I2', () => {
  it('takes committed aura out of the body', () => {
    const laid = commit(fullPool(), 25)
    expect(laid).toEqual({ available: 75, committed: 25 })
  })

  it('will not regenerate back over what is committed', () => {
    let pool = commit(fullPool(), 25)
    pool = spend(pool, 75)
    expect(pool.available).toBe(0)

    // A full minute of standing still: it stops at the ceiling, not at a hundred.
    for (let tick = 0; tick < 60; tick += 1) pool = regenerate(pool, 1, true)
    expect(pool.available).toBe(75)
    expect(ceilingOf(pool)).toBe(75)
  })

  it('cannot afford three sweeps and two entraves — the step-2 arbitration', () => {
    // Two entraves at 25 leave a ceiling of 50; three sweeps cost 45 of it. The
    // fourth would need a regeneration the game does not give time for.
    let pool = commit(commit(fullPool(), 25), 25)
    expect(ceilingOf(pool)).toBe(50)
    pool = spend(spend(spend(pool, 15), 15), 15)
    expect(pool.available).toBe(5)
  })
})

describe('getting placed aura back', () => {
  it('returns it to the body at once when it is recovered', () => {
    const pool = release(commit(fullPool(), 25), 25)
    expect(pool).toEqual({ available: MAX_AURA, committed: 0 })
  })

  it('does not return it when the entrave fires, but does raise the ceiling', () => {
    const laid = commit(fullPool(), 25)
    const fired = forfeit(laid, 25)
    expect(fired.available).toBe(75)
    expect(ceilingOf(fired)).toBe(MAX_AURA)
  })

  it('never releases more than was committed', () => {
    expect(release(poolOf(10, 5), 50)).toEqual({ available: 15, committed: 0 })
  })

  it('never spends below zero', () => {
    expect(spend(poolOf(5), 50).available).toBe(0)
  })
})
