export type ReconstructionSubjectType =
  'BODY' | 'CONSCIOUSNESS' | 'APPEARANCE' | 'CHARACTER' | 'LOCATION' | 'EVENT'

export type ReconstructionPredicate =
  'location' | 'presence' | 'body-state' | 'consciousness-occupancy' | 'appearance' | 'identity'

export type ReconstructionPrecision = 'EXACT_ROOM' | 'ZONE' | 'TIER' | 'UNKNOWN'
export type ReconstructionCertainty = 'CONFIRMED' | 'PROBABLE' | 'LAST_KNOWN'

export type ReconstructionMethod =
  'explicit' | 'temporal-calculation' | 'last-known' | 'editorial-inference'

export interface ReconstructionSubject {
  type: ReconstructionSubjectType
  id: string
}

/**
 * A half-open narrative interval: the claim applies from `from` and stops just
 * before `until`. `until: null` means that no later canonical event has closed it.
 */
export interface ReconstructionInterval {
  from: { eventId: string; ordinal: number | null }
  until: { eventId: string; ordinal: number | null } | null
}

/**
 * One auditable assertion used to build a Reconstruction snapshot.
 *
 * `value` remains generic because location, identity and body state do not
 * share a useful scalar type. Callers narrow it through `predicate`; the
 * common envelope is what provenance, perspectives and validation consume.
 */
export interface ReconstructionClaim<Value = unknown> {
  id: string
  eventId: string
  subject: ReconstructionSubject
  predicate: ReconstructionPredicate
  value: Value
  interval: ReconstructionInterval
  precision: ReconstructionPrecision
  certainty: ReconstructionCertainty
  sourceIds: readonly string[]
  method: ReconstructionMethod
}

export type ReconstructionClaimDraft<Value = unknown> = Omit<
  ReconstructionClaim<Value>,
  'sourceIds'
> & {
  sourceIds?: readonly string[]
}

/**
 * Canonical constructor for claims. It performs only structural normalization;
 * cross-claim editorial rules belong to the REC2-D08 validator.
 */
export function defineReconstructionClaim<Value>(
  draft: ReconstructionClaimDraft<Value>,
): ReconstructionClaim<Value> {
  if (!draft.id.trim()) throw new Error('A reconstruction claim requires an id')
  if (!draft.eventId.trim()) throw new Error(`Claim ${draft.id} requires an eventId`)
  if (!draft.subject.id.trim()) throw new Error(`Claim ${draft.id} requires a subject id`)
  if (!draft.interval.from.eventId.trim()) {
    throw new Error(`Claim ${draft.id} requires an interval start event`)
  }

  return {
    ...draft,
    id: draft.id.trim(),
    eventId: draft.eventId.trim(),
    subject: { ...draft.subject, id: draft.subject.id.trim() },
    interval: {
      from: { ...draft.interval.from, eventId: draft.interval.from.eventId.trim() },
      until: draft.interval.until
        ? { ...draft.interval.until, eventId: draft.interval.until.eventId.trim() }
        : null,
    },
    sourceIds: [...new Set((draft.sourceIds ?? []).map((source) => source.trim()).filter(Boolean))],
  }
}

export function claimAppliesAt(claim: ReconstructionClaim, ordinal: number): boolean {
  const from = claim.interval.from.ordinal
  const until = claim.interval.until?.ordinal ?? null
  return (from === null || from <= ordinal) && (until === null || ordinal < until)
}
