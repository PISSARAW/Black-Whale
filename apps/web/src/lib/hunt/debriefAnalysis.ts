import type { HuntRunMetrics } from './metrics'

export type RunInsight = 'prepared' | 'informed' | 'misdirected' | 'conserved' | 'unprepared'

export function explainRun(metrics: HuntRunMetrics): RunInsight[] {
  const insights: RunInsight[] = []
  if (metrics.entravesLaid > 0) insights.push('prepared')
  if (metrics.enSweeps + metrics.hatsuUses > 1) insights.push('informed')
  if (metrics.falseTrails > 0) insights.push('misdirected')
  if (metrics.playerAuraSpent < metrics.hunterAuraSpent) insights.push('conserved')
  if (metrics.entravesLaid === 0 && metrics.hatsuUses === 0) insights.push('unprepared')
  return insights
}
