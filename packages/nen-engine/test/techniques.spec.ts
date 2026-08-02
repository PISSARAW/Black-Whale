import { describe, expect, it } from 'vitest'
import {
  createNenTechniqueState,
  detectWithEn,
  isAuraVisibleTo,
  nenDefenceFactor,
  transitionNen,
} from '../src/index.js'

type Zone = 'head' | 'torso' | 'arms' | 'legs'

describe('standard Nen techniques', () => {
  it('starts in Ten and Zetsu closes every aura-fed technique', () => {
    let state = createNenTechniqueState<Zone>()
    state = transitionNen(state, { type: 'GYO', on: true }).state
    state = transitionNen(state, { type: 'EN', radius: 12 }).state
    state = transitionNen(state, { type: 'SHU', objectId: 'sword', on: true }).state
    state = transitionNen(state, { type: 'ZETSU' }).state

    expect(state).toEqual({
      mode: 'zetsu',
      in: false,
      gyo: false,
      en: null,
      ken: false,
      ko: null,
      ryu: {},
      shu: [],
    })
    expect(transitionNen(state, { type: 'GYO', on: true })).toMatchObject({
      accepted: false,
      reason: 'ZETSU_HAS_NO_AURA',
    })
  })

  it('makes Ken and Ko mutually exclusive', () => {
    let state = transitionNen(createNenTechniqueState<Zone>(), { type: 'KEN', on: true }).state
    expect(state).toMatchObject({ mode: 'ren', ken: true, ko: null })
    state = transitionNen(state, { type: 'KO', zone: 'arms' }).state
    expect(state).toMatchObject({ ken: false, ko: 'arms', ryu: { arms: 1 } })
  })

  it('normalises Ryu and releases a gathered Ko', () => {
    let state = transitionNen(createNenTechniqueState<Zone>(), { type: 'KO', zone: 'head' }).state
    state = transitionNen(state, { type: 'RYU', distribution: { arms: 30, torso: 70 } }).state
    expect(state.ko).toBeNull()
    expect(state.ryu.arms).toBeCloseTo(0.3)
    expect(state.ryu.torso).toBeCloseTo(0.7)
  })

  it('tracks Shu targets without duplicates', () => {
    let state = createNenTechniqueState()
    state = transitionNen(state, { type: 'SHU', objectId: 'blade', on: true }).state
    state = transitionNen(state, { type: 'SHU', objectId: 'blade', on: true }).state
    expect(state.shu).toEqual(['blade'])
  })

  it('leaves a Zetsu user without Nen defence', () => {
    const state = transitionNen(createNenTechniqueState(), { type: 'ZETSU' }).state
    expect(nenDefenceFactor(state)).toBe(0)
  })

  it('detects bodies inside En while distinguishing a Zetsu signature', () => {
    const observer = transitionNen(createNenTechniqueState(), { type: 'EN', radius: 5 }).state
    const zetsu = transitionNen(createNenTechniqueState(), { type: 'ZETSU' }).state
    expect(
      detectWithEn(
        { at: [0, 0], nen: observer },
        [
          { id: 'near', at: [3, 0], nen: zetsu },
          { id: 'far', at: [8, 0], nen: createNenTechniqueState() },
        ],
      ),
    ).toMatchObject([{ id: 'near', distance: 3, auraSignature: false }])
  })

  it('lets only Gyo reveal aura concealed with In', () => {
    const source = transitionNen(createNenTechniqueState(), { type: 'IN', on: true }).state
    const observer = createNenTechniqueState()
    expect(isAuraVisibleTo(source, observer)).toBe(false)
    expect(
      isAuraVisibleTo(source, transitionNen(observer, { type: 'GYO', on: true }).state),
    ).toBe(true)
  })
})
