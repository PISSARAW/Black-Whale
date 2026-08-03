import { describe, it, expect } from 'vitest'
import { fullPool, poolOf } from '../aura'
import { ENTRAVE_COST, ENTRAVE_HOLD } from '../nen/entrave'
import { placeAura, type Ledger } from '../nen/placed'
import { chargeKo } from './ko'
import { resolveStrike } from './resolve'
import { setRyu, STRIKE_THRESHOLD } from './ryu'
import { entravesInRoom, openDuel, tickHolds } from './inherit'

function ledgerWith(rooms: string[]): Ledger {
  return rooms.reduce<Ledger>(
    (ledger, spaceId, index) =>
      placeAura(ledger, {
        id: `e${index}`,
        cost: ENTRAVE_COST,
        at: { position: [0, 0], spaceId, clock: 0 },
      }).ledger,
    { pool: fullPool(), placements: [] },
  )
}

describe('the gauges the hunt leaves — T4.2', () => {
  it('opens the duel with the reservoirs the hunt ended on, not with a fixed hundred', () => {
    const ledger: Ledger = { pool: poolOf(40), placements: [] }
    const { duel } = openDuel(ledger, { hunterPool: poolOf(30), spaceId: 'salon' })
    expect(duel.player.pool.available).toBe(40)
    expect(duel.hunter.pool.available).toBe(30)
  })

  it('opens with a hunter already broken when the hunt spent him to nothing', () => {
    const { duel } = openDuel(
      { pool: fullPool(), placements: [] },
      {
        hunterPool: poolOf(0),
        spaceId: 'salon',
      },
    )
    expect(duel.hunter.broken).toBe(true)
  })
})

describe('an entrave waiting in the room — T4.1', () => {
  it('finds the ones set in the contact room and no others', () => {
    const ledger = ledgerWith(['salon', 'cuisine'])
    expect(entravesInRoom(ledger.placements, 'salon').map((p) => p.id)).toEqual(['e0'])
    expect(entravesInRoom(ledger.placements, null)).toEqual([])
  })

  it('springs on the way in: the hunter starts the duel held', () => {
    const { duel } = openDuel(ledgerWith(['salon']), { hunterPool: fullPool(), spaceId: 'salon' })
    expect(duel.hunter.held).toBe(ENTRAVE_HOLD)
  })

  it('leaves the hunter free when the contact happens somewhere else', () => {
    const { duel } = openDuel(ledgerWith(['cuisine']), { hunterPool: fullPool(), spaceId: 'salon' })
    expect(duel.hunter.held).toBe(0)
  })

  it('spends the entrave and hands its ceiling back to the player', () => {
    const before = ledgerWith(['salon'])
    expect(before.pool).toEqual({ available: 75, committed: 25 })
    const { duel, ledger, sprung } = openDuel(before, { hunterPool: fullPool(), spaceId: 'salon' })
    expect(sprung).toHaveLength(1)
    expect(ledger.pool).toEqual({ available: 75, committed: 0 })
    expect(duel.player.pool.committed).toBe(0)
  })

  it('is felt: the first blow of the duel lands, where against an intact hunter it would not', () => {
    const prepared = openDuel(ledgerWith(['salon']), { hunterPool: fullPool(), spaceId: 'salon' })
    const bare = openDuel(
      { pool: fullPool(), placements: [] },
      {
        hunterPool: fullPool(),
        spaceId: 'salon',
      },
    )

    const strike = (state: typeof prepared.duel) => {
      const forward = setRyu(state.player, { attack: STRIKE_THRESHOLD + 0.2, guard: 'torso' })
      const guarded = { ...state, hunter: setRyu(state.hunter, { attack: 0.2, guard: 'head' }) }
      return resolveStrike({ ...guarded, player: chargeKo(forward, 'head') }, 'player').outcome
    }

    expect(strike(prepared.duel)).toBe('won')
    expect(strike(bare.duel)).toBe('playing')
  })
})

describe('the hold running down', () => {
  it('counts towards zero and stops there', () => {
    const { duel } = openDuel(ledgerWith(['salon']), { hunterPool: fullPool(), spaceId: 'salon' })
    let state = duel
    for (let tick = 0; tick < 10; tick += 1) state = tickHolds(state, 1)
    expect(state.hunter.held).toBe(0)
  })

  it('is left alone when nobody is held', () => {
    const { duel } = openDuel(
      { pool: fullPool(), placements: [] },
      {
        hunterPool: fullPool(),
        spaceId: 'salon',
      },
    )
    expect(tickHolds(duel, 1)).toBe(duel)
  })
})
