import { expect, it } from 'vitest'
import { beginFight, createFight, performAuraAttack, tickFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { withCombatPressure, wantsObservedGuard } from './combatPressure'
import { createFastController } from './qwen/execution'
import { moveOpponent } from './opponentMovement'
import { recoveryCounter } from './recoveryCounterAction'
import { EMPTY_INPUT } from './types'

it.each(FIGHTING_ROSTER.map((f) => f.id))(
  '%s observes pressure and guards the next string without escaping the current hitstun',
  (id) => {
    let s = beginFight(createFight('phinks', id, { mode: 'versus-local' }))
    s = { ...s, player: { ...s.player, x: 44 }, opponent: { ...s.opponent, x: 49 } }
    s = performAuraAttack({
      state: s,
      side: 'player',
      kind: 'light',
      moveId: 'phinks:standingLight',
      auraCharged: false,
    })
    s = withCombatPressure(s)
    expect(wantsObservedGuard(s.opponent, s.player)).toBe(false)
    for (let i = 0; i < 60 && !s.impact; i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    expect(s.impact?.damage).toBeGreaterThan(0)
    expect(s.opponent.hitStun).toBeGreaterThan(0)
    expect(wantsObservedGuard(s.opponent, s.player)).toBe(false)
    expect(recoveryCounter(s, 'opponent')).toBeNull()
    for (let i = 0; i < 90 && (s.player.attack || s.opponent.hitStun > 0); i++)
      s = tickFight(s, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
    s = performAuraAttack({
      state: s,
      side: 'player',
      kind: 'light',
      moveId: 'phinks:standingLight',
      auraCharged: false,
    })
    s = withCombatPressure(s)
    expect(wantsObservedGuard(s.opponent, s.player)).toBe(true)
    expect(moveOpponent(s.opponent, s.player).blocking).toBe(true)
    const response = createFastController('opponent')(s, {
      goal: 'pressure',
      nen: 'ten',
      move: 'none',
    })
    expect(response.input.guard).toBe(true)
    expect(response.command).toBeUndefined()
    expect(wantsObservedGuard({ ...s.opponent, parallelEyesClosed: true }, s.player)).toBe(false)
  },
)
