export type AlertLevel = 'normal' | 'doubt' | 'search' | 'lockdown' | 'identified'

export interface AlertAssessment {
  level: AlertLevel
  cause: 'none' | 'weak-evidence' | 'local-report' | 'corroborated-reports' | 'confirmed-identity'
}

export function assessAlert(
  reports: { witnessId: string; certainty: number }[],
  compromised: number,
): AlertAssessment {
  if (reports.some((report) => report.certainty >= 95))
    return { level: 'identified', cause: 'confirmed-identity' }
  if (new Set(reports.map((report) => report.witnessId)).size >= 2)
    return { level: 'lockdown', cause: 'corroborated-reports' }
  if (reports.length > 0) return { level: 'search', cause: 'local-report' }
  if (compromised > 0) return { level: 'doubt', cause: 'weak-evidence' }
  return { level: 'normal', cause: 'none' }
}
