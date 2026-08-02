import { describe, expect, it } from 'vitest'
import { NEN_KEYS, nenZoneIndex } from './controls'

describe('canonical Arena Nen controls', () => {
  it('keeps direct, Mac-safe technique keys', () => {
    expect(NEN_KEYS).toMatchObject({ ten: 'KeyT', ren: 'KeyR', zetsu: 'KeyX', ko: 'KeyC' })
    expect(nenZoneIndex('Digit1')).toBe(0)
    expect(nenZoneIndex('Digit4')).toBe(3)
  })
})
