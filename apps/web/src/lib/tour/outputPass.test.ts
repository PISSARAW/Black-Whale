import { describe, expect, it } from 'vitest'
import { TONEMAP_FLAG, wantsColourManagement } from './outputPass'

describe('the colour management flag', () => {
  it('is off unless this visit asked for it', () => {
    expect(wantsColourManagement('')).toBe(false)
    expect(wantsColourManagement('?deck=tier-3')).toBe(false)
  })

  it('is on for exactly one spelling', () => {
    expect(wantsColourManagement(`?${TONEMAP_FLAG}=1`)).toBe(true)
    expect(wantsColourManagement(`?deck=tier-1&${TONEMAP_FLAG}=1`)).toBe(true)
  })

  it('cannot be half-enabled', () => {
    // A flag that exists to be deleted should have no ambiguous states: every
    // one of these is a visitor who did not ask, and every one of them used to
    // be a plausible way to ask.
    expect(wantsColourManagement(`?${TONEMAP_FLAG}`)).toBe(false)
    expect(wantsColourManagement(`?${TONEMAP_FLAG}=`)).toBe(false)
    expect(wantsColourManagement(`?${TONEMAP_FLAG}=0`)).toBe(false)
    expect(wantsColourManagement(`?${TONEMAP_FLAG}=true`)).toBe(false)
  })
})
