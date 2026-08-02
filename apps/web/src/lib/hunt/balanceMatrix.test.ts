import { describe, expect, it } from 'vitest'
import { balanceCases, summarizeBalance, type BalanceSample } from './balanceMatrix'
import type { HuntRunMetrics } from './metrics'

const metrics = (outcome: HuntRunMetrics['outcome'], duration: number): HuntRunMetrics => ({
  schemaVersion: 1,
  outcome,
  duration,
  enSweeps: 0,
  hatsuUses: 0,
  entravesLaid: 0,
  entravesSprung: 0,
  inspections: 0,
  falseTrails: 0,
  roomsVisited: 0,
  playerAuraSpent: 20,
  hunterAuraSpent: 40,
  auraRecovered: 0,
  timeInZetsu: 0,
})

describe('balance matrix', () => {
  it('crosses every terrain, hatsu, hunter and seed', () => {
    const cases = balanceCases([1, 2])
    expect(cases).toHaveLength(3 * 3 * 3 * 2)
    expect(new Set(cases.map((entry) => JSON.stringify(entry))).size).toBe(cases.length)
  })

  it('summarizes comparable cells', () => {
    const base = { terrain: 'woble', hatsu: 'dowsing-chain', hunter: 'cautious' } as const
    const samples: BalanceSample[] = [
      { ...base, seed: 1, metrics: metrics('reached', 100) },
      { ...base, seed: 2, metrics: metrics('caught', 200) },
    ]
    expect(summarizeBalance(samples)[0]).toMatchObject({
      ...base,
      runs: 2,
      winRate: 0.5,
      averageDuration: 150,
      averageAuraSpendGap: 20,
    })
  })
})
