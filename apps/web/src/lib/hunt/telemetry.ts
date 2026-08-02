/**
 * The local journal: what was spent, by whom, when, and on what.
 *
 * This is the instrument the step-2 gate is read with. "Does the player always
 * lay everything, or never lay anything?" is not a question anyone can answer
 * from memory after a ten-minute game, and if the answer is yes the fix is a
 * number in the costs table rather than any code. So the journal records the
 * decisions and not the frames.
 *
 * Events carry a kind and a cost, never a sentence. The wording is the
 * debrief's problem and belongs to `lib/i18n`, in both languages — a log that
 * stores prose is a log that only exists in one of them.
 */

export type Actor = 'player' | 'hunter'

export type TelemetryKind =
  | 'sweptEn'
  | 'feltEn'
  | 'wentZetsu'
  | 'wentTen'
  | 'laidEntrave'
  | 'tookEntraveBack'
  | 'sprungEntrave'
  | 'spottedEntrave'
  | 'inspected'
  | 'believed'
  | 'lostTheTrail'
  | 'duelOpened'
  | 'duelClosed'
  | 'enteredRoom'
  | 'usedHatsu'

export interface TelemetryEvent {
  /** Game clock, in seconds. */
  at: number
  actor: Actor
  kind: TelemetryKind
  /** Aura this cost the actor. Zero for events that are not purchases. */
  cost: number
  /** The room it happened in, when that is part of the record. */
  where: string | null
}

/**
 * A whole game is six hundred seconds of decisions, not of frames, so the
 * journal is small enough to keep entire. Trimming it would silently cut the
 * early preparation — the exact half of the game the step-4 question is about.
 */
export const JOURNAL_LIMIT = 400

export interface Entry {
  actor: Actor
  kind: TelemetryKind
  cost?: number
  where?: string | null
}

export function record(log: readonly TelemetryEvent[], at: number, entry: Entry): TelemetryEvent[] {
  if (log.length >= JOURNAL_LIMIT) return [...log]
  return [...log, { at, actor: entry.actor, kind: entry.kind, cost: entry.cost ?? 0, where: entry.where ?? null }]
}

export function spentBy(log: readonly TelemetryEvent[], actor: Actor): number {
  return log.reduce((total, event) => (event.actor === actor ? total + event.cost : total), 0)
}

export function countOf(log: readonly TelemetryEvent[], kind: TelemetryKind): number {
  return log.filter((event) => event.kind === kind).length
}

/** What each side believed, in order — the spine of the debrief. */
export function beliefsIn(log: readonly TelemetryEvent[]): TelemetryEvent[] {
  return log.filter((event) => event.kind === 'believed' || event.kind === 'lostTheTrail')
}

/** Room transitions only, suitable for a bounded spatial debrief. */
export function movementsIn(log: readonly TelemetryEvent[], actor?: Actor): TelemetryEvent[] {
  return log.filter(
    (event) => event.kind === 'enteredRoom' && (!actor || event.actor === actor),
  )
}
