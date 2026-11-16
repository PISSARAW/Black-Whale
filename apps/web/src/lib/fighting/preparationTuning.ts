import type { FighterId } from './types'

/** Local balancing values, not quantities supplied by the manga. */
export const PREPARED_COSTS: Partial<Record<FighterId, number>> = {
  sayird: 2,
  cluck: 5,
  bill: 20,
  luini: 20,
}
