import type { FighterId, FightSide } from '$lib/fighting/types'
import { FIGHTING_ROSTER } from '$lib/fighting/roster'
import { THROW_PERFORMANCES, throwPerformanceFor } from '$lib/fighting/throws/catalogue'
import type { ThrowDemoOptions } from './preparation'

const POWER_PREPARATIONS: Partial<Record<FighterId, ThrowDemoOptions>> = {
  furykov: { console: true },
  cluck: { bird: true },
  longhi: { offer: true },
  musse: { owl: true },
  bill: { plant: true },
  halkenburg: { cohort: true },
  basho: { poem: true },
  bonolenov: { prologue: true },
  biscuit: { trueForm: true },
  sayird: { animal: true },
  terebellum: { relay: true },
  voconte: { door: true },
  yokotani: { guards: true },
}

/** The export and its checks request exactly the same native preparations. */
export function preparedThrowOptions(
  id: FighterId,
  powered: boolean,
  side: FightSide = 'player',
): ThrowDemoOptions {
  return {
    id,
    powered,
    side,
    opponentId: id === 'hisoka' ? 'kurapika' : 'hisoka',
    bleed: id === 'zakuro',
    tool: id === 'padaille' ? 'hammer' : undefined,
    threshold: id === 'voconte',
    ...(powered ? POWER_PREPARATIONS[id] : {}),
  }
}

/** Follow the production signatures, preserving the five-fighter publication batches. */
export const THROW_DEMO_CATALOGUE = FIGHTING_ROSTER.map(({ id }) => {
  const normal = throwPerformanceFor(id, false)!
  const powered = throwPerformanceFor(id, true)!
  return { id, variants: [normal.id, powered.id], order: THROW_PERFORMANCES.indexOf(normal) }
})
  .sort((left, right) => left.order - right.order)
  .map(({ id, variants }) => [id, variants] as const)
