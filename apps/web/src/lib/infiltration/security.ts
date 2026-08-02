import type { AlertLevel } from './alerts'

export interface SecurityPolicy {
  level: AlertLevel
  checkpointSpaces: string[]
  lockedExits: string[]
  pairPatrols: boolean
  verifyDocuments: boolean
  searchLastKnown: boolean
}

export function securityPolicy(level: AlertLevel, extractionSpaceId: string, reportedSpaces: string[]): SecurityPolicy {
  const lastKnown = [...new Set(reportedSpaces.filter(Boolean))]
  return {
    level,
    checkpointSpaces: level === 'lockdown' || level === 'identified' ? [extractionSpaceId] : [],
    lockedExits: level === 'lockdown' ? [extractionSpaceId] : [],
    pairPatrols: level === 'lockdown' || level === 'identified',
    verifyDocuments: level !== 'normal',
    searchLastKnown: level === 'search' || level === 'lockdown' || level === 'identified',
  }
}
