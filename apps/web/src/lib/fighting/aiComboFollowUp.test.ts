import { describe, expect, it } from 'vitest'
import { AI_CONFIRM_RATE, aiComboFollowUp } from './aiComboFollowUp'
import { cancelGrammarFor } from './duelComboProfiles'
import { beginFight, createFight, performMove, tickFight } from './engine'
import { FIXED_STEP } from './fightClock'
import { moveById } from './movesets'
import { EMPTY_INPUT, type FightState, type FighterId } from './types'

/** First RNG state whose next roll satisfies `accept` (the AI rolls once per contact). */
function seedWhere(accept: (chance: number) => boolean): number {
  for (let seed = 1; seed < 100_000; seed++) {
    const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0
    if (accept(next / 0x100000000)) return seed
  }
  throw new Error('No seed')
}

/** The AI (opponent side) lands or gets blocked by its jab, right after hitstop. */
function confirmed(fighter: FighterId, options: { blocked: boolean; seed: number }): FightState {
  let state = beginFight(createFight('bill', fighter, { mode: 'versus-ai' }))
  state = {
    ...state,
    rng: options.seed,
    player: { ...state.player, x: 44, facing: 1 },
    opponent: { ...state.opponent, x: 49, facing: -1 },
  }
  const guard = { ...EMPTY_INPUT, guard: options.blocked }
  for (let i = 0; i < 20; i++)
    state = tickFight(state, guard, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT, ai: false })
  state = performMove({ state, side: 'opponent', action: 'light', input: EMPTY_INPUT })
  for (let i = 0; i < 40; i++) {
    const attack = state.opponent.attack
    if (attack && (attack.confirmedHit || attack.confirmedBlock) && state.hitstop === 0) break
    state = tickFight(state, guard, { dt: FIXED_STEP, opponentInput: EMPTY_INPUT, ai: false })
  }
  return { ...state, rng: options.seed }
}

const slot = (state: FightState) => state.opponent.attack?.moveId?.split(':')[1]

describe('AI combo follow-up', () => {
  it.each(['kurapika', 'hisoka', 'machi'] as const)(
    '%s confirms a hit with an authorized cancel',
    (fighter) => {
      const state = confirmed(fighter, { blocked: false, seed: seedWhere((c) => c < 0.1) })
      expect(state.opponent.attack?.confirmedHit).toBe(true)
      const jab = moveById(state.opponent.attack!.moveId)!
      const next = aiComboFollowUp(state)!
      expect(slot(next)).not.toBe('standingLight')
      expect(jab.cancelInto).toContain(next.opponent.attack!.moveId)
      expect(aiComboFollowUp(next)).toBeNull()
    },
  )

  it('drops the combo when its confirmation roll fails, without a second roll', () => {
    const seed = seedWhere((chance) => chance >= AI_CONFIRM_RATE)
    const state = confirmed('kurapika', { blocked: false, seed })
    const dropped = aiComboFollowUp(state)!
    expect(slot(dropped)).toBe('standingLight')
    expect(dropped.opponent.attack?.aiFollowUpRolled).toBe(true)
    expect(aiComboFollowUp(dropped)).toBeNull()
  })

  it.each(['kurapika', 'benjamin', 'feitan', 'machi'] as const)(
    '%s never spends an ender or a paid technique on block, whatever the roll',
    (fighter) => {
      const grammar = cancelGrammarFor(fighter)!
      for (const seed of [seedWhere((c) => c < 0.05), seedWhere((c) => c > 0.95)]) {
        const state = confirmed(fighter, { blocked: true, seed })
        expect(state.opponent.attack?.confirmedBlock).toBe(true)
        const next = aiComboFollowUp(state)!
        const chosen = slot(next) as never
        expect(grammar.specials).not.toContain(chosen)
        expect(grammar.supers).not.toContain(chosen)
      }
    },
  )

  it('leaves fighters outside the grammar to the ordinary cadence', () => {
    const state = confirmed('phinks', { blocked: false, seed: seedWhere((c) => c < 0.1) })
    expect(aiComboFollowUp(state)).toBeNull()
  })

  it('lands real multi-hit combos in a versus-AI match against an idle player', () => {
    let best = 0
    for (const fighter of ['kurapika', 'feitan', 'hisoka'] as const) {
      let state = beginFight(createFight('bill', fighter, { mode: 'versus-ai' }))
      state = {
        ...state,
        player: { ...state.player, x: 44 },
        opponent: { ...state.opponent, x: 50 },
      }
      for (let i = 0; i < 900 && state.phase === 'fighting'; i++) {
        state = tickFight(state, EMPTY_INPUT, { dt: FIXED_STEP, ai: true })
        best = Math.max(best, state.player.comboHits)
      }
    }
    expect(best).toBeGreaterThanOrEqual(3)
  })
})
