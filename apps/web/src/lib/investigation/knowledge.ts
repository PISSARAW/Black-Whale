export type KnowledgeNature = 'fact' | 'testimony' | 'belief' | 'lie' | 'deduction'
export type Certainty = 'unknown' | 'possible' | 'probable' | 'established' | 'contradicted'

export interface KnowledgeClaim {
  id: string
  propositionId: string
  subjectId: string
  nature: KnowledgeNature
  supports: boolean
  confidence: number
  sourceEvidenceIds: string[]
  learnedAt: number
}

export interface PropositionState {
  propositionId: string
  certainty: Certainty
  support: number
  opposition: number
  supportingClaimIds: string[]
  opposingClaimIds: string[]
  knownBy: string[]
}

export interface KnowledgeLedger {
  claims: KnowledgeClaim[]
}

export function freshKnowledgeLedger(): KnowledgeLedger {
  return { claims: [] }
}

export function recordClaim(ledger: KnowledgeLedger, claim: KnowledgeClaim): KnowledgeLedger {
  const confidence = clampConfidence(claim.confidence)
  const normalized = {
    ...claim,
    confidence,
    sourceEvidenceIds: [...new Set(claim.sourceEvidenceIds)],
  }
  return {
    claims: [...ledger.claims.filter((item) => item.id !== claim.id), normalized].sort(
      (a, b) => a.learnedAt - b.learnedAt,
    ),
  }
}

export function propositionState(
  ledger: KnowledgeLedger,
  propositionId: string,
  viewerId?: string,
): PropositionState {
  const claims = ledger.claims.filter(
    (claim) => claim.propositionId === propositionId && (!viewerId || claim.subjectId === viewerId),
  )
  const supporting = claims.filter((claim) => claim.supports)
  const opposing = claims.filter((claim) => !claim.supports)
  const support = aggregate(supporting)
  const opposition = aggregate(opposing)

  return {
    propositionId,
    certainty: certaintyFor(support, opposition),
    support,
    opposition,
    supportingClaimIds: supporting.map((claim) => claim.id),
    opposingClaimIds: opposing.map((claim) => claim.id),
    knownBy: [...new Set(claims.map((claim) => claim.subjectId))],
  }
}

export function claimsKnownBy(ledger: KnowledgeLedger, subjectId: string): KnowledgeClaim[] {
  return ledger.claims.filter((claim) => claim.subjectId === subjectId)
}

/** One claim passing from whoever held it to whoever now says they heard it. */
export interface ClaimSharing {
  claimId: string
  recipientId: string
  learnedAt: number
}

export function shareClaim(
  ledger: KnowledgeLedger,
  { claimId, recipientId, learnedAt }: ClaimSharing,
): KnowledgeLedger {
  const source = ledger.claims.find((claim) => claim.id === claimId)
  if (!source) return ledger
  return recordClaim(ledger, {
    ...source,
    id: `${source.id}:shared:${recipientId}`,
    subjectId: recipientId,
    nature: 'testimony',
    confidence: source.confidence * 0.85,
    learnedAt,
  })
}

function aggregate(claims: KnowledgeClaim[]): number {
  return Number(
    (1 - claims.reduce((remaining, claim) => remaining * (1 - claim.confidence), 1)).toFixed(4),
  )
}

function certaintyFor(support: number, opposition: number): Certainty {
  if (support === 0 && opposition === 0) return 'unknown'
  if (support >= 0.55 && opposition >= 0.55) return 'contradicted'
  const balance = support - opposition
  if (balance >= 0.75) return 'established'
  if (balance >= 0.4) return 'probable'
  if (balance > 0) return 'possible'
  return 'contradicted'
}

function clampConfidence(value: number): number {
  if (!Number.isFinite(value)) return 0
  return Math.max(0, Math.min(1, value))
}
