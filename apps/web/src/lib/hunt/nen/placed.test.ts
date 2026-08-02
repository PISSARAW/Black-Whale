import { describe, it, expect } from 'vitest'
import { fullPool, MAX_AURA } from '../aura'
import {
  committedIn,
  consumeAura,
  ledgerBalances,
  liveOf,
  markSeen,
  placeAura,
  recoverAura,
  type Ledger,
} from './placed'

const COST = 25

function emptyLedger(): Ledger {
  return { pool: fullPool(), placements: [] }
}

function lay(ledger: Ledger, id: string, spaceId = 'salon'): Ledger {
  return placeAura(ledger, { id, cost: COST, at: { position: [0, 0], spaceId, clock: 0 } }).ledger
}

describe('the ledger of placed aura', () => {
  it('moves aura out of the body when it is laid', () => {
    const ledger = lay(emptyLedger(), 'a')
    expect(ledger.pool).toEqual({ available: 75, committed: 25 })
    expect(liveOf(ledger.placements)).toHaveLength(1)
  })

  it('refuses to lay what the body does not hold', () => {
    let ledger = emptyLedger()
    for (const id of ['a', 'b', 'c', 'd']) ledger = lay(ledger, id)
    const overdrawn = placeAura(ledger, {
      id: 'e',
      cost: COST,
      at: { position: [0, 0], spaceId: 'salon', clock: 0 },
    })
    expect(overdrawn.placed).toBeNull()
    expect(overdrawn.ledger).toBe(ledger)
    expect(ledger.pool.available).toBe(0)
  })

  it('gives it back to the body at once when it is recovered', () => {
    const laid = lay(emptyLedger(), 'a')
    const { ledger, recovered } = recoverAura(laid, 'a')
    expect(recovered?.id).toBe('a')
    expect(ledger.pool).toEqual({ available: MAX_AURA, committed: 0 })
    expect(liveOf(ledger.placements)).toHaveLength(0)
  })

  it('spends it when it fires, and raises the ceiling', () => {
    const ledger = consumeAura(lay(emptyLedger(), 'a'), ['a'])
    expect(ledger.pool).toEqual({ available: 75, committed: 0 })
    expect(ledger.placements[0].state).toBe('sprung')
  })

  it('cannot recover the same placement twice', () => {
    const once = recoverAura(lay(emptyLedger(), 'a'), 'a').ledger
    const twice = recoverAura(once, 'a')
    expect(twice.recovered).toBeNull()
    expect(twice.ledger.pool.available).toBe(MAX_AURA)
  })

  it('cannot recover one that has already fired', () => {
    const fired = consumeAura(lay(emptyLedger(), 'a'), ['a'])
    expect(recoverAura(fired, 'a').recovered).toBeNull()
    expect(fired.pool.available).toBe(75)
  })

  it('ignores an id it does not hold', () => {
    const ledger = lay(emptyLedger(), 'a')
    expect(recoverAura(ledger, 'nope').ledger).toBe(ledger)
    expect(consumeAura(ledger, ['nope'])).toEqual(ledger)
  })
})

describe('the accounting invariant', () => {
  it('holds through every sequence of laying, firing and recovering', () => {
    let ledger = emptyLedger()
    expect(ledgerBalances(ledger)).toBe(true)

    const moves: Array<(current: Ledger) => Ledger> = [
      (current) => lay(current, 'a'),
      (current) => lay(current, 'b', 'chambre'),
      (current) => consumeAura(current, ['a']),
      (current) => lay(current, 'c'),
      (current) => recoverAura(current, 'b').ledger,
      (current) => recoverAura(current, 'a').ledger,
      (current) => lay(current, 'd', 'cuisine'),
      (current) => consumeAura(current, ['c', 'd']),
    ]

    for (const move of moves) {
      ledger = move(ledger)
      expect(ledgerBalances(ledger)).toBe(true)
      expect(ledger.pool.available).toBeGreaterThanOrEqual(0)
      expect(ledger.pool.available + ledger.pool.committed).toBeLessThanOrEqual(MAX_AURA)
    }

    expect(committedIn(ledger.placements)).toBe(0)
  })

  it('never lets the sum of the two exceed the hundred', () => {
    const laid = lay(lay(emptyLedger(), 'a'), 'b')
    const recovered = recoverAura(recoverAura(laid, 'a').ledger, 'b').ledger
    expect(recovered.pool.available).toBe(MAX_AURA)
    expect(recovered.pool.committed).toBe(0)
  })
})

describe('what the hunter has spotted', () => {
  it('marks only the ids given, and leaves the aura where it is', () => {
    const ledger = lay(lay(emptyLedger(), 'a'), 'b')
    const seen = markSeen(ledger.placements, ['a'])
    expect(seen.find((placement) => placement.id === 'a')?.seen).toBe(true)
    expect(seen.find((placement) => placement.id === 'b')?.seen).toBe(false)
    expect(committedIn(seen)).toBe(50)
  })
})
