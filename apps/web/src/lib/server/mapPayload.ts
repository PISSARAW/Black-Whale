/**
 * What the map is allowed to weigh.
 *
 * The timeline engine hands back Prisma rows with their joins attached: every
 * presence, occupancy, body and character carries the event it starts at, and
 * that event carries its chapter. The same hundred-odd events are therefore
 * serialised once per row — eight hundred times over — and the ship page
 * shipped 1.1 MB of them inline, parsed twice: once as HTML, once on
 * hydration. Desktops absorb that. A phone browser holds the string, the parse
 * and the graph at the same time, and reloads the tab when it runs out.
 *
 * The map reads three fields off those joined events — `sequence` and
 * `chapterId` to word a presence's badge, `id` to compare against the selected
 * event — and nothing at all off `firstVisibleEvent`. The chapter titles and
 * summaries it does show come from `events`, which travels once. So the joins
 * are cut down to their keys here, at the edge, rather than each caller
 * remembering not to read the rest.
 */

/** An event as a row's join needs to state it: enough to order it and name it. */
export interface EventKeys {
  id: string
  chapterId: string
  sequence: number
  ordinal?: number | null
}

/** A join as it arrives: the keys we keep, under whatever else Prisma attached. */
type JoinedEvent = Partial<EventKeys> & Record<string, unknown>

/** A row as it arrives: whatever else it holds, plus the joins we cut back. */
type JoinedRow = Record<string, unknown>

/** The three names a joined event travels under, on every row that has one. */
const joins = ['fromEvent', 'untilEvent', 'firstVisibleEvent'] as const

function eventKeys(event: unknown) {
  if (!event || typeof event !== 'object') return event
  const { id, chapterId, sequence, ordinal } = event as JoinedEvent
  return {
    id,
    chapterId,
    sequence,
    ...(ordinal === undefined ? {} : { ordinal }),
  }
}

/** One row, with each event join reduced to its keys. Absent joins stay absent. */
export function trimRow<T extends JoinedRow>(row: T): T {
  const trimmed: JoinedRow = { ...row }
  for (const join of joins) {
    if (join in trimmed) trimmed[join] = eventKeys(trimmed[join])
  }
  return trimmed as T
}

/** Every row of a collection, trimmed. */
export function trimRows<T extends JoinedRow>(rows: T[] | undefined): T[] | undefined {
  return rows?.map(trimRow)
}

/**
 * A world state as the map should receive it. Collections it does not carry are
 * left alone, so this stays safe to run over a partial snapshot.
 */
export function trimWorldStateForMap<T extends Record<string, unknown>>(worldState: T): T {
  const trimmed: Record<string, unknown> = { ...worldState }
  for (const key of [
    'characters',
    'bodies',
    'consciousnesses',
    'presences',
    'occupancies',
    'appearances',
  ]) {
    const rows = trimmed[key]
    if (Array.isArray(rows)) trimmed[key] = trimRows(rows as JoinedRow[])
  }
  return trimmed as T
}
