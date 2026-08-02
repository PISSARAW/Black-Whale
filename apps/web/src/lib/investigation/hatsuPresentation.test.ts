import { describe, expect, it } from 'vitest'
import { investigationHatsuPresentation } from './hatsuPresentation'

describe('investigation Hatsu presentation', () => {
  it.each([
    ['dowsing', 'dowsing-chain'],
    ['scarlet', 'scarlet-eyes'],
    ['scout', 'little-eye'],
    ['surveillance', 'secret-window'],
    ['truth-punch', 'truth-punch'],
    ['snakes', 'silent-majority'],
  ] as const)('gives %s a dedicated animation', (kind, animation) => {
    expect(investigationHatsuPresentation(kind).animation).toBe(animation)
  })

  it('keeps an explicit fallback for future case abilities', () => {
    expect(investigationHatsuPresentation('elastic').animation).toBe('nen-pulse')
  })
})
