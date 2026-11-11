import type { AlertLevel } from './alerts'
import type { Witness } from './state'

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

/** Turns declared search and pairing procedures into concrete witness assignments. */
export function applySecurityProcedures(witnesses: Witness[], policy: SecurityPolicy): Witness[] {
  if (!policy.searchLastKnown) return witnesses
  const target = [...witnesses]
    .filter((witness) => witness.belief.identity === 'intruder' && witness.belief.lastSpaceId)
    .sort((a, b) => b.belief.certainty - a.belief.certainty)[0]?.belief.lastSpaceId
  if (!target) return witnesses

  const searchers = policy.pairPatrols ? 2 : 1
  let assigned = 0
  return witnesses.map((witness) => {
    if (assigned >= searchers || witness.investigating) return witness
    assigned += 1
    return { ...witness, investigating: target }
  })
}
