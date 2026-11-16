import { fightAcceptsCommands } from '$lib/fighting/fightOutcome'
import type { FightState } from '$lib/fighting/types'

/** Input attempts belong to the next simulated frame; focus/reset discards them. */
export function createQueuedFightActions() {
  let pending: Array<(state: FightState) => FightState> = []
  return {
    clear() {
      pending = []
    },
    push(action: (state: FightState) => FightState) {
      pending.push(action)
    },
    flush(state: FightState): FightState {
      const actions = pending
      pending = []
      return actions.reduce(
        (next, action) => (fightAcceptsCommands(next) ? action(next) : next),
        state,
      )
    },
  }
}
