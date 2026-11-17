import type { FighterId } from './types'

/** Shared-will preparation in simulated frames; a duel tuning value. */
export const COHORT_WILL_FRAMES = 480

/** Local balancing values, not quantities supplied by the manga. */
export const PREPARED_COSTS: Partial<Record<FighterId, number>> = {
  sayird: 2,
  cluck: 5,
  bill: 20,
  luini: 20,
}
