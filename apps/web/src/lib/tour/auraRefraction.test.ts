import { describe, expect, it } from 'vitest'
import { auraGlassFor, refractionAmount } from './auraRefraction'
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

/** The same bend, worn by somebody else's body instead of filtering the frame. */
describe('the shell an aura is seen as from outside', () => {
  it('gives a body in Zetsu nothing to wear', () => {
    expect(auraGlassFor(state({ mode: 'zetsu' }))).toBeNull()
    expect(auraGlassFor(null)).toBeNull()
  })

  it('bends harder under Ren than under Ten, in the same order as the frame', () => {
    const ten = auraGlassFor(state({ mode: 'ten' }))!
    const ren = auraGlassFor(state({ mode: 'ren' }))!
    expect(ren.ior).toBeGreaterThan(ten.ior)
    expect(ren.thickness).toBeGreaterThan(ten.thickness)
  })

  /**
   * The claim this number is allowed to make. Glass is 1.5 and water is 1.33;
   * anything near either would be a statement about what aura is made of.
   */
  /**
   * The regression this file exists to prevent. three.js draws transmissive
   * meshes before transparent ones, and every mesh of a figure is transparent:
   * a shell that writes depth puts a sphere of `z` in front of a body that has
   * not been drawn yet, and the body fails the depth test everywhere. The walk
   * then bends the corridor correctly around a person who is not there.
   */
  it('never writes depth, whatever the state, or the body inside it is deleted', () => {
    for (const worn of [
      auraGlassFor(state({ mode: 'ten' })),
      auraGlassFor(state({ mode: 'ren' })),
      auraGlassFor(state({ mode: 'ren', ken: true })),
      auraGlassFor(state({ mode: 'ten', on: true, ko: 'hands' })),
    ]) {
      expect(worn!.depthWrite).toBe(false)
    }
  })

  it('never approaches an index of refraction that would read as a substance', () => {
    const hardest = auraGlassFor(state({ mode: 'ren', on: true, ko: 'torso' }))!
    expect(hardest.ior).toBeLessThan(1.2)
    expect(hardest.ior).toBeGreaterThan(1)
  })
})
