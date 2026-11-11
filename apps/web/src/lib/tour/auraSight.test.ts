import {
  createNenTechniqueState,
  transitionNen,
  type NenTechniqueAction,
} from '@black-whale/nen-engine'
import { describe, expect, it } from 'vitest'
import { auraLayersFor, auraSightOf, seesConcealed } from './auraSight'

const state = (...actions: NenTechniqueAction[]) =>
  actions.reduce((nen, action) => transitionNen(nen, action).state, createNenTechniqueState())

describe('the level of sight a visitor has', () => {
  it('is only pressure before the nodes are open, Gyo or not', () => {
    expect(auraSightOf(state(), false)).toBe('pressure')
    expect(auraSightOf(state({ type: 'GYO', on: true }), false)).toBe('pressure')
  })

  it('is plain sight once awakened, and Gyo when looking hard', () => {
    expect(auraSightOf(state(), true)).toBe('sight')
    expect(auraSightOf(state({ type: 'GYO', on: true }), true)).toBe('gyo')
  })

  it('keeps sight in Zetsu: the nodes close, not the eyes', () => {
    expect(auraSightOf(state({ type: 'ZETSU' }), true)).toBe('sight')
  })
})

describe('what of a body is drawn', () => {
  const ren = state({ type: 'REN' })
  const hidden = state({ type: 'IN', on: true })

  it('draws an aura as a bend, never as light, for an unawakened visitor', () => {
    expect(auraLayersFor(ren, 'pressure')).toEqual({ light: false, felt: true, gyo: false })
  })

  it('draws it as light once awakened', () => {
    expect(auraLayersFor(ren, 'sight')).toEqual({ light: true, felt: true, gyo: false })
  })

  it('hides In from everyone but Gyo, pressure included', () => {
    expect(auraLayersFor(hidden, 'pressure').felt).toBe(false)
    expect(auraLayersFor(hidden, 'sight')).toEqual({ light: false, felt: false, gyo: false })
    expect(auraLayersFor(hidden, 'gyo')).toEqual({ light: true, felt: true, gyo: true })
  })

  it('keeps the old behaviour for a caller that does not say', () => {
    expect(auraLayersFor(ren)).toEqual(auraLayersFor(ren, 'sight'))
  })

  it('reveals concealed things only under Gyo', () => {
    expect(seesConcealed('pressure')).toBe(false)
    expect(seesConcealed('sight')).toBe(false)
    expect(seesConcealed('gyo')).toBe(true)
  })
})
