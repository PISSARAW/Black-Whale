import type { BalanceCell } from './balanceMatrix'

export interface BalanceThresholds {
  minimumRuns: number
  minimumWinRate: number
  maximumWinRate: number
  minimumDuration: number
  maximumDuration: number
  maximumAuraSpendGap: number
}

export const V3_BALANCE_THRESHOLDS: BalanceThresholds = {
  minimumRuns: 5,
  minimumWinRate: 0.25,
  maximumWinRate: 0.75,
  minimumDuration: 240,
  maximumDuration: 600,
  maximumAuraSpendGap: 30,
}

export interface BalanceIssue {
  cell: string
  metric: string
  actual: number
  expected: string
}

export function auditBalance(
  cells: readonly BalanceCell[],
  thresholds: BalanceThresholds = V3_BALANCE_THRESHOLDS,
): BalanceIssue[] {
  const issues: BalanceIssue[] = []
  for (const cell of cells) {
    const cellId = `${cell.terrain}/${cell.hatsu}/${cell.hunter}`
    // One entry per measurement, so the check itself is a single condition and
    // the table reads as the balance contract it is.
    const checks: BalanceIssue[] = [
      {
        cell: cellId,
        metric: 'runs',
        actual: cell.runs,
        expected: `>= ${thresholds.minimumRuns}`,
      },
      {
        cell: cellId,
        metric: 'winRate',
        actual: cell.winRate,
        expected: `${thresholds.minimumWinRate}..${thresholds.maximumWinRate}`,
      },
      {
        cell: cellId,
        metric: 'duration',
        actual: cell.averageDuration,
        expected: `${thresholds.minimumDuration}..${thresholds.maximumDuration}`,
      },
      {
        cell: cellId,
        metric: 'auraSpendGap',
        actual: cell.averageAuraSpendGap,
        expected: `±${thresholds.maximumAuraSpendGap}`,
      },
    ]
    const passes = [
      cell.runs >= thresholds.minimumRuns,
      cell.winRate >= thresholds.minimumWinRate && cell.winRate <= thresholds.maximumWinRate,
      cell.averageDuration >= thresholds.minimumDuration &&
        cell.averageDuration <= thresholds.maximumDuration,
      Math.abs(cell.averageAuraSpendGap) <= thresholds.maximumAuraSpendGap,
    ]
    checks.forEach((issue, index) => {
      if (!passes[index]) issues.push(issue)
    })
  }
  return issues
}
