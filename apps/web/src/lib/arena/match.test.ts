import { describe, expect, it } from 'vitest'
import { initialCombatState } from '../combat/reducer'
import { applyArenaMatchRules, initialArenaMatchState } from './match'
import { DEFAULT_REPLAY_MATCH, type ArenaReplayMatch } from './replay/types'

const match = (overrides: Partial<ArenaReplayMatch> = {}): ArenaReplayMatch => ({
  ...DEFAULT_REPLAY_MATCH,
  ...overrides,
})

describe('Arena match referee', () => {
  it.each(['won', 'lost'] as const)('never erases an engine %s verdict', (outcome) => {
    const state = { ...initialCombatState(), outcome }
    expect(applyArenaMatchRules(state, match(), {})).toBe(state)
  })

  it('ends score and timed formats deterministically', () => {
    const base = initialCombatState()
    expect(
      applyArenaMatchRules({ ...base, player: { ...base.player, score: 3 } }, match(), {}).outcome,
    ).toBe('won')
    expect(
      applyArenaMatchRules(
        { ...base, clock: 90, player: { ...base.player, score: 1 } },
        match({ formatId: 'survival' }),
        {},
      ).outcome,
    ).toBe('won')
  })

  it('explains forced mastery by waiting for the required action', () => {
    const base = initialCombatState()
    const scored = { ...base, player: { ...base.player, score: 3 } }
    expect(applyArenaMatchRules(scored, match({ formatId: 'forced-mastery' }), {}).outcome).toBe(
      'playing',
    )
    expect(
      applyArenaMatchRules(scored, match({ formatId: 'forced-mastery' }), { RYU: 1 }).outcome,
    ).toBe('won')
  })

  it('applies the aura-tax boss rule to the shared initial state', () => {
    const setup = {
      playerAt: [0, 0] as const,
      opponentAt: [2, 0] as const,
      terrain: initialCombatState().terrain,
    }
    expect(initialArenaMatchState(setup, match({ bossRule: 'aura-tax' })).player.aura).toBe(80)
  })
})
