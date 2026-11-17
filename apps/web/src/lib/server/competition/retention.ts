import type { OnlineSeries } from '$lib/fighting/online/types'
import { requireCompetition } from './error'
/** Only obsolete void attempts may be trimmed; actual results and the score remain intact. */
export function trimVoidAttempts(series: OnlineSeries) {
  while (series.games.length >= 31) {
    const index = series.games.findIndex((g) => g.reason === 'restart' || g.reason === 'cancelled')
    requireCompetition(index >= 0, 'CAPACITY')
    series.games.splice(index, 1)
  }
}
