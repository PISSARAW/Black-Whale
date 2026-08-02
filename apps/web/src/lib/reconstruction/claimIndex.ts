import {
  defineReconstructionClaim,
  type ReconstructionCertainty,
  type ReconstructionClaim,
  type ReconstructionMethod,
  type ReconstructionPrecision,
  type ReconstructionSubjectType,
} from './claims'

interface EventBoundary {
  id: string
  ordinal: number | null
}

export interface PresenceClaimRow {
  id: string
  entityId: string
  locationId: string | null
  precision: ReconstructionPrecision
  certainty: ReconstructionCertainty
  sources: readonly { id: string }[]
  fromEvent: EventBoundary
  untilEvent: EventBoundary | null
}

interface WorldEventRow {
  id: string
  type: string
  ordinal: number
  sourceIds: readonly string[]
  payload: unknown
}

export interface ReconstructionClaimIndex {
  claims: ReconstructionClaim[]
  byEvent: Record<string, ReconstructionClaim[]>
}

export function claimFromPresence(row: PresenceClaimRow): ReconstructionClaim {
  return defineReconstructionClaim({
    id: `presence:${row.id}`,
    eventId: row.fromEvent.id,
    subject: { type: 'BODY', id: row.entityId },
    predicate: 'location',
    value: { locationId: row.locationId },
    interval: {
      from: eventBoundary(row.fromEvent),
      until: row.untilEvent ? eventBoundary(row.untilEvent) : null,
    },
    precision: row.precision,
    certainty: row.certainty,
    sourceIds: row.sources.map((source) => source.id),
    method: methodFor(row.certainty),
  })
}

export function claimsFromWorldEvent(row: WorldEventRow): ReconstructionClaim[] {
  const payload = asRecord(row.payload)
  if (!payload) return []
  if (row.type === 'ENTITY_MOVED') return movedClaims(row, payload)
  if (row.type === 'BODY_STATE_CHANGED') {
    const bodyId = stringValue(payload['bodyId'])
    const state = stringValue(payload['state'])
    return bodyId && state
      ? [
          transitionClaim(row, {
            type: 'BODY',
            subjectId: bodyId,
            predicate: 'body-state',
            value: state,
          }),
        ]
      : []
  }
  if (row.type === 'CONSCIOUSNESS_TRANSFERRED') {
    const consciousnessId = stringValue(payload['consciousnessId'])
    const toBodyId = stringValue(payload['toBodyId'])
    return consciousnessId && toBodyId
      ? [
          transitionClaim(row, {
            type: 'CONSCIOUSNESS',
            subjectId: consciousnessId,
            predicate: 'consciousness-occupancy',
            value: { bodyId: toBodyId },
          }),
        ]
      : []
  }
  return []
}

export function buildReconstructionClaimIndex(
  presences: readonly PresenceClaimRow[],
  worldEvents: readonly WorldEventRow[],
): ReconstructionClaimIndex {
  const claims = [...presences.map(claimFromPresence), ...worldEvents.flatMap(claimsFromWorldEvent)]
  const byEvent: Record<string, ReconstructionClaim[]> = {}
  for (const claim of claims) (byEvent[claim.eventId] ??= []).push(claim)
  return { claims, byEvent }
}

function movedClaims(row: WorldEventRow, payload: Record<string, unknown>): ReconstructionClaim[] {
  const presence = asRecord(payload['presence'])
  const entity = asRecord(presence?.['entity'])
  const entityId = stringValue(entity?.['id'])
  if (!presence || !entityId) return []
  const precision = precisionValue(presence['precision'])
  const certainty = certaintyValue(presence['certainty'])
  return [
    defineReconstructionClaim({
      id: `world:${row.id}:location:${entityId}`,
      eventId: row.id,
      subject: { type: subjectType(entity?.['kind']), id: entityId },
      predicate: 'location',
      value: { locationId: stringValue(presence['locationId']) },
      interval: { from: { eventId: row.id, ordinal: row.ordinal }, until: null },
      precision,
      certainty,
      sourceIds: row.sourceIds,
      method: methodFor(certainty),
    }),
  ]
}

interface TransitionDraft<Value> {
  type: ReconstructionSubjectType
  subjectId: string
  predicate: 'body-state' | 'consciousness-occupancy'
  value: Value
}

function transitionClaim<Value>(
  row: WorldEventRow,
  draft: TransitionDraft<Value>,
): ReconstructionClaim<Value> {
  return defineReconstructionClaim({
    id: `world:${row.id}:${draft.predicate}:${draft.subjectId}`,
    eventId: row.id,
    subject: { type: draft.type, id: draft.subjectId },
    predicate: draft.predicate,
    value: draft.value,
    interval: { from: { eventId: row.id, ordinal: row.ordinal }, until: null },
    precision: 'UNKNOWN',
    certainty: 'CONFIRMED',
    sourceIds: row.sourceIds,
    method: 'explicit',
  })
}

function eventBoundary(value: EventBoundary) {
  return { eventId: value.id, ordinal: value.ordinal }
}
function methodFor(value: ReconstructionCertainty): ReconstructionMethod {
  return value === 'LAST_KNOWN'
    ? 'last-known'
    : value === 'PROBABLE'
      ? 'editorial-inference'
      : 'explicit'
}
function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : null
}
function stringValue(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}
function precisionValue(value: unknown): ReconstructionPrecision {
  return ['EXACT_ROOM', 'ZONE', 'TIER', 'UNKNOWN'].includes(String(value))
    ? (value as ReconstructionPrecision)
    : 'UNKNOWN'
}
function certaintyValue(value: unknown): ReconstructionCertainty {
  return ['CONFIRMED', 'PROBABLE', 'LAST_KNOWN'].includes(String(value))
    ? (value as ReconstructionCertainty)
    : 'PROBABLE'
}
function subjectType(value: unknown): ReconstructionSubjectType {
  const supported: ReconstructionSubjectType[] = [
    'BODY',
    'CONSCIOUSNESS',
    'CHARACTER',
    'OBJECT',
    'NEN_ENTITY',
    'AURA_ENTITY',
    'COHORT',
    'LOCATION',
  ]
  return supported.includes(value as ReconstructionSubjectType)
    ? (value as ReconstructionSubjectType)
    : 'CHARACTER'
}
