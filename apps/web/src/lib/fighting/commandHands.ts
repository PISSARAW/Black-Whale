import { fightAcceptsCommands } from './fightOutcome'
import { melodyInput } from './melodyChannel'
import { plugWoundsInput } from './blinky'
import type { FightInput, FightSide, FightState } from './types'

/** Apply held hand postures before queued button attempts, as in the next controlled tick. */
export function prepareCommandHands(
  state: FightState,
  options: { side: FightSide; input?: FightInput },
): FightState {
  if (!options.input || !fightAcceptsCommands(state)) return state
  const fighter = state[options.side]
  const next = plugWoundsInput(melodyInput(fighter, options.input), options.input)
  if (
    next.coveringEars === fighter.coveringEars &&
    next.pluggingWounds === fighter.pluggingWounds &&
    next.melodyPerformance === fighter.melodyPerformance &&
    next.bufferedAttack === fighter.bufferedAttack
  )
    return state
  return { ...state, [options.side]: next }
}
