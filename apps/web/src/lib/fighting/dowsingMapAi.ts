import { dowsingMapOptions } from './dowsingMapOptions'
import { performMapDowsing } from './dowsingMap'
import type { FightState } from './types'

/** Use an actual accessible map during a quiet distant exchange, without repeated readings. */
export function dowsingMapAi(state: FightState): FightState | null {
  const actor = state.opponent
  if (actor.dowsingMapSearch || state.player.attack || Math.abs(actor.x - state.player.x) < 20)
    return null
  if (state.frame - (actor.dowsingMapReading?.frame ?? -600) < 600) return null
  const option = dowsingMapOptions(state, 'opponent').find((entry) => entry.ready)
  if (!option) return null
  const next = performMapDowsing(state, 'opponent', option.command.target)
  return next === state ? null : next
}
