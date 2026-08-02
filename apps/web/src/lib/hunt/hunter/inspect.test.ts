import { describe, it, expect } from 'vitest'
import { fullPool, poolOf } from '../aura'
import { ENTRAVE_COST } from '../nen/entrave'
import { markSeen, placeAura, type Ledger, type Placement } from '../nen/placed'
import { seedRng } from '../random'
import { INSPECT_COST, INSPECT_RANGE, inspectRoom, oddsOfSpotting } from './inspect'
import type { Vec2 } from '../../tour/types'

function ledgerAt(points: Vec2[], spaceId = 'salon'): Ledger {
  return points.reduce<Ledger>(
    (ledger, position, index) =>
      placeAura(ledger, {
        id: `e${index}`,
        cost: ENTRAVE_COST,
        at: { position, spaceId, clock: 0 },
      }).ledger,
    { pool: fullPool(), placements: [] },
  )
}

function inspector(over: Partial<Parameters<typeof inspectRoom>[0]> = {}) {
  return {
    position: [0, 0] as Vec2,
    spaceId: 'salon' as string | null,
    pool: fullPool(),
    rng: seedRng(1),
    ...over,
  }
}

describe('the odds of spotting one', () => {
  it('are best underfoot and nil across the room', () => {
    const near: Placement = ledgerAt([[0, 0]]).placements[0]
    const far: Placement = ledgerAt([[INSPECT_RANGE + 1, 0]]).placements[0]
    expect(oddsOfSpotting([0, 0], near)).toBeGreaterThan(0.8)
    expect(oddsOfSpotting([0, 0], far)).toBe(0)
  })

  it('fall off with distance rather than switching off', () => {
    const middling: Placement = ledgerAt([[INSPECT_RANGE / 2, 0]]).placements[0]
    const odds = oddsOfSpotting([0, 0], middling)
    expect(odds).toBeGreaterThan(0)
    expect(odds).toBeLessThan(0.6)
  })
})

describe('an inspection', () => {
  it('costs five when there is something in the room to look at', () => {
    const found = inspectRoom(inspector(), ledgerAt([[0, 0]]).placements)
    expect(found.pool.available).toBe(100 - INSPECT_COST)
  })

  it('costs nothing when the room holds none', () => {
    const looked = inspectRoom(inspector(), [])
    expect(looked.pool.available).toBe(100)
    expect(looked.found).toEqual([])
  })

  it('is refused when he cannot pay for it', () => {
    const broke = inspectRoom(inspector({ pool: poolOf(1) }), ledgerAt([[0, 0]]).placements)
    expect(broke.found).toEqual([])
    expect(broke.pool.available).toBe(1)
  })

  it('finds nothing outside the room he is standing in', () => {
    const elsewhere = ledgerAt([[0, 0]], 'cuisine')
    expect(inspectRoom(inspector(), elsewhere.placements).found).toEqual([])
  })

  it('does not look twice at one he has already spotted', () => {
    const ledger = ledgerAt([[0, 0]])
    const seen = markSeen(ledger.placements, ['e0'])
    expect(inspectRoom(inspector(), seen).found).toEqual([])
  })

  it('does not find them all — that is what makes laying them worth it', () => {
    // Four spread across the room, inspected from the doorway: over many seeds
    // he misses some and catches some, and neither number is zero.
    const ledger = ledgerAt([
      [1, 0],
      [3, 0],
      [4.5, 0],
      [5.5, 0],
    ])
    const counts = new Set<number>()
    for (let seed = 1; seed <= 40; seed += 1) {
      counts.add(inspectRoom(inspector({ rng: seedRng(seed) }), ledger.placements).found.length)
    }
    expect(Math.min(...counts)).toBeLessThan(4)
    expect(Math.max(...counts)).toBeGreaterThan(0)
  })

  it('is deterministic for a given seed', () => {
    const ledger = ledgerAt([
      [1, 0],
      [3, 0],
    ])
    const once = inspectRoom(inspector({ rng: seedRng(9) }), ledger.placements)
    const twice = inspectRoom(inspector({ rng: seedRng(9) }), ledger.placements)
    expect(once.found).toEqual(twice.found)
  })
})
