import { describe, expect, it } from 'vitest'
import { initialHuntState, resolveArenaDuel } from './state'
import { initialDuelState } from './duel/state'
import { huntArenaHandoff } from './arenaBridge'
import type { ArenaHandoffResult } from '../arena/bridge'

function hunting() {
  const state = initialHuntState({
    playerAt: { position: [0, 0], spaceId: 'a' },
    hunterAt: { position: [1, 0], spaceId: 'a' },
    targetSpaceId: 'b',
  })
  return {
    ...state,
    outcome: 'contact' as const,
    duel: initialDuelState({
      player: { available: 41, committed: 25 },
      hunter: { available: 67, committed: 0 },
      spaceId: 'a',
    }),
  }
}

describe('Hunt → Arena handoff', () => {
  it('carries the live duel reservoirs and a safe return route', () => {
    expect(huntArenaHandoff(hunting(), 'contact-1', '/fr/hunt')).toMatchObject({
      id: 'contact-1',
      sourceMode: 'HUNT',
      context: 'CLANDESTINE',
      playerAura: 41,
      opponentAura: 67,
      returnHref: '/fr/hunt',
    })
  })

  it('does not open Arena outside an active duel', () => {
    expect(huntArenaHandoff({ ...hunting(), duel: null }, 'contact-1', '/hunt')).toBeNull()
  })

  it('returns a win to Hunt without regenerating aura committed to traps', () => {
    const resolved = resolveArenaDuel(hunting(), result({ outcome: 'won', playerAura: 90 }), 600)

    expect(resolved.duel).toBeNull()
    expect(resolved.outcome).toBe('eliminated')
    expect(resolved.ledger.pool).toEqual({ available: 75, committed: 25 })
    expect(resolved.clock).toBe(12)
    expect(resolved.log.at(-1)?.kind).toBe('duelClosed')
  })

  it('returns a loss as caught with the same deterministic wound as a local duel', () => {
    const resolved = resolveArenaDuel(hunting(), result({ outcome: 'lost' }), 600)

    expect(resolved.outcome).toBe('caught')
    expect(resolved.advancedNen.wounds).toHaveLength(1)
  })

  it('keeps the Hunt deadline authoritative over an Arena verdict', () => {
    const resolved = resolveArenaDuel(
      { ...hunting(), clock: 595 },
      result({ outcome: 'won', elapsedSeconds: 12 }),
      600,
    )

    expect(resolved.outcome).toBe('timeUp')
  })
})

function result(over: Partial<ArenaHandoffResult> = {}): ArenaHandoffResult {
  return {
    version: 1,
    handoffId: 'contact-1',
    outcome: 'won',
    playerAura: 32,
    opponentAura: 0,
    playerCondition: 'ready',
    opponentCondition: 'ko',
    revealedHatsuIds: [],
    nenEffects: [],
    intervention: false,
    elapsedSeconds: 12,
    ...over,
  }
}
