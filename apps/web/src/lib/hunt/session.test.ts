import { describe, expect, it } from 'vitest'
import { huntContractById } from './contracts/registry'
import { record } from './telemetry'
import { initialHuntState } from './state'
import { completeContract, contractIsComplete, seedForAttempt, targetForStage } from './session'
import { initialDuelState } from './duel/state'

describe('hunt page sessions', () => {
  it('uses different reproducible seeds for successive attempts', () => {
    expect(seedForAttempt(7, 0)).toBe(seedForAttempt(7, 0))
    expect(seedForAttempt(7, 1)).not.toBe(seedForAttempt(7, 0))
  })

  it('does not let a non-reach contract win by walking into the far room', () => {
    const contract = huntContractById('blackout-siege')!
    expect(targetForStage(contract, 'tubeppa', 'far-room')).toBeNull()
  })

  it('completes the blackout contract from survival and actual false trails', () => {
    const contract = huntContractById('blackout-siege')!
    let state = initialHuntState({
      playerAt: { position: [0, 0], spaceId: 'room' },
      hunterAt: { position: [10, 0], spaceId: 'other' },
      targetSpaceId: null,
    })
    state = {
      ...state,
      clock: 360,
      log: record(record([], 10, { actor: 'hunter', kind: 'lostTheTrail' }), 20, {
        actor: 'hunter',
        kind: 'lostTheTrail',
      }),
    }
    expect(contractIsComplete(contract, 'tubeppa', state)).toBe(true)
  })

  it('closes and carries a duel when a survival objective matures during contact', () => {
    const state = initialHuntState({
      playerAt: { position: [0, 0], spaceId: 'room' },
      hunterAt: { position: [1, 0], spaceId: 'room' },
      targetSpaceId: null,
    })
    const won = completeContract({
      ...state,
      duel: initialDuelState({ player: state.ledger.pool, hunter: state.hunter.pool }),
    })
    expect(won.outcome).toBe('reached')
    expect(won.duel).toBeNull()
    expect(won.log.at(-1)?.kind).toBe('duelClosed')
  })
})
