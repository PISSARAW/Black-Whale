import { describe, expect, it } from 'vitest'
import { refractionAmount } from './auraRefraction'
import type { NenTechniqueState } from '@black-whale/nen-engine'

const state = (over: Partial<NenTechniqueState> = {}): NenTechniqueState => ({
  mode: 'ten',
  in: false,
  gyo: false,
  en: null,
  ken: false,
  on: false,
  ko: null,
  ryu: {},
  shu: [],
  ...over,
})

describe('how much aura is out', () => {
  it('bends nothing when there is no scene to read', () => {
    expect(refractionAmount(null)).toBe(0)
  })

  it('bends nothing in Zetsu: the aura is in, so the air is still', () => {
    expect(refractionAmount(state({ mode: 'zetsu' }))).toBe(0)
  })

  it('barely bends under Ten, and clearly bends under Ren', () => {
    const ten = refractionAmount(state({ mode: 'ten' }))
    const ren = refractionAmount(state({ mode: 'ren' }))
    expect(ten).toBeGreaterThan(0)
    expect(ren).toBeGreaterThan(ten * 2)
  })

  it('bends like Ren under On, which is a Ren that cannot be put down', () => {
    expect(refractionAmount(state({ mode: 'ten', on: true }))).toBe(
      refractionAmount(state({ mode: 'ren' })),
    )
  })

  it('bends harder under Ko than under Ren: the same aura in one place', () => {
    expect(refractionAmount(state({ mode: 'ren', ko: 'hands' }))).toBeGreaterThan(
      refractionAmount(state({ mode: 'ren' })),
    )
  })

  it('adds nothing for En, which makes aura aware rather than large', () => {
    // The one result worth pinning: En is a radius the walker perceives through,
    // not an output, and bending the room for it would be the effect claiming
    // something about the technique that the technique does not say.
    expect(refractionAmount(state({ mode: 'ren', en: { radius: 30 } }))).toBe(
      refractionAmount(state({ mode: 'ren' })),
    )
  })

  it('never asks the shader for more than the full span', () => {
    expect(refractionAmount(state({ mode: 'ren', on: true, ko: 'torso' }))).toBeLessThanOrEqual(1)
  })
})
