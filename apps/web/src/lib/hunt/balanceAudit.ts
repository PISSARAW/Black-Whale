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

export interface BalanceIssue { cell: string; metric: string; actual: number; expected: string }

export function auditBalance(
  cells: readonly BalanceCell[],
  thresholds: BalanceThresholds = V3_BALANCE_THRESHOLDS,
): BalanceIssue[] {
  const issues: BalanceIssue[] = []
  for (const cell of cells) {
    const id = `${cell.terrain}/${cell.hatsu}/${cell.hunter}`
    check(issues, id, 'runs', cell.runs, cell.runs >= thresholds.minimumRuns, `>= ${thresholds.minimumRuns}`)
    check(issues, id, 'winRate', cell.winRate, cell.winRate >= thresholds.minimumWinRate && cell.winRate <= thresholds.maximumWinRate, `${thresholds.minimumWinRate}..${thresholds.maximumWinRate}`)
    check(issues, id, 'duration', cell.averageDuration, cell.averageDuration >= thresholds.minimumDuration && cell.averageDuration <= thresholds.maximumDuration, `${thresholds.minimumDuration}..${thresholds.maximumDuration}`)
    check(issues, id, 'auraSpendGap', cell.averageAuraSpendGap, Math.abs(cell.averageAuraSpendGap) <= thresholds.maximumAuraSpendGap, `±${thresholds.maximumAuraSpendGap}`)
  }
  return issues
}

function check(
  issues: BalanceIssue[], cell: string, metric: string, actual: number, passes: boolean, expected: string,
) {
  if (!passes) issues.push({ cell, metric, actual, expected })
}
