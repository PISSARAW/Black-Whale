import { describe, it, expect } from 'vitest'
import { fullPool, poolOf } from '../aura'
import { ENTRAVE_COST } from '../nen/entrave'
import { consumeAura, ledgerBalances, placeAura, type Ledger } from '../nen/placed'
import { initialDuelState, type DuelState } from './state'
import { nearestSet, recoverInDuel } from './recover'

function ledgerIn(spaceId: string): Ledger {
  return placeAura(
    { pool: fullPool(), placements: [] },
    { id: 'a', cost: ENTRAVE_COST, at: { position: [0, 0], spaceId, clock: 0 } },
  ).ledger
}

function duelIn(spaceId: string | null, available = 20): DuelState {
  return initialDuelState({
    player: poolOf(available, ENTRAVE_COST),
    hunter: fullPool(),
    spaceId,
  })
}

describe('backing into your own traps — T4.3', () => {
  it('finds one set in the room the duel is being fought in', () => {
    expect(nearestSet(ledgerIn('salon'), duelIn('salon'))).toBe('a')
    expect(nearestSet(ledgerIn('cuisine'), duelIn('salon'))).toBeNull()
  })

  it('puts the twenty-five back in the body at once', () => {
    const { duel, recovered } = recoverInDuel(ledgerIn('salon'), duelIn('salon'))
    expect(recovered).toEqual(['a'])
    expect(duel.player.pool.available).toBe(20 + ENTRAVE_COST)
    expect(duel.player.pool.committed).toBe(0)
  })

  it('keeps the ledger and the duel’s reservoir describing the same hundred', () => {
    const { duel, ledger } = recoverInDuel(ledgerIn('salon'), duelIn('salon', 75))
    expect(ledgerBalances(ledger)).toBe(true)
    expect(duel.player.pool.committed).toBe(ledger.pool.committed)
  })

  it('takes the entrave off the floor: it is not there to go off any more', () => {
    const { ledger } = recoverInDuel(ledgerIn('salon'), duelIn('salon'))
    expect(ledger.placements[0].state).toBe('recovered')
  })

  it('puts a broken Ten back up — that is what the manoeuvre is for', () => {
    const spent = duelIn('salon', 0)
    const { duel } = recoverInDuel(ledgerIn('salon'), { ...spent, player: { ...spent.player, broken: true } })
    expect(duel.player.broken).toBe(false)
    expect(duel.player.pool.available).toBe(ENTRAVE_COST)
  })

  it('does nothing when the room holds nothing of yours', () => {
    const ledger = ledgerIn('cuisine')
    const duel = duelIn('salon')
    expect(recoverInDuel(ledger, duel)).toEqual({ duel, ledger, recovered: [] })
  })

  it('does nothing with one that has already gone off', () => {
    const fired = consumeAura(ledgerIn('salon'), ['a'])
    expect(recoverInDuel(fired, duelIn('salon')).recovered).toEqual([])
  })

  it('cannot be used twice on the same entrave', () => {
    const once = recoverInDuel(ledgerIn('salon'), duelIn('salon'))
    const twice = recoverInDuel(once.ledger, once.duel)
    expect(twice.recovered).toEqual([])
    expect(twice.duel.player.pool.available).toBe(once.duel.player.pool.available)
  })
})
