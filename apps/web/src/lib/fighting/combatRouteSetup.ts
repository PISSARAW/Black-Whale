import { performMove, tickFight } from './engine'
import { CYCLOTRON_ROTATION_FRAMES } from './phinksCyclotron'
import { EMPTY_INPUT, type FightState } from './types'

export type CombatRouteSetup = 'bungee' | 'cyclotron' | 'tracking' | 'true-form'

/** Exercise prerequisites use real commands, time and costs, then let both bodies recover. */
export function prepareCombatRoute(state: FightState, setup?: CombatRouteSetup): FightState {
  if (!setup) return state
  const input =
    setup === 'tracking'
      ? { ...EMPTY_INPUT, right: state.player.facing === 1, left: state.player.facing === -1 }
      : EMPTY_INPUT
  state = performMove({ state, side: 'player', action: 'special', input })
  if (setup === 'cyclotron') {
    for (let i = 0; i < CYCLOTRON_ROTATION_FRAMES; i++) state = step(state)
    state = performMove({ state, side: 'player', action: 'special' })
  }
  for (let i = 0; i < 180 && !settled(state); i++) state = step(state)
  return {
    ...state,
    impact: null,
    player: { ...state.player, x: 44 },
    opponent: { ...state.opponent, x: 50 },
  }
}

function step(state: FightState) {
  return tickFight(state, EMPTY_INPUT, { dt: 1 / 60, ai: false, opponentInput: EMPTY_INPUT })
}

function settled(state: FightState) {
  return (
    !state.hitstop &&
    [state.player, state.opponent].every(
      (fighter) =>
        !fighter.attack &&
        !fighter.hitStun &&
        !fighter.knockdownFrames &&
        !fighter.wakeupInvulnerableFrames,
    )
  )
}
