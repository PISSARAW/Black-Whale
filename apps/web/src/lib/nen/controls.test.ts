import { describe, expect, it } from 'vitest'
import { isNenControlCode, NEN_KEYS, nenZoneIndex } from './controls'

describe('canonical Arena Nen controls', () => {
  it('keeps direct, Mac-safe technique keys', () => {
    expect(NEN_KEYS).toMatchObject({ ten: 'KeyT', ren: 'KeyR', zetsu: 'KeyX', ko: 'KeyC' })
    expect(nenZoneIndex('Digit1')).toBe(0)
    expect(nenZoneIndex('Digit4')).toBe(3)
    expect(isNenControlCode('KeyH')).toBe(true)
    expect(isNenControlCode('KeyV')).toBe(false)
  })

  it('assigns each canonical action to one unambiguous key', () => {
    const codes = Object.values(NEN_KEYS)
    expect(new Set(codes).size).toBe(codes.length)
  })
})
