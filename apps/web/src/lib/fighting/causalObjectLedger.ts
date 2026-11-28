import type { FightSide, FightState } from './types'

export type CausalObjectEventKind = 'created' | 'moved' | 'touched' | 'transformed' | 'destroyed'
export interface CausalObjectEvent {
  kind: CausalObjectEventKind
  frame: number
  actor?: FightSide
  cause: string
}
export interface CausalObjectRecord {
  key: string
  origin: string
  events: readonly CausalObjectEvent[]
  last: ObjectFingerprint
}
export interface CausalObjectLedger {
  records: Readonly<Record<string, CausalObjectRecord>>
}
interface ObjectFingerprint {
  x: number
  y: number
  present: boolean
  health?: number
  owner?: FightSide | 'neutral'
  form: string
}

declare module './types' {
  interface FightState {
    /** Opt-in forensic history for material objects; records facts, never combat authority. */
    causalObjectLedger?: CausalObjectLedger
  }
}

export function beginCausalObjectLedger(state: FightState): FightState {
  if (state.causalObjectLedger) return state
  const records: Record<string, CausalObjectRecord> = {}
  for (const object of objectsOf(state)) {
    records[object.key] = {
      key: object.key,
      origin: object.origin,
      events: [{ kind: 'created', frame: state.frame, cause: object.origin }],
      last: object.fingerprint,
    }
  }
  return { ...state, causalObjectLedger: { records } }
}

export function advanceCausalObjectLedger(state: FightState): FightState {
  const ledger = state.causalObjectLedger
  if (!ledger) return state
  const current = new Map(objectsOf(state).map((object) => [object.key, object]))
  const records: Record<string, CausalObjectRecord> = { ...ledger.records }
  let changed = false

  for (const object of current.values()) {
    const old = records[object.key]
    if (!old) {
      records[object.key] = record(object, state.frame)
      changed = true
      continue
    }
    const event = changedEvent(old.last, object.fingerprint, state.frame)
    if (!event) continue
    records[object.key] = append(old, event, object.fingerprint)
    changed = true
  }
  for (const old of Object.values(ledger.records)) {
    if (current.has(old.key) || !old.last.present) continue
    records[old.key] = append(
      old,
      { kind: 'destroyed', frame: state.frame, cause: 'removed-from-world' },
      { ...old.last, present: false },
    )
    changed = true
  }
  if (!changed) return state
  const bounded = Object.fromEntries(
    Object.values(records)
      .sort((a, b) => lastFrame(b) - lastFrame(a) || a.key.localeCompare(b.key))
      .slice(0, 128)
      .map((entry) => [entry.key, entry]),
  )
  return { ...state, causalObjectLedger: { records: bounded } }
}

export function recordObjectTouch(
  state: FightState,
  key: string,
  { actor, cause }: { actor: FightSide; cause: string },
): FightState {
  const old = state.causalObjectLedger?.records[key]
  if (!old) return state
  return {
    ...state,
    causalObjectLedger: {
      records: {
        ...state.causalObjectLedger!.records,
        [key]: append(old, { kind: 'touched', frame: state.frame, actor, cause }, old.last),
      },
    },
  }
}

function objectsOf(state: FightState) {
  const entities = (state.battlefield?.entities ?? []).map((entry) => ({
    key: `entity:${entry.id}`,
    origin: entry.copy
      ? `copy:${entry.copy.originalId}`
      : entry.owner === 'neutral'
        ? 'arena'
        : `owner:${entry.owner}`,
    fingerprint: {
      x: entry.x,
      y: entry.y,
      present: entry.present,
      health: entry.health,
      owner: entry.owner,
      form: `${entry.kind}:${entry.copy?.originalKind ?? ''}`,
    } satisfies ObjectFingerprint,
  }))
  const projectiles = state.projectiles.map((shot) => ({
    key: `projectile:${shot.id}`,
    origin: `fired:${shot.owner}:${shot.fighterId}`,
    fingerprint: {
      x: shot.x,
      y: shot.y,
      present: true,
      owner: shot.owner,
      form: `${shot.matter}:${shot.shape}`,
    } satisfies ObjectFingerprint,
  }))
  return [...entities, ...projectiles]
}

function changedEvent(
  before: ObjectFingerprint,
  after: ObjectFingerprint,
  frame: number,
): CausalObjectEvent | null {
  if (before.present && !after.present) return { kind: 'destroyed', frame, cause: 'object-state' }
  if (before.form !== after.form || before.owner !== after.owner)
    return { kind: 'transformed', frame, cause: `${before.form}->${after.form}` }
  if (before.health !== after.health)
    return {
      kind: 'transformed',
      frame,
      cause: `health:${before.health ?? '?'}->${after.health ?? '?'}`,
    }
  if (before.x !== after.x || before.y !== after.y)
    return { kind: 'moved', frame, cause: 'world-motion' }
  return null
}

function record(object: ReturnType<typeof objectsOf>[number], frame: number): CausalObjectRecord {
  return {
    key: object.key,
    origin: object.origin,
    events: [{ kind: 'created', frame, cause: object.origin }],
    last: object.fingerprint,
  }
}

function append(
  record: CausalObjectRecord,
  event: CausalObjectEvent,
  last: ObjectFingerprint,
): CausalObjectRecord {
  return { ...record, events: [...record.events, event].slice(-16), last }
}

function lastFrame(record: CausalObjectRecord): number {
  return record.events.at(-1)?.frame ?? 0
}
