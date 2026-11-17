export interface FightingPerformanceMeasurement {
  intervals: { count: number; min?: number; p95: number; p99: number }
  fps: number
  over25ms: number
  renderCpu: { p95: number }
  droppedSamples: number
  verified: number
  failure: string
  requiredEffectSeen: boolean
  failedScene: boolean
  scenario?: string
  predictionContexts?: number
}

export function fightingPerformanceBudget(result: FightingPerformanceMeasurement): {
  checks: Record<
    | 'samples'
    | 'cadence'
    | 'frameP95'
    | 'frameP99'
    | 'slowFrames'
    | 'renderCpu'
    | 'replay'
    | 'effect'
    | 'insetReuse'
    | 'scene',
    boolean
  >
  pass: boolean
}

export function resourceDrift(samples: readonly { geometries: number; textures: number }[]): {
  window: number
  geometries: number
  textures: number
} | null
