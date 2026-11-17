import { tickTeamFight } from '../teamMatch'
import { settleTeamBodyOutcome } from '../teamOutcome'
import { FIXED_STEP } from '../fightClock'
import type { FightInput, FightSide, FightState } from '../types'
type Action = (state: FightState) => FightState
type Pending = { owners: string; apply: Action }
const owners = (state: FightState) => `${state.player.id}:${state.opponent.id}:${state.roundNumber}`
export function createTeamRuntime() {
  let pending: Pending[] = []
  function clear() {
    pending = []
  }
  function flush(state: FightState) {
    const commands = pending
    clear()
    for (const command of commands) {
      if (state.phase !== 'fighting') break
      if (command.owners === owners(state)) state = command.apply(state)
    }
    return settleTeamBodyOutcome(state)
  }
  return {
    clear,
    queue(state: FightState, apply: Action) {
      if (state.teamMatch && state.phase === 'fighting' && pending.length < 64)
        pending.push({ owners: owners(state), apply })
    },
    advance(state: FightState, inputs: Record<FightSide, FightInput>, dt: number) {
      if (!state.teamMatch || state.phase !== 'fighting') {
        clear()
        return state
      }
      if (!Number.isFinite(dt) || dt <= 0) return state
      let budget = state.frameAccumulator + Math.min(0.05, dt),
        next = state
      while (budget + 1e-9 >= FIXED_STEP && next.phase === 'fighting') {
        next = flush(next)
        next = tickTeamFight({ ...next, frameAccumulator: 0 }, inputs, FIXED_STEP)
        budget = Math.max(0, budget - FIXED_STEP)
      }
      return { ...next, frameAccumulator: budget < 1e-9 ? 0 : budget }
    },
  }
}
