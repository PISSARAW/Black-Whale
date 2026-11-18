import { describe, expect, it } from 'vitest'
import { get } from 'svelte/store'
import { createFightPausePlan } from './fightPausePlan'
import { createFightMatchRuntime } from './fightMatchRuntime'
import { createFightState } from './fightState'
import { EMPTY_INPUT } from './types'
import { FIXED_STEP } from './fightClock'

describe('pause menu action planning', () => {
  it('keeps actions frozen until resuming, and journals them on the ordinary match tick', () => {
    const plan = createFightPausePlan()
    const match = createFightMatchRuntime()
    const state = {
      ...createFightState('kurapika', 'hisoka', { mode: 'versus-local' }),
      phase: 'fighting' as const,
    }
    match.begin(state)
    plan.action((current) => ({ ...current, score: { ...current.score, player: 7 } }))
    expect(get(plan)).toBe(1)
    expect(state.score.player).toBe(0)
    expect(state.frame).toBe(0)
    plan.flush({ match, state })
    expect(get(plan)).toBe(0)
    expect(state.score.player).toBe(0)
    const after = match.advance(state, EMPTY_INPUT, { dt: FIXED_STEP })
    expect(after.frame).toBe(1)
    expect(after.score.player).toBe(7)
  })

  it('keeps configuration actions in order, flushes once and bounds repeated menu clicks', () => {
    const plan = createFightPausePlan()
    const match = createFightMatchRuntime()
    const state = {
      ...createFightState('kurapika', 'hisoka', { mode: 'versus-local' }),
      phase: 'fighting' as const,
    }
    match.begin(state)
    for (let i = 0; i < 25; i++)
      plan.action((current) => ({
        ...current,
        score: { ...current.score, player: current.score.player + 1 },
      }))
    expect(get(plan)).toBe(16)
    plan.flush({ match, state })
    plan.flush({ match, state })
    expect(match.advance(state, EMPTY_INPUT, { dt: FIXED_STEP }).score.player).toBe(16)
  })

  it('discards plans when leaving or restarting a match', () => {
    const plan = createFightPausePlan()
    plan.command({ kind: 'emperor', side: 'player' })
    plan.clear()
    expect(get(plan)).toBe(0)
  })
})
