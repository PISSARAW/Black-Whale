import type { FightState } from '../types'
import { createDeathMatchWorld } from './chrolloPlan/world'
import { DEATH_MATCH_FORMAT } from './loadout'

/**
 * Creates the hall, the crowd and the scenario of a death-match fight, from the options
 * the environment carries (so a replay rebuilds the same world).
 */
export function prepareDeathMatchWorld(state: FightState): FightState {
  if (state.formatId !== DEATH_MATCH_FORMAT) return state
  return {
    ...state,
    deathMatch: createDeathMatchWorld({ scenario: state.environment.deathMatch }),
  }
}
