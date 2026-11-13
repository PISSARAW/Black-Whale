import {
  createNenTechniqueState,
  transitionNen,
  type NenTechniqueAction,
} from '@black-whale/nen-engine'
import { describe, expect, it } from 'vitest'
import { pressureThroughShu, touchForce, touchKind } from './auraTouch'

const state = (...actions: NenTechniqueAction[]) =>
  actions.reduce((nen, action) => transitionNen(nen, action).state, createNenTechniqueState())

/** The distribution the walk imposes with On, from the key and the button. */
const ON = { type: 'ON', on: true, distribution: { hands: 0.45, torso: 0.35, feet: 0.2 } } as const

describe('what a touch of aura does to a solid', () => {
  it('pushes hardest under On, even though On weights the hands and feet', () => {
    const on = state(ON)
    expect(touchKind(on)).toBe('pressure')
    expect(touchForce('pressure', on)).toBeGreaterThan(touchForce('strike', on))
  })

  it('strikes with Ko, or with a distribution weighted to hands and feet', () => {
    expect(touchKind(state({ type: 'KO', zone: 'hands' }))).toBe('strike')
    expect(
      touchKind(state({ type: 'RYU', distribution: { hands: 0.5, feet: 0.2, torso: 0.3 } })),
    ).toBe('strike')
  })

  it('presses under Ren, senses under Gyo or En, channels in Ten', () => {
    expect(touchKind(state({ type: 'REN' }))).toBe('pressure')
    expect(touchKind(state({ type: 'GYO', on: true }))).toBe('sense')
    expect(touchKind(state({ type: 'EN', radius: 8 }))).toBe('sense')
    expect(touchKind(state())).toBe('channel')
  })

  it('keeps an ordinary Ren push lighter than an On push', () => {
    expect(touchForce('pressure', state({ type: 'REN' }))).toBeLessThan(
      touchForce('pressure', state(ON)),
    )
  })

  it('makes a Shu-wrapped solid transmit 1.75× force and take only 40%', () => {
    const ren = state({ type: 'REN' })
    expect(touchForce('pressure', ren, true)).toBeCloseTo(touchForce('pressure', ren) * 1.75)
    expect(pressureThroughShu(10, true)).toBe(4)
  })
})
