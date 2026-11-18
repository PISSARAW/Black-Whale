import { BONOLENOV_THROWS } from './bonolenov'
import type { FighterId } from '../types'
import type { ThrowPerformanceId } from './types'

/** Only Bonolenov's existing pair is integrated in this release. */
export const THROW_PERFORMANCES = BONOLENOV_THROWS
export function throwPerformance(id?: ThrowPerformanceId) {
  return THROW_PERFORMANCES.find((entry) => entry.id === id)
}
export function throwPerformanceFor(id: FighterId, powered: boolean) {
  return id === 'bonolenov' ? BONOLENOV_THROWS[Number(powered)] : undefined
}
