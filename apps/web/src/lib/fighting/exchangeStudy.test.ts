import { describe, expect, it } from 'vitest'
import {
  EXCHANGE_TRIALS,
  exchangeFighterProfile,
  recordExchangeNote,
  exchangeStudyReport,
} from './exchangeStudy'
import { beginFight, createFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { fightReplayHash } from './fightReplayHash'
import { movesetFor } from './movesets'
import { REPLAY_RULESET } from './fightReplayTypes'

describe('balance sessions compare actual character tools', () => {
  it.each(FIGHTING_ROSTER)('$name uses existing timings and personal counterplay', ({ id }) => {
    const profile = exchangeFighterProfile(id)
    const jab = movesetFor(id)!.moves.find((move) => move.slot === 'standingLight')!
    expect(profile.jab).toEqual({
      startup: jab.tuning.startup,
      reach: jab.tuning.reach,
      recovery: jab.tuning.recovery,
    })
    expect(profile.plan.every((text) => text.length > 20)).toBe(true)
    expect(profile.counter.every((text) => text.length > 20)).toBe(true)
    expect(profile.walk).toBeGreaterThan(0)
  })
  it('retains different physical speeds, reach and attack commitments', () => {
    const fast = exchangeFighterProfile('feitan')
    const ranged = exchangeFighterProfile('franklin')
    const support = exchangeFighterProfile('bill')
    expect(fast.walk).toBeGreaterThan(ranged.walk)
    expect(fast.jab.startup).toBeLessThan(ranged.jab.startup)
    expect(ranged.role).toBe('ranged')
    expect(support.role).toBe('support')
    expect(
      new Set(FIGHTING_ROSTER.map(({ id }) => JSON.stringify(exchangeFighterProfile(id).jab))).size,
    ).toBeGreaterThan(10)
  })
  it('covers seven exchange situations without changing any combat state or Nen condition', () => {
    expect(new Set(EXCHANGE_TRIALS.map((trial) => trial.id)).size).toBe(7)
    const state = beginFight(createFight('bill', 'franklin', { mode: 'training' }))
    const hash = fightReplayHash(state)
    for (const trial of EXCHANGE_TRIALS) {
      expect(trial.instructions.every((text) => text.length > 40)).toBe(true)
      const note = recordExchangeNote({
        state,
        trial: trial.id,
        observation: 'unclear',
        comment: 'À tester',
      })!
      expect(note.lastContact).toBeUndefined()
      expect(note).not.toHaveProperty('playerState')
      expect(note).not.toHaveProperty('parallelFuture')
      note.resources.player.aura = 0
      expect(state.training!.settings.resources.player.aura).not.toBe(0)
    }
    expect(fightReplayHash(state)).toBe(hash)
  })
  it('bounds notes and comments and labels them as human observations', () => {
    const state = beginFight(createFight('bill', 'franklin', { mode: 'training' }))
    const note = recordExchangeNote({
      state,
      trial: 'spacing',
      observation: 'opening',
      comment: 'a'.repeat(1200),
    })!
    const report = exchangeStudyReport(Array.from({ length: 60 }, () => note))
    expect(report).toMatchObject({ ruleset: REPLAY_RULESET, evidence: 'human-observation' })
    expect(report.notes).toHaveLength(40)
    expect(report.notes[0].comment).toHaveLength(800)
    expect(
      recordExchangeNote({ state, trial: 'unknown', observation: 'opening', comment: '' }),
    ).toBeNull()
    const pvp = { ...state, mode: 'versus-local' as const }
    expect(
      recordExchangeNote({ state: pvp, trial: 'spacing', observation: 'opening', comment: '' }),
    ).toBeNull()
  })
})
