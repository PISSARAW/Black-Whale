import { describe, expect, it } from 'vitest'
import { combatRoutesFor, COMBAT_FIGHTERS } from './combatRoutes'
import { createCombatRouteFight, combatRouteAction, combatRouteInput } from './combatRouteFight'
import { setTrainingDummy } from './trainingSession'
import { performTrainingAction } from './trainingAction'
import { tickFight } from './engine'
import { EMPTY_INPUT, type FightState } from './types'

function step(state: FightState) {
  return tickFight(state, EMPTY_INPUT, {
    dt: 1 / 60,
    opponentInput: { ...EMPTY_INPUT, guard: true },
    ai: false,
  })
}
function untilContact(state: FightState, sequence = 0) {
  for (let i = 0; i < 80 && (state.impact?.sequence ?? 0) === sequence; i++) state = step(state)
  return state
}
describe.each(COMBAT_FIGHTERS)('%s pressure gives the defender a turn', (fighter) => {
  it('allows only the authored first block cancel, then ends pressure without spending Hatsu aura', () => {
    const route = combatRoutesFor(fighter)[0]
    let state = setTrainingDummy(createCombatRouteFight(route), { behavior: 'guard' })
    for (let i = 0; i < 10; i++) state = step(state)
    state = performTrainingAction({ state, side: 'player', action: 'light' })
    state = untilContact(state)
    expect(state.impact?.parried).toBe(false)
    expect(state.impact?.blocked).toBe(true)
    const heavy = route.moves[1]
    state = performTrainingAction({
      state,
      side: 'player',
      action: combatRouteAction(heavy),
      input: combatRouteInput(heavy, state.player.facing),
    })
    expect(state.player.attack?.moveId).toBe(`${fighter}:${heavy}`)
    state = untilContact(state, state.impact!.sequence)
    expect(state.impact?.blocked).toBe(true)
    const aura = state.player.aura
    const special = route.moves[2]
    const refused = performTrainingAction({
      state,
      side: 'player',
      action: 'special',
      input: combatRouteInput(special, state.player.facing),
    })
    expect(refused.commandFeedback?.player?.outcome).toBe('refused')
    expect(refused.player.aura).toBe(aura)
    expect(refused.player.attack?.moveId).toBe(`${fighter}:${heavy}`)
    for (let i = 0; i < 50 && (state.hitstop > 0 || state.opponent.blockStun > 0); i++)
      state = step(state)
    expect(state.opponent.blockStun).toBe(0)
    expect(state.player.attack).not.toBeNull()
  })
  it('lets a timed parry interrupt the attacker instead of granting a pressure cancel', () => {
    const route = combatRoutesFor(fighter)[0]
    let state = setTrainingDummy(createCombatRouteFight(route), { behavior: 'guard' })
    state = performTrainingAction({ state, side: 'player', action: 'light' })
    state = untilContact(state)
    expect(state.impact?.parried).toBe(true)
    const attempted = performTrainingAction({ state, side: 'player', action: 'heavy' })
    expect(attempted.commandFeedback?.player?.outcome).toBe('refused')
  })
  it('does not cancel a whiffed light into a heavy before recovery', () => {
    const route = combatRoutesFor(fighter)[0]
    const fresh = createCombatRouteFight(route)
    let state = { ...fresh, opponent: { ...fresh.opponent, x: 85 } }
    state = performTrainingAction({ state, side: 'player', action: 'light' })
    state = step(step(state))
    const attempted = performTrainingAction({ state, side: 'player', action: 'heavy' })
    expect(attempted.player.attack?.moveId).toBe(`${fighter}:standingLight`)
    expect(attempted.commandFeedback?.player?.outcome).toBe('refused')
  })
})
