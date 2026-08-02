import { describe, it, expect } from 'vitest'
import { fullPool } from '../aura'
import { ENTRAVE_COST, ENTRAVE_HOLD, entravesUnderfoot, springEntraves, tickHold } from './entrave'
import { markSeen, placeAura, type Ledger } from './placed'

function laid(at: [number, number], spaceId = 'salon'): Ledger {
  return placeAura(
    { pool: fullPool(), placements: [] },
    { id: 'a', cost: ENTRAVE_COST, at: { position: at, spaceId, clock: 0 } },
  ).ledger
}

describe('walking into an entrave', () => {
  it('springs one at the walker’s feet', () => {
    const ledger = laid([0, 0])
    const caught = entravesUnderfoot(ledger.placements, { position: [0.5, 0], spaceId: 'salon' })
    expect(caught).toHaveLength(1)
  })

  it('is not sprung from across the room', () => {
    const ledger = laid([0, 0])
    expect(entravesUnderfoot(ledger.placements, { position: [8, 0], spaceId: 'salon' })).toEqual([])
  })

  it('is not sprung from the room next door, however close the coordinates', () => {
    const ledger = laid([0, 0])
    expect(entravesUnderfoot(ledger.placements, { position: [0, 0], spaceId: 'cuisine' })).toEqual([])
  })

  it('is stepped over once it has been spotted', () => {
    const ledger = laid([0, 0])
    const seen = markSeen(ledger.placements, ['a'])
    expect(entravesUnderfoot(seen, { position: [0, 0], spaceId: 'salon' })).toEqual([])
  })
})

describe('being held', () => {
  it('spends the aura and holds for six seconds', () => {
    const ledger = laid([0, 0])
    const caught = entravesUnderfoot(ledger.placements, { position: [0, 0], spaceId: 'salon' })
    const { ledger: after, hold } = springEntraves(ledger, caught)
    expect(hold).toBe(ENTRAVE_HOLD)
    expect(after.pool.committed).toBe(0)
    expect(after.pool.available).toBe(75)
    expect(after.placements[0].state).toBe('sprung')
  })

  it('does not stack: held is a state, not a quantity — invariant I1', () => {
    let ledger: Ledger = { pool: fullPool(), placements: [] }
    for (const id of ['a', 'b']) {
      ledger = placeAura(ledger, {
        id,
        cost: ENTRAVE_COST,
        at: { position: [0, 0], spaceId: 'salon', clock: 0 },
      }).ledger
    }
    const caught = entravesUnderfoot(ledger.placements, { position: [0, 0], spaceId: 'salon' })
    expect(caught).toHaveLength(2)
    expect(springEntraves(ledger, caught).hold).toBe(ENTRAVE_HOLD)
  })

  it('counts down and stops at zero', () => {
    expect(tickHold(2, 0.5)).toBe(1.5)
    expect(tickHold(0.2, 1)).toBe(0)
  })

  it('does nothing at all when nothing was stepped on', () => {
    const ledger = laid([0, 0])
    expect(springEntraves(ledger, [])).toEqual({ ledger, hold: 0 })
  })
})
