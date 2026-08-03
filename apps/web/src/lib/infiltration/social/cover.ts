export type CoverRole = 'maintenance' | 'security' | 'service' | 'messenger'
export interface CoverProfile {
  role: CoverRole
  superior: string
  assignment: string
  allowedSpaces: string[]
  evidence: ('work-order' | 'badge' | 'schedule')[]
  obligations: string[]
}

export interface CoverClaimV3 {
  subject: 'role' | 'superior' | 'assignment' | 'destination'
  value: string
  at: number
}

export function evaluateCover(profile: CoverProfile, spaceId: string, claims: CoverClaimV3[]) {
  const contradictions = claims.filter((claim, index) =>
    claims.some(
      (other, otherIndex) =>
        otherIndex < index && other.subject === claim.subject && other.value !== claim.value,
    ),
  )
  const permitted = profile.allowedSpaces.includes(spaceId)
  const supported = claims.every(
    (claim) => claim.subject !== 'role' || claim.value === profile.role,
  )
  return {
    permitted,
    supported,
    contradictions,
    credible: permitted && supported && contradictions.length === 0,
  }
}

export function coverObligation(profile: CoverProfile, spaceId: string): string | null {
  return profile.allowedSpaces.includes(spaceId) ? (profile.obligations[0] ?? null) : null
}
