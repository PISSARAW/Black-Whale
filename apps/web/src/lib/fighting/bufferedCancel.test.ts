import { describe, expect, it } from 'vitest'
import { combatRoute } from './combatRoutes'
import { createCombatRouteFight } from './combatRouteFight'
import { performMove, tickFight } from './engine'
import { attackData } from './frameData'
import { EMPTY_INPUT, type FightState } from './types'

function step(state: FightState, guard = false) {
  return tickFight(state, EMPTY_INPUT, {
    dt: 1 / 60,
    ai: false,
    opponentInput: { ...EMPTY_INPUT, guard },
  })
}
function ready(before = 1) {
  let state = createCombatRouteFight(combatRoute('hanzo:low-precision'))
  state = { ...state, training: undefined, mode: 'versus-local' }
  state = performMove({
    state,
    side: 'player',
    action: 'heavy',
    input: { ...EMPTY_INPUT, left: true },
  })
  const startup = attackData('heavy', state.player).startup
  for (let i = 0; i < startup - before; i++) state = step(state)
  return state
}
function queue(state: FightState) {
  return performMove({
    state,
    side: 'player',
    action: 'heavy',
    input: { ...EMPTY_INPUT, right: true },
  })
}
describe('anticipated confirmed cancels', () => {
  it.each([1, 4])(
    'holds a command %i frame(s) before impact until ordinary confirmation',
    (before) => {
      let state = ready(before)
      expect(state.player.attack?.confirmedHit).toBe(false)
      state = queue(state)
      expect(state.player.bufferedAttack).toMatchObject({
        cancelFrom: 'hanzo:backHeavy',
        moveId: 'hanzo:forwardHeavy',
      })
      for (let i = 0; i < 60 && state.player.attack?.moveId !== 'hanzo:forwardHeavy'; i++)
        state = step(state)
      expect(state.player.attack?.moveId).toBe('hanzo:forwardHeavy')
      for (let i = 0; i < 30 && state.opponent.comboHits !== 2; i++) state = step(state)
      expect(state.opponent.comboHits).toBe(2)
    },
  )
  it.each(['whiff', 'block'] as const)('never releases the queued follow-up after a %s', (kind) => {
    let state = ready()
    if (kind === 'whiff') state = { ...state, opponent: { ...state.opponent, x: 88 } }
    else state = { ...state, opponent: { ...state.opponent, guardFrames: 40 } }
    state = queue(state)
    const seen = new Set<string>()
    for (let i = 0; i < 70; i++) {
      state = step(state, kind === 'block')
      if (state.player.attack?.moveId) seen.add(state.player.attack.moveId)
    }
    expect(seen.has('hanzo:forwardHeavy')).toBe(false)
    expect(state.player.bufferedAttack).toBeNull()
    expect(state.player.attack).toBeNull()
  })
})
