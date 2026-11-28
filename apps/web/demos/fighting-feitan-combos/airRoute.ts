import type { CombatRoute } from '../../src/lib/fighting/combatRoutes'
import {
  createCombatRouteFight,
  combatRouteAction,
  combatRouteInput,
} from '../../src/lib/fighting/combatRouteFight'
import { combatRouteContacts, routeHitsBefore } from '../../src/lib/fighting/combatRouteContacts'
import { tickFight } from '../../src/lib/fighting/engine'
import { performTrainingAction } from '../../src/lib/fighting/trainingAction'
import { canStartFighterAttack } from '../../src/lib/fighting/fighterAttacks'
import { moveForSlot } from '../../src/lib/fighting/movesets'
import { EMPTY_INPUT, type FightState } from '../../src/lib/fighting/types'

const step = (state: FightState, guard: boolean, jump = false) =>
  tickFight(
    state,
    { ...EMPTY_INPUT, jump },
    { dt: 1 / 60, ai: false, opponentInput: { ...EMPTY_INPUT, guard } },
  )

/**
 * An air route starts from a descending jump. The baseline runner has no jump, so this follows
 * combatRoutes.test.ts: jump, fall for 26 frames, then the same command loop.
 */
export function recordAirRoute(route: CombatRoute): FightState[] {
  let state = createCombatRouteFight(route)
  state = {
    ...state,
    player: { ...state.player, x: 46, facing: 1 },
    opponent: { ...state.opponent, x: 50, facing: -1 },
  }
  const states = [state]
  state = step(state, false, true)
  states.push(state)
  for (let i = 0; i < 26; i++) states.push((state = step(state, false)))
  let index = 0
  let hits = 0
  let last = state.impact?.sequence ?? 0
  const total = combatRouteContacts(route).length
  for (let tick = 0; tick < 240 && hits < total; tick++) {
    state = command(route, state, { index, hits })
    if (state.player.attack?.moveId === moveForSlot(route.fighter, route.moves[index])?.id) index++
    state = step(state, hits > 0)
    states.push(state)
    if (state.impact && state.impact.sequence !== last) {
      last = state.impact.sequence
      if (state.impact.attacker === 'player') hits = state.impact.comboHits ?? hits + 1
    }
  }
  for (let i = 0; i < 60; i++) states.push((state = step(state, true)))
  return states
}

function command(route: CombatRoute, state: FightState, at: { index: number; hits: number }) {
  const slot = route.moves[at.index]
  const move = slot && moveForSlot(route.fighter, slot)
  if (!move || (at.index > 0 && at.hits !== routeHitsBefore(route, at.index))) return state
  if (state.player.attack?.moveId === move.id) return state
  if (!canStartFighterAttack(state.player, move.kind, move.id)) return state
  return performTrainingAction({
    state,
    side: 'player',
    action: combatRouteAction(slot),
    input: combatRouteInput(slot, state.player.facing),
  })
}
