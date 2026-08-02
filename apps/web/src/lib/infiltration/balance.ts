import type { InfiltrationState } from './state'

export type RunStyle = 'ghost' | 'operator' | 'exposed'

export interface BalanceReading {
  style: RunStyle
  pressure: number
  informationEfficiency: number
  flags: string[]
}

export function evaluateRun(state: InfiltrationState): BalanceReading {
  const metrics = state.metrics
  const pressure = Math.round(
    (metrics.maxAlert + metrics.challenges * 12 + metrics.tracesDiscovered * 8) / 3,
  )
  const information = Number(state.documentCopied) + Number(state.authorConfirmed)
  const informationEfficiency = information / Math.max(1, metrics.hatsuCasts + state.traces.length)
  const style: RunStyle =
    metrics.maxAlert < 20 && metrics.tracesDiscovered === 0
      ? 'ghost'
      : metrics.maxAlert < 70
        ? 'operator'
        : 'exposed'
  const flags = [
    ...(state.hatsu.uses === 0 && !state.documentCopied ? ['hatsu-spent-without-objective'] : []),
    ...(metrics.challenges > 2 ? ['too-many-checks'] : []),
    ...(state.documentCopied && metrics.maxAlert === 0 ? ['route-too-safe'] : []),
  ]
  return { style, pressure, informationEfficiency, flags }
}
