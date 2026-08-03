import type { Location } from '@black-whale/domain'
import { timeline } from '$lib/server/timeline'
import { calculatePresencePosition } from '$lib/components/map/markerProjection'
import type { RecordLink } from '$lib/identity/continuity'
import { prisma } from './db'
import { buildPerspective } from './perspectives'

/**
 * One character's view of the ship at one canonical event.
 *
 * The page this feeds was a mock-up: three bullet points naming rooms and
 * characters chosen at authoring time, and a four-lane timeline holding one
 * literal dot per lane. Everything it mimicked is derivable — the perspective
 * engine already answers which body the observer occupies and which bodies they
 * can see, and the map projection already places a presence on the deck plan —
 * so this module derives it instead.
 */

const eventInclude = { include: { chapter: true } } as const

/** How many canonical events the timeline lanes look back over. */
const WINDOW = 6

// One engine, shared: see `timeline.ts` for why remembering is safe here.

export interface CursorEvent {
  id: string
  chapter: number
  sequence: number
  title: string
}

export interface SubjectiveMarker {
  id: string
  label: string
  x: number
  y: number
  tier: string | null
  locationLabel: string | null
  /** Confirmed / likely / last known — the three legends the map shows. */
  state: 'confirmed' | 'believed' | 'outdated'
  isObserver: boolean
}

/**
 * Which i18n enum dictionary a lane value belongs to. The lanes carry stored
 * enum values, and only the page holds the catalogue that words them, so each
 * point says which dictionary reads it rather than shipping `CONFIRMED` to
 * the screen.
 */
export type EnumTag =
  | 'presenceCertainty'
  | 'presencePrecision'
  | 'occupancyType'
  | 'consciousnessState'
  | 'acquisitionMethod'

export interface StreamPoint {
  id: string
  label: string
  index: number
  detail?: string
  emphasis?: boolean
  /** Set when `label` is an enum value rather than a name. */
  labelEnum?: EnumTag
  /** Set when `detail` is an enum value. */
  detailEnum?: EnumTag
}

export interface SubjectiveView {
  cursor: CursorEvent
  identity: {
    body: RecordLink | null
    consciousness: RecordLink | null
    apparent: RecordLink | null
    isDissonant: boolean
  }
  /** The deck the observer stands on; the map draws that layer. */
  tier: string | null
  markers: SubjectiveMarker[]
  streams: {
    reality: StreamPoint[]
    body: StreamPoint[]
    consciousness: StreamPoint[]
    knowledge: StreamPoint[]
  }
  currentIndex: number
}

const MARKER_STATE: Record<string, SubjectiveMarker['state']> = {
  CONFIRMED: 'confirmed',
  PROBABLE: 'believed',
  LAST_KNOWN: 'outdated',
}

/** `PresenceCertainty` as the map legend words it; an unknown value reads as stale. */
export function markerStateFor(certainty: string): SubjectiveMarker['state'] {
  return MARKER_STATE[certainty] ?? 'outdated'
}

/**
 * The lane index of a row: the position of its opening event in the window, or
 * null when it opened before the window and so has nothing to draw there.
 */
export function indexIn(window: Array<{ id: string }>, eventId: string): number | null {
  const position = window.findIndex((event) => event.id === eventId)
  return position === -1 ? null : position + 1
}

export async function buildSubjectiveView(
  observerCharacterId: string,
  requestedEventId: string | null,
  spoilerLimit: number | null,
): Promise<SubjectiveView | null> {
  const events = await prisma.narrativeEvent.findMany({
    where: {
      occursOnBlackWhale: true,
      ...(spoilerLimit === null ? {} : { chapter: { number: { lte: spoilerLimit } } }),
    },
    orderBy: [{ chapter: { number: 'asc' } }, { sequence: 'asc' }],
    include: { chapter: true },
  })
  if (events.length === 0) return null

  // An unknown or capped event id falls back to the latest event the reader may
  // see, which is also the default when none was asked for.
  const requestedIndex = requestedEventId
    ? events.findIndex((event) => event.id === requestedEventId)
    : -1
  const position = requestedIndex === -1 ? events.length - 1 : requestedIndex
  const cursorRow = events[position]
  const window = events.slice(Math.max(0, position - WINDOW + 1), position + 1)

  const cursor: CursorEvent = {
    id: cursorRow.id,
    chapter: cursorRow.chapter.number,
    sequence: cursorRow.sequence,
    title: cursorRow.title,
  }

  const [perspective, snapshot, locationRows] = await Promise.all([
    buildPerspective(observerCharacterId, cursorRow.id, spoilerLimit ?? undefined),
    // The snapshot holds the presences that are active at the cursor, resolved
    // with the same ordinal rules the rest of the site reads them by.
    timeline.getWorldState({ eventId: cursorRow.id }),
    prisma.location.findMany(),
  ])

  // Prisma rows carry their own column names and nullability; the projection
  // reads the domain shape. The timeline engine bridges the same gap the same way.
  const locations = locationRows as unknown as Location[]

  const observerBodyId = perspective.observer.currentBodyId || null
  const observerConsciousnessId = perspective.observer.consciousnessId || null
  const visibleBodyIds = new Set(
    perspective.visibleBodies.length
      ? perspective.visibleBodies
      : observerBodyId
        ? [observerBodyId]
        : [],
  )

  const bodyLabels = new Map(snapshot.bodies.map((body) => [body.id, body.label]))
  const locationNames = new Map(locations.map((location) => [location.id, location.name]))
  const visiblePresences = snapshot.presences.filter((presence) =>
    visibleBodyIds.has(presence.entityId),
  )

  const markers = visiblePresences.map((presence): SubjectiveMarker => {
    const placement = calculatePresencePosition(presence, visiblePresences, locations)
    return {
      id: presence.id,
      label: bodyLabels.get(presence.entityId) ?? presence.entityId,
      x: placement.x,
      y: placement.y,
      tier: placement.tierId,
      locationLabel: presence.locationId ? (locationNames.get(presence.locationId) ?? null) : null,
      state: markerStateFor(presence.certainty),
      isObserver: presence.entityId === observerBodyId,
    }
  })

  // The three lanes that are not "what canon says" are read from the observer's
  // own rows: where their body went, what their consciousness did, and what they
  // learned — each only where it changed inside the window.
  const [
    bodyPresences,
    occupancies,
    consciousnessStates,
    knowledgeStates,
    consciousness,
    apparent,
  ] = await Promise.all([
    observerBodyId
      ? prisma.presence.findMany({
          where: { entityType: 'BODY', entityId: observerBodyId },
          include: { fromEvent: eventInclude },
        })
      : [],
    observerConsciousnessId
      ? prisma.bodyOccupancy.findMany({
          where: { consciousnessId: observerConsciousnessId },
          include: { body: true },
        })
      : [],
    observerConsciousnessId
      ? prisma.consciousnessState.findMany({ where: { consciousnessId: observerConsciousnessId } })
      : [],
    prisma.knowledgeState.findMany({
      where: { observerCharacterId },
      include: { fact: true },
    }),
    observerConsciousnessId
      ? prisma.consciousness.findUnique({ where: { id: observerConsciousnessId } })
      : null,
    perspective.observer.apparentCharacterId
      ? prisma.character.findUnique({ where: { id: perspective.observer.apparentCharacterId } })
      : null,
  ])

  const reality: StreamPoint[] = window.map((event, offset) => ({
    id: event.id,
    label: event.title,
    index: offset + 1,
    detail: `ch. ${event.chapter.number}`,
  }))

  const bodyLane = bodyPresences
    .map((presence): StreamPoint | null => {
      const index = indexIn(window, presence.fromEventId)
      if (index === null) return null
      const named = presence.locationId ? locationNames.get(presence.locationId) : undefined
      return {
        id: presence.id,
        label: named ?? presence.precision,
        index,
        detail: presence.certainty,
        detailEnum: 'presenceCertainty',
        ...(named ? {} : { labelEnum: 'presencePrecision' as const }),
      }
    })
    .filter((point): point is StreamPoint => point !== null)

  const consciousnessLane = [
    ...occupancies.map((occupancy): StreamPoint | null => {
      const index = indexIn(window, occupancy.fromEventId)
      if (index === null) return null
      return {
        id: occupancy.id,
        label: occupancy.body.label,
        index,
        detail: occupancy.occupancyType,
        detailEnum: 'occupancyType',
        // A consciousness that is not in its own body is why this lane exists.
        emphasis: occupancy.occupancyType !== 'ORIGINAL',
      }
    }),
    ...consciousnessStates.map((state): StreamPoint | null => {
      const index = indexIn(window, state.fromEventId)
      if (index === null) return null
      return {
        id: state.id,
        label: state.state,
        labelEnum: 'consciousnessState',
        index,
        emphasis: state.state !== 'ACTIVE',
      }
    }),
  ].filter((point): point is StreamPoint => point !== null)

  const knowledgeLane = knowledgeStates
    .map((state): StreamPoint | null => {
      const index = indexIn(window, state.acquisitionEventId)
      if (index === null) return null
      return {
        id: state.id,
        label: state.fact.predicate,
        index,
        detail: state.acquisitionMethod,
        detailEnum: 'acquisitionMethod',
      }
    })
    .filter((point): point is StreamPoint => point !== null)

  const observerMarker = markers.find((marker) => marker.isObserver)

  return {
    cursor,
    identity: {
      body: observerBodyId
        ? {
            id: observerBodyId,
            label: bodyLabels.get(observerBodyId) ?? observerBodyId,
            href: `/bodies/${observerBodyId}`,
          }
        : null,
      consciousness: consciousness
        ? {
            id: consciousness.id,
            label: consciousness.label,
            href: `/consciousness/${consciousness.id}`,
          }
        : null,
      apparent: apparent
        ? {
            id: apparent.id,
            label: apparent.canonicalName,
            href: `/characters/${apparent.slug}`,
          }
        : null,
      isDissonant: perspective.observer.isDissonant ?? false,
    },
    tier: observerMarker?.tier ?? markers[0]?.tier ?? null,
    markers,
    streams: {
      reality,
      body: bodyLane,
      consciousness: consciousnessLane,
      knowledge: knowledgeLane,
    },
    currentIndex: window.length,
  }
}

/** Canonical events a reader may pick as the cursor, newest first. */
export async function listCursorEvents(spoilerLimit: number | null): Promise<CursorEvent[]> {
  const events = await prisma.narrativeEvent.findMany({
    where: {
      occursOnBlackWhale: true,
      ...(spoilerLimit === null ? {} : { chapter: { number: { lte: spoilerLimit } } }),
    },
    orderBy: [{ chapter: { number: 'desc' } }, { sequence: 'desc' }],
    include: { chapter: true },
    take: 200,
  })
  return events.map((event) => ({
    id: event.id,
    chapter: event.chapter.number,
    sequence: event.sequence,
    title: event.title,
  }))
}
