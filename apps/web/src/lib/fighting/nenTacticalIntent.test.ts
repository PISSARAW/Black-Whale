import { expect, it } from 'vitest'
import { beginFight, createFight } from './engine'
import { FIGHTING_ROSTER } from './roster'
import { nenTacticalIntent, withNenTactics, personalTacticalPlan } from './nenTacticalIntent'
import { canUseMovesetMove, moveForSlot } from './movesets'
import { moveOpponent } from './opponentMovement'

it.each(FIGHTING_ROSTER.map(({ id }) => id))(
  '%s plans the same owned applications from either seat without inventing resources',
  (id) => {
    const state = beginFight(createFight(id, id, { mode: 'versus-local' }))
    state.player.aura = 100
    state.opponent.aura = 100
    const copy = structuredClone(state)
    const first = nenTacticalIntent(state, 'player'),
      second = nenTacticalIntent(state, 'opponent')
    expect(first).toEqual(second)
    expect(state).toEqual(copy)
    for (const slot of first.slots) expect(moveForSlot(id, slot)).not.toBeNull()
    const tracked = withNenTactics(state)
    expect(tracked.player.nenTactics).toEqual(first)
    const explicit = { goal: 'bait', nen: 'ten', move: 'standingLight' } as const
    expect(personalTacticalPlan(tracked, 'player', explicit)).toBe(explicit)
  },
)
it('saves enough reserve for a personal continuation, then approaches without a threshold oscillation', () => {
  let state = beginFight(createFight('machi', 'hisoka', { mode: 'versus-ai' }))
  state.player.x = 30
  state.opponent.x = 50
  state = withNenTactics(state)
  expect(state.opponent.nenTactics?.goal).toBe('recover')
  expect(moveOpponent(state.opponent, state.player).x).toBeGreaterThan(state.opponent.x)
  state = { ...state, frame: 6, opponent: { ...state.opponent, aura: 75 } }
  expect(withNenTactics(state).opponent.nenTactics?.goal).toBe('recover')
  state = { ...state, frame: 12, opponent: { ...state.opponent, aura: 90 } }
  state = withNenTactics(state)
  expect(state.opponent.nenTactics?.goal).not.toBe('recover')
  state = { ...state, frame: 18, opponent: { ...state.opponent, aura: 77 } }
  expect(withNenTactics(state).opponent.nenTactics?.goal).not.toBe('recover')
})
it('does not recover for an absent seed, animal, surface or unknown personal Hatsu', () => {
  for (const id of ['bill', 'cluck', 'sayird', 'luini', 'theta', 'beyond'] as const) {
    const state = beginFight(createFight(id, 'hisoka', { mode: 'versus-local' }))
    state.player.aura = 5
    expect(nenTacticalIntent(state, 'player').reserve, id).toBe(0)
    const move = moveForSlot(id, 'neutralSpecial')
    if (['bill', 'cluck', 'sayird', 'luini'].includes(id) && move)
      expect(canUseMovesetMove(state, 'player', move)).toBe(false)
  }
})
