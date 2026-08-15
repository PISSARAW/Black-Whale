import { createNenTechniqueState, transitionNen } from '@black-whale/nen-engine'
import { describe, expect, it } from 'vitest'
import { canUseTourHatsu } from './hatsuMode'

describe('Tour Hatsu Nen modes', () => {
  const ten = createNenTechniqueState()
  const zetsu = transitionNen(ten, { type: 'ZETSU' }).state

  it('requires Zetsu for Parallel Future', () => {
    expect(canUseTourHatsu(ten, 'future')).toBe(false)
    expect(canUseTourHatsu(zetsu, 'future')).toBe(true)
  })

  it('keeps every ordinary Hatsu closed in Zetsu', () => {
    expect(canUseTourHatsu(ten, 'scout')).toBe(true)
    expect(canUseTourHatsu(zetsu, 'scout')).toBe(false)
  })
})
