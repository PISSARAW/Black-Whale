import { machiReattachmentOptions } from './machiReattachment'
import { arsenalOptions, performArsenalCommand } from './retrospectiveArsenal'
import type { FightState } from './types'

/** A patient must actually consent, relax their aura and bring their own severed limb. */
export function machiReattachmentAi(state: FightState): FightState {
  const options =
    state.opponent.dolphinLoan?.held.source === 'machi'
      ? arsenalOptions(state, 'opponent').filter(
          (entry) => entry.command.action === 'machi-reattach',
        )
      : machiReattachmentOptions(state, 'opponent')
  const option = options.find((entry) => entry.ready)
  return option ? performArsenalCommand(state, 'opponent', option.command) : state
}
