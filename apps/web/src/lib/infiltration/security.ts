import type { AlertLevel } from './alerts'

export interface SecurityPolicy {
  level: AlertLevel
  checkpointSpaces: string[]
  lockedExits: string[]
  pairPatrols: boolean
  verifyDocuments: boolean
  searchLastKnown: boolean
}

/**
 * The procedures in force at a given alert level.
 *
 * It used to take the spaces witnesses last reported, and never read them:
 * `searchLastKnown` says *that* the guards will sweep the last known
 * positions, not which they are — those live on the witnesses. The parameter
 * was kept alive only by a `lastKnown` local that nothing returned.
 */
export function securityPolicy(level: AlertLevel, extractionSpaceId: string): SecurityPolicy {
  return {
    level,
    checkpointSpaces: level === 'lockdown' || level === 'identified' ? [extractionSpaceId] : [],
    lockedExits: level === 'lockdown' ? [extractionSpaceId] : [],
    pairPatrols: level === 'lockdown' || level === 'identified',
    verifyDocuments: level !== 'normal',
    searchLastKnown: level === 'search' || level === 'lockdown' || level === 'identified',
  }
}
