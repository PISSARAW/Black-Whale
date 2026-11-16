import {
  createNenTechniqueState,
  transitionNen,
  type NenTechniqueAction,
} from '@black-whale/nen-engine'
import { describe, expect, it } from 'vitest'
import {
  breathe,
  exhaustionActions,
  flowOf,
  pressureCost,
  refusedByReserve,
  RESERVE_MAX,
  RESERVE_TOO_LOW,
  reserveAvailability,
  RESUME_AT,
} from './auraReserve'

const state = (...actions: NenTechniqueAction[]) =>
  actions.reduce((nen, action) => transitionNen(nen, action).state, createNenTechniqueState())

describe('what each state does to the reserve', () => {
  it('rests fastest in Zetsu, keeps in Ten, spends in Ren', () => {
    expect(flowOf(state({ type: 'ZETSU' }))).toBeGreaterThan(flowOf(state()))
    expect(flowOf(state())).toBeGreaterThan(0)
    expect(flowOf(state({ type: 'REN' }))).toBeLessThan(0)
  })

  it('makes Ken dearer than Ren, and a wider En dearer than a narrow one', () => {
    expect(flowOf(state({ type: 'KEN', on: true }))).toBeLessThan(flowOf(state({ type: 'REN' })))
    expect(flowOf(state({ type: 'EN', radius: 8 }))).toBeLessThan(
      flowOf(state({ type: 'EN', radius: 2 })),
    )
  })

  it('lets a Ten carry Gyo without draining', () => {
    expect(flowOf(state({ type: 'GYO', on: true }))).toBeGreaterThanOrEqual(0)
  })

  it('charges nothing for On, which cannot be put down', () => {
    expect(flowOf(state({ type: 'ON', on: true, distribution: { hands: 1 } }))).toBe(0)
  })
})

describe('one beat', () => {
  it('never goes past the ceiling or below zero', () => {
    expect(breathe(RESERVE_MAX, state({ type: 'ZETSU' }))).toBe(RESERVE_MAX)
    expect(breathe(1, state({ type: 'KEN', on: true }))).toBe(0)
  })

  it('charges hostile Ren and On through the current defence', () => {
    expect(pressureCost(state({ type: 'ZETSU' }), 'ren')).toBe(10)
    expect(pressureCost(state({ type: 'ZETSU' }), 'on')).toBe(16)
    expect(pressureCost(state({ type: 'KEN', on: true }), 'ren')).toBe(0)
    expect(breathe(100, state({ type: 'ZETSU' }), { seconds: 1, pressure: 'ren' })).toBe(96)
  })

  it('treats Ko as weak global protection outside its concentrated zone', () => {
    const ko = state({ type: 'KO', zone: 'hands' })
    expect(pressureCost(ko, 'ren')).toBe(9)
  })
})

describe('an emptied body', () => {
  it('drops to Ten and lets go of every shaping that spends', () => {
    const heavy = state(
      { type: 'KEN', on: true },
      { type: 'EN', radius: 8 },
      { type: 'GYO', on: true },
      { type: 'IN', on: true },
    )
    const after = exhaustionActions(heavy).reduce(
      (nen, action) => transitionNen(nen, action).state,
      heavy,
    )
    expect(after.mode).toBe('ten')
    expect([after.ken, after.gyo, after.in, after.en]).toEqual([false, false, false, null])
    expect(flowOf(after)).toBeGreaterThan(0)
  })

  it('asks nothing of a body that is already refilling', () => {
    expect(exhaustionActions(state())).toEqual([])
  })
})

describe('what the reserve refuses', () => {
  it('refuses nothing above the threshold', () => {
    expect(refusedByReserve(RESUME_AT, state(), { type: 'KEN', on: true })).toBe(false)
  })

  it('refuses raising what spends below it', () => {
    expect(refusedByReserve(RESUME_AT - 1, state(), { type: 'REN' })).toBe(true)
    expect(refusedByReserve(0, state(), { type: 'EN', radius: 8 })).toBe(true)
  })

  it('always lets the body rest or let go', () => {
    const ren = state({ type: 'REN' })
    expect(refusedByReserve(0, ren, { type: 'TEN' })).toBe(false)
    expect(refusedByReserve(0, ren, { type: 'ZETSU' })).toBe(false)
  })

  it('greys out the buttons it would refuse, and only those', () => {
    const blocked = reserveAvailability(5, state())
    expect(blocked.ren).toBe(RESERVE_TOO_LOW)
    expect(blocked.ken).toBe(RESERVE_TOO_LOW)
    expect(blocked.gyo).toBeUndefined()
    expect(reserveAvailability(RESERVE_MAX, state())).toEqual({})
  })
})
