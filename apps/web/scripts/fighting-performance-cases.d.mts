import type { PerformanceScenario } from '../ui-tests/fighting-performance/scenario'

export interface FightingPerformanceCase extends PerformanceScenario {
  id: string
  dpr: number
}

export function fightingPerformanceCases(suite?: string): FightingPerformanceCase[]
