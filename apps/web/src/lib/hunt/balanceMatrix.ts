import { HUNT_TERRAINS, type HuntTerrainId } from './arena'
import {
  BUNGEE_GUM_HUNT,
  DOWSING_CHAIN_HUNT,
  PARALLEL_FUTURE_HUNT,
  type HuntHatsuId,
} from './hatsu'
import { HUNTER_PROFILES, type HunterProfileId } from './hunter/profiles'
import type { HuntRunMetrics } from './metrics'

export interface BalanceCase {
  terrain: HuntTerrainId
  hatsu: HuntHatsuId
  hunter: HunterProfileId
  seed: number
}

export interface BalanceSample extends BalanceCase {
  metrics: HuntRunMetrics
}

export interface BalanceCell {
  terrain: HuntTerrainId
  hatsu: HuntHatsuId
  hunter: HunterProfileId
  runs: number
  winRate: number
  averageDuration: number
  averageAuraSpendGap: number
}

export function balanceCases(seeds: readonly number[]): BalanceCase[] {
  const hatsuProfiles = [BUNGEE_GUM_HUNT, PARALLEL_FUTURE_HUNT, DOWSING_CHAIN_HUNT]
  return HUNT_TERRAINS.flatMap((terrain) =>
    hatsuProfiles.flatMap((hatsu) =>
      HUNTER_PROFILES.flatMap((hunter) =>
        seeds.map((seed) => ({ terrain: terrain.id, hatsu: hatsu.id, hunter: hunter.id, seed })),
      ),
    ),
  )
}

export function summarizeBalance(samples: readonly BalanceSample[]): BalanceCell[] {
  const groups = new Map<string, BalanceSample[]>()
  for (const sample of samples) {
    const key = `${sample.terrain}|${sample.hatsu}|${sample.hunter}`
    groups.set(key, [...(groups.get(key) ?? []), sample])
  }
  return [...groups.values()].map((runs) => ({
    terrain: runs[0].terrain,
    hatsu: runs[0].hatsu,
    hunter: runs[0].hunter,
    runs: runs.length,
    winRate: average(runs.map((run) => (won(run.metrics.outcome) ? 1 : 0))),
    averageDuration: average(runs.map((run) => run.metrics.duration)),
    averageAuraSpendGap: average(
      runs.map((run) => run.metrics.hunterAuraSpent - run.metrics.playerAuraSpent),
    ),
  }))
}

function average(values: number[]): number {
  return values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length
}

function won(outcome: HuntRunMetrics['outcome']): boolean {
  return outcome === 'reached' || outcome === 'eliminated'
}
