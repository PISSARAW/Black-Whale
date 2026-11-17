import { writable } from 'svelte/store'
import type { FightState } from './types'
import type { ReplayCommand } from './fightReplayTypes'
import type { FightMatchRuntime } from './fightMatchRuntime'

type PausedAction = (state: FightState) => FightState
type Planned = { action: PausedAction } | { command: ReplayCommand }

/** Menu actions wait for a real simulation tick, including their usual preconditions. */
export function createFightPausePlan() {
  const count = writable(0)
  let pending: Planned[] = []
  function add(next: Planned) {
    if (pending.length >= 16) return
    pending.push(next)
    count.set(pending.length)
  }
  function clear() {
    pending = []
    count.set(0)
  }
  return {
    subscribe: count.subscribe,
    action: (action: PausedAction) => add({ action }),
    command: (command: ReplayCommand) => add({ command }),
    clear,
    flush(options: { match: FightMatchRuntime; state: FightState }) {
      const planned = pending
      clear()
      for (const item of planned) {
        if ('action' in item) options.match.queue(item.action)
        else options.match.enqueue(options.state, item.command)
      }
    },
  }
}
export type FightPausePlan = ReturnType<typeof createFightPausePlan>
