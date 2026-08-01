import type {
  BodyRecord,
  ConsciousnessRecord,
  ContinuityEntry,
  ContinuityKind,
  RecordEvent,
  RecordLink,
} from '$lib/identity/continuity'

/**
 * The continuity record of one body or one consciousness.
 *
 * Both pages used to be hand-written mock-ups: three literal entries quoting
 * event `389-11`, an id no chapter of canon carries. The archive already stores
 * every row they were pretending to show — `BodyOccupancy`, `BodyState`,
 * `Presence`, `AppearanceState`, `ConsciousnessState` — each anchored to a
 * narrative event, so the record is read rather than written here.
 *
 * Entries carry enum values, not sentences: the page words them through the i18n
 * catalogue, so the French rendering is not this module's business.
 *
 * The builders are pure over the rows the routes fetch — the route queries, this
 * decides — so the spoiler and ordering rules are testable without a database.
 */

const eventInclude = { include: { chapter: true } } as const

type EventRow = { id: string; sequence: number; title: string; chapter: { number: number } }
type TemporalRow = { id: string; fromEvent: EventRow; untilEvent: EventRow | null }

/**
 * What the builders read off a body row. It is a structural subset of the Prisma
 * payload the include below produces, which is what lets a test hand over four
 * fields instead of a whole row.
 */
export interface BodyRow {
  id: string
  label: string
  bodyType: string
  firstVisibleEvent: EventRow
  character: { id: string; slug: string; canonicalName: string } | null
  occupancies: Array<
    TemporalRow & {
      occupancyType: string
      certainty: string
      consciousness: { id: string; label: string } | null
    }
  >
  states: Array<TemporalRow & { state: string }>
  presences: Array<
    TemporalRow & {
      precision: string
      certainty: string
      location: { id: string; name: string } | null
    }
  >
  appearances: Array<TemporalRow & { cause: string }>
}

export interface ConsciousnessRow {
  id: string
  label: string
  consciousnessType: string
  firstVisibleEvent: EventRow
  character: { id: string; slug: string; canonicalName: string } | null
  occupancies: Array<
    TemporalRow & { occupancyType: string; certainty: string; body: { id: string; label: string } }
  >
  states: Array<TemporalRow & { state: string }>
}

function toRecordEvent(event: EventRow): RecordEvent {
  return {
    id: event.id,
    chapter: event.chapter.number,
    sequence: event.sequence,
    title: event.title,
  }
}

/** Chapter first, then the event order inside it. */
function byEventOrder(left: ContinuityEntry, right: ContinuityEntry): number {
  return left.from.chapter - right.from.chapter || left.from.sequence - right.from.sequence
}

function beyond(event: EventRow | null | undefined, limit: number | null): boolean {
  return limit !== null && event !== null && event !== undefined && event.chapter.number > limit
}

/**
 * One continuity entry as the caller means it, before the reader's cap is
 * applied. `certainty` and `link` are optional because most kinds carry
 * neither: a body state is simply the state it was in.
 */
interface EntryDraft {
  row: TemporalRow
  kind: ContinuityKind
  value: string
  certainty?: string | null
  link?: RecordLink | null
}

/**
 * A row turned into an entry, or null when the reader's cap puts its start out
 * of reach. `until` is dropped rather than the row when only the end is capped.
 */
function toEntry(
  { row, kind, value, certainty = null, link = null }: EntryDraft,
  limit: number | null,
): ContinuityEntry | null {
  if (beyond(row.fromEvent, limit)) return null
  return {
    id: row.id,
    kind,
    value,
    certainty,
    from: toRecordEvent(row.fromEvent),
    until: row.untilEvent && !beyond(row.untilEvent, limit) ? toRecordEvent(row.untilEvent) : null,
    link,
  }
}

function characterLink(
  character: { id: string; slug: string; canonicalName: string } | null | undefined,
): RecordLink | null {
  if (!character) return null
  return { id: character.id, label: character.canonicalName, href: `/characters/${character.slug}` }
}

/** Distinct links in first-seen order — an entity re-entering keeps its first slot. */
function distinctLinks(entries: ContinuityEntry[], kind: ContinuityKind): RecordLink[] {
  const seen = new Map<string, RecordLink>()
  for (const entry of entries) {
    if (entry.kind !== kind || !entry.link) continue
    if (!seen.has(entry.link.id)) seen.set(entry.link.id, entry.link)
  }
  return [...seen.values()]
}

export const bodyRowInclude = {
  firstVisibleEvent: eventInclude,
  character: true,
  occupancies: {
    include: {
      fromEvent: eventInclude,
      untilEvent: eventInclude,
      consciousness: { include: { character: true } },
    },
  },
  states: { include: { fromEvent: eventInclude, untilEvent: eventInclude } },
  presences: {
    include: { fromEvent: eventInclude, untilEvent: eventInclude, location: true },
  },
  appearances: { include: { fromEvent: eventInclude, untilEvent: eventInclude } },
} as const

export function buildBodyRecord(row: BodyRow, limit: number | null): BodyRecord | null {
  if (beyond(row.firstVisibleEvent, limit)) return null

  const entries = [
    ...row.occupancies.map((occupancy) =>
      toEntry(
        {
          row: occupancy,
          kind: 'OCCUPANCY',
          value: occupancy.occupancyType,
          certainty: occupancy.certainty,
          link: occupancy.consciousness
            ? {
                id: occupancy.consciousness.id,
                label: occupancy.consciousness.label,
                href: `/consciousness/${occupancy.consciousness.id}`,
              }
            : null,
        },
        limit,
      ),
    ),
    ...row.states.map((state) =>
      toEntry({ row: state, kind: 'BODY_STATE', value: state.state }, limit),
    ),
    ...row.presences.map((presence) =>
      toEntry(
        {
          row: presence,
          kind: 'PRESENCE',
          value: presence.precision,
          certainty: presence.certainty,
          link: presence.location
            ? { id: presence.location.id, label: presence.location.name, href: null }
            : null,
        },
        limit,
      ),
    ),
    ...row.appearances.map((appearance) =>
      toEntry({ row: appearance, kind: 'APPEARANCE', value: appearance.cause }, limit),
    ),
  ]
    .filter((entry): entry is ContinuityEntry => entry !== null)
    .sort(byEventOrder)

  return {
    id: row.id,
    label: row.label,
    bodyType: row.bodyType,
    originalCharacter: characterLink(row.character),
    firstVisible: toRecordEvent(row.firstVisibleEvent),
    entries,
    occupants: distinctLinks(entries, 'OCCUPANCY'),
  }
}

export const consciousnessRowInclude = {
  firstVisibleEvent: eventInclude,
  character: true,
  occupancies: {
    include: {
      fromEvent: eventInclude,
      untilEvent: eventInclude,
      body: { include: { character: true } },
    },
  },
  states: { include: { fromEvent: eventInclude, untilEvent: eventInclude } },
} as const

export function buildConsciousnessRecord(
  row: ConsciousnessRow,
  limit: number | null,
): ConsciousnessRecord | null {
  if (beyond(row.firstVisibleEvent, limit)) return null

  const entries = [
    ...row.occupancies.map((occupancy) =>
      toEntry(
        {
          row: occupancy,
          kind: 'OCCUPANCY',
          value: occupancy.occupancyType,
          certainty: occupancy.certainty,
          link: {
            id: occupancy.body.id,
            label: occupancy.body.label,
            href: `/bodies/${occupancy.body.id}`,
          },
        },
        limit,
      ),
    ),
    ...row.states.map((state) =>
      toEntry({ row: state, kind: 'CONSCIOUSNESS_STATE', value: state.state }, limit),
    ),
  ]
    .filter((entry): entry is ContinuityEntry => entry !== null)
    .sort(byEventOrder)

  return {
    id: row.id,
    label: row.label,
    consciousnessType: row.consciousnessType,
    originCharacter: characterLink(row.character),
    firstVisible: toRecordEvent(row.firstVisibleEvent),
    entries,
    bodies: distinctLinks(entries, 'OCCUPANCY'),
  }
}
