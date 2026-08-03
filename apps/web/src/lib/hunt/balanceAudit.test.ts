import { describe, expect, it } from 'vitest'
import { auditBalance } from './balanceAudit'
import type { BalanceCell } from './balanceMatrix'

const cell: BalanceCell = {
  terrain: 'tserriednich',
  hatsu: 'bungee-gum',
  hunter: 'methodical',
  runs: 5,
  winRate: 0.5,
  averageDuration: 400,
  averageAuraSpendGap: 10,
}

describe('V3 balance release gate', () => {
  it('accepts a measured cell inside every threshold', () => {
    expect(auditBalance([cell])).toEqual([])
  })

  it('names every metric that prevents promotion', () => {
    const issues = auditBalance([
      { ...cell, runs: 1, winRate: 0.95, averageDuration: 90, averageAuraSpendGap: 50 },
    ])
    expect(issues.map((issue) => issue.metric)).toEqual([
      'runs',
      'winRate',
      'duration',
      'auraSpendGap',
    ])
  })
})
