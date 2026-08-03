/**
 * What the map is allowed to weigh.
 *
 * The timeline engine hands back Prisma rows with their joins attached: every
 * presence, occupancy, body and character carries the event it starts at, and
 * that event carries its chapter. The same hundred-odd events were therefore
 * serialised once per row — eight hundred times over — and the ship page
 * shipped 1.1 MB of them inline, parsed twice: once as HTML, once on
 * hydration. Desktops absorb that. A phone browser holds the string, the parse
 * and the graph at the same time, and reloads the tab when it runs out.
 *
 * Cutting the joins back to their keys took the page to 804 kB, of which 313 kB
 * was still world state. What remained was not joins but *fields*: a body
 * travelled with its type and its first visible event so the map could read its
 * label, and an occupancy travelled with seven columns so the map could read
 * two.
 *
 * So this declares the payload rather than pruning it. Each collection names
 * the fields the map reads, the types below say so, and code that starts
 * reading a field which is not listed fails to compile instead of finding
 * `undefined` in a browser.
 */

/** An event as a row's join needs to state it: enough to order it and word it. */
export interface EventKeys {
  id: string
  chapterId: string
  sequence: number
  ordinal?: number | null
}

/** A body, as the map reads it: whose it is, and what to call it. */
export interface MapBody {
  id: string
  originalCharacterId: string | null
  label: string
}

/** A consciousness, as the map reads it. */
export interface MapConsciousness {
  id: string
  originCharacterId: string | null
  label: string
}

/** Which consciousness is riding which body. Nothing else is consulted. */
export interface MapOccupancy {
  bodyId: string
  consciousnessId: string | null
}

/** Whose face a body is wearing, when it is not its own. */
export interface MapAppearance {
  entityId: string
  appearanceCharacterId: string | null
}

/** A position, with the two relations the temporal badge words itself from. */
export interface MapPresenceRow {
  id: string
  entityId: string
  locationId: string | null
  fromEventId: string
  untilEventId: string | null
  precision: string
  certainty: string
  fromEvent?: { sequence?: number | null; chapterId?: string | null } | null
  untilEvent?: { sequence?: number | null } | null
}

/**
 * A character, minus what the map never opens.
 *
 * Unlike the other collections this is a subtraction rather than an allow-list,
 * and deliberately so: the map reads a character's name, slug, roster tags and
 * hatsu, but the ship page also filters and searches over the roster, so an
 * allow-list here would be a standing invitation to drop a field a filter
 * quietly needs. What is removed is what was checked to be read nowhere on this
 * surface: the biography prose, and the first-visible-event join the reveal
 * filter already applied server-side.
 */
const CHARACTER_DROPPED = [
  'description',
  'firstVisibleEvent',
  'firstVisibleEventId',
  'portraitAssetId',
] as const

function characterRow(row: Row): Row {
  const kept: Row = { ...row }
  for (const field of CHARACTER_DROPPED) delete kept[field]
  return kept
}

/** A place, as the map draws and names it. */
export interface MapLocation {
  id: string
  slug: string
  name: string
  type: string
  mapElementId: string | null
  parentLocationId: string | null
}

/**
 * An event as the timeline scrubber reads it.
 *
 * The ship page shows a chapter number, a sequence, a title and a flashback
 * badge, and finds the selected event by id. It never opens a summary — the
 * hundred and thirty-nine of them travelled as sixty-seven kilobytes of prose
 * that no element on the page renders.
 */
export interface TimelineEvent {
  id: string
  sequence: number
  title: string
  isFlashback?: boolean
  /** The voyage clock's rendering of the hour, shown beside the title. */
  occurredAtLabel?: string | null
  chapter: { number: number }
}

type Row = Record<string, unknown>

/** One row, reduced to the named fields. A field the row lacks stays absent. */
function project<T>(row: Row, fields: readonly string[]): T {
  const kept: Row = {}
  for (const field of fields) {
    if (field in row) kept[field] = row[field]
  }
  return kept as T
}

function eventKeys(event: unknown): unknown {
  if (!event || typeof event !== 'object') return event
  const { sequence, chapterId } = event as Partial<EventKeys>
  return { sequence, chapterId }
}

const BODY = ['id', 'originalCharacterId', 'label']
const CONSCIOUSNESS = ['id', 'originCharacterId', 'label']
const OCCUPANCY = ['bodyId', 'consciousnessId']
const APPEARANCE = ['entityId', 'appearanceCharacterId']
const LOCATION = ['id', 'slug', 'name', 'type', 'mapElementId', 'parentLocationId']
const PRESENCE = [
  'id',
  'entityId',
  'locationId',
  'fromEventId',
  'untilEventId',
  'precision',
  'certainty',
]

/** A presence, with its joins cut to the fields the badge words itself from. */
function presenceRow(row: Row): MapPresenceRow {
  const kept = project<MapPresenceRow & Row>(row, PRESENCE)
  if ('fromEvent' in row) kept.fromEvent = eventKeys(row.fromEvent) as MapPresenceRow['fromEvent']
  if ('untilEvent' in row) {
    kept.untilEvent = eventKeys(row.untilEvent) as MapPresenceRow['untilEvent']
  }
  return kept
}

function projectAll<T>(rows: unknown, fields: readonly string[]): T[] | null {
  return Array.isArray(rows) ? rows.map((row) => project<T>(row as Row, fields)) : null
}

/**
 * The event list, cut to what the scrubber shows.
 *
 * Kept beside the world-state projection because it answers the same question
 * — what does this page actually read — and because the two are edited
 * together whenever the ship page grows a field.
 */
export function trimEventsForTimeline(events: readonly Row[]): TimelineEvent[] {
  return events.map((event) => {
    const chapter = event.chapter as { number?: number } | null | undefined
    return {
      id: String(event.id),
      sequence: Number(event.sequence ?? 0),
      title: String(event.title ?? ''),
      ...(event.isFlashback === undefined ? {} : { isFlashback: Boolean(event.isFlashback) }),
      occurredAtLabel: (event.occurredAtLabel as string | null) ?? null,
      chapter: { number: Number(chapter?.number ?? 0) },
    }
  })
}

/**
 * A world state as the map should receive it.
 *
 * Collections it does not carry are left alone, so this stays safe to run over
 * a partial snapshot — the ship page builds one by hand when no event resolves.
 *
 * `characters` is subtracted from rather than allow-listed — see
 * `CHARACTER_DROPPED` for why.
 */
export function trimWorldStateForMap<T extends Record<string, unknown>>(worldState: T): T {
  const trimmed: Record<string, unknown> = { ...worldState }

  if (Array.isArray(trimmed.presences)) {
    trimmed.presences = (trimmed.presences as Row[]).map(presenceRow)
  }
  if (Array.isArray(trimmed.characters)) {
    trimmed.characters = (trimmed.characters as Row[]).map(characterRow)
  }
  for (const [key, fields] of [
    ['bodies', BODY],
    ['consciousnesses', CONSCIOUSNESS],
    ['occupancies', OCCUPANCY],
    ['appearances', APPEARANCE],
    ['locations', LOCATION],
  ] as const) {
    trimmed[key] = projectAll(trimmed[key], fields) ?? trimmed[key]
  }

  return trimmed as T
}
