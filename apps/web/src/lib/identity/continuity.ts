/**
 * The shape of a body or consciousness continuity record.
 *
 * The types live outside `$lib/server` so the components that render a record
 * can name it without importing a module that holds a Prisma client.
 */

export interface RecordEvent {
  id: string
  chapter: number
  sequence: number
  title: string
}

/** The entity on the other side of an entry, and the page that details it. */
export interface RecordLink {
  id: string
  label: string
  href: string | null
}

export type ContinuityKind =
  'OCCUPANCY' | 'BODY_STATE' | 'PRESENCE' | 'APPEARANCE' | 'CONSCIOUSNESS_STATE'

export interface ContinuityEntry {
  id: string
  kind: ContinuityKind
  /** The enum value the archive stores, uppercase, worded by the page. */
  value: string
  /** `Certainty` for an occupancy, `PresenceCertainty` for a presence. */
  certainty: string | null
  from: RecordEvent
  /**
   * When the entry stopped holding, or null when it still holds *as far as this
   * reader may know*: an interval that ends past the spoiler cap is reported as
   * open rather than closed, because its end is the spoiler.
   */
  until: RecordEvent | null
  link: RecordLink | null
}

export interface BodyRecord {
  id: string
  label: string
  bodyType: string
  originalCharacter: RecordLink | null
  firstVisible: RecordEvent
  entries: ContinuityEntry[]
  /** Distinct consciousnesses ever recorded inside this body, in first-seen order. */
  occupants: RecordLink[]
}

export interface ConsciousnessRecord {
  id: string
  label: string
  consciousnessType: string
  originCharacter: RecordLink | null
  firstVisible: RecordEvent
  entries: ContinuityEntry[]
  /** Distinct bodies this consciousness has occupied, in first-seen order. */
  bodies: RecordLink[]
}
