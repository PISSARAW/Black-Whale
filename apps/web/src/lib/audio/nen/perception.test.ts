import { createNenTechniqueState, type NenTechniqueState } from '@black-whale/nen-engine'
import { describe, expect, it } from 'vitest'

import { nenPerception } from './perception'

const from = (held: Partial<NenTechniqueState>): NenTechniqueState => ({
  ...createNenTechniqueState(),
  ...held,
})

describe('what the aura does to hearing', () => {
  it('leaves the world open for a body merely holding Ten', () => {
    const { veil, pressure, ring } = nenPerception(createNenTechniqueState())

    expect(veil).toBe(0)
    expect(pressure).toBeGreaterThan(0)
    expect(ring).toBe(0)
  })

  it('gives Zetsu no aura at all, and takes nothing from the ship', () => {
    expect(nenPerception(from({ mode: 'zetsu' }))).toEqual({ veil: 0, pressure: 0, ring: 0 })
  })

  it('closes the world for Gyo and leaves it open for Ren', () => {
    const gyo = nenPerception(from({ gyo: true }))
    const ren = nenPerception(from({ mode: 'ren' }))

    // The two axes are independent: Ren is the louder aura, Gyo is the quieter
    // world. Collapsing them into one intensity is the mistake this guards.
    expect(gyo.veil).toBeGreaterThan(ren.veil * 3)
    expect(ren.pressure).toBeGreaterThan(gyo.pressure)
  })

  it('keeps exploratory Gyo quiet and reserves the ring for hostile states', () => {
    expect(nenPerception(from({ gyo: true })).ring).toBe(0)
    expect(nenPerception(from({ on: true })).ring).toBeGreaterThan(0)
    expect(nenPerception(from({ mode: 'ren', ken: true })).ring).toBe(0)
  })

  it('reads En, Ken, Ko, Shu and Ryu off the state as well as the mode', () => {
    const rest = nenPerception(createNenTechniqueState())

    for (const raised of [
      { en: { radius: 4 } },
      { ken: true },
      { ko: 'hands' },
      { shu: ['a'] },
      { ryu: { hands: 1 } },
    ] as Partial<NenTechniqueState>[]) {
      expect(nenPerception(from(raised)).pressure).toBeGreaterThan(rest.pressure)
    }
  })

  it('takes the loudest claim on each axis rather than adding them up', () => {
    const both = nenPerception(from({ mode: 'ren', gyo: true }))

    expect(both.veil).toBe(nenPerception(from({ gyo: true })).veil)
    expect(both.pressure).toBe(nenPerception(from({ mode: 'ren' })).pressure)
    expect(both.veil).toBeLessThanOrEqual(1)
    expect(both.pressure).toBeLessThanOrEqual(1)
  })

  it('never asks for more than the veil can give', () => {
    const states: Partial<NenTechniqueState>[] = [
      { mode: 'ren', gyo: true, ken: true, on: true, ko: 'head', shu: ['a'], ryu: { head: 1 } },
    ]

    for (const state of states) {
      const { veil, pressure, ring } = nenPerception(from(state))
      for (const value of [veil, pressure, ring]) {
        expect(value).toBeGreaterThanOrEqual(0)
        expect(value).toBeLessThanOrEqual(1)
      }
    }
  })
})
