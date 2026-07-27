import { isActiveAt, type OrderedEvent, type TemporalRecord } from '@black-whale/domain'

// ──────────────────────────────────────────────
// Database rows
// ──────────────────────────────────────────────

/** The Location columns this engine reads. */
export interface LocationRow {
  id: string
  name: string
  slug?: string | null
  parentLocationId?: string | null
  mapElementId?: string | null
}

/** A narrative event with the chapter its ordering depends on. */
export type EventRow = OrderedEvent & { id: string }

/** A Presence joined with the events that bound it and its location. */
export type PresenceRow = TemporalRecord & {
  entityId: string
  entityType: string
  locationId?: string | null
  location?: LocationRow | null
}

/**
 * The slice of PrismaClient this engine needs, declared here so the package
 * stays independent of the generated client. Query arguments are opaque: they
 * are forwarded untouched.
 */
interface PrismaClient {
  location: {
    findMany: (args?: unknown) => Promise<LocationRow[]>
    findFirst: (args?: unknown) => Promise<LocationRow | null>
  }
  narrativeEvent: {
    findUnique: (args?: unknown) => Promise<EventRow | null>
  }
  presence: {
    findMany: (args?: unknown) => Promise<PresenceRow[]>
    findFirst: (args?: unknown) => Promise<PresenceRow | null>
  }
}

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

export interface LocationNode {
  id: string
  parentId?: string
  name: string
  deck?: number
  /** SVG geometry string or ID */
  geometryId?: string
  capacity?: number
  entrances: string[]
  exits: string[]
  accessRules: string[]
}

export interface ShipLayer {
  deck: number
  label: string
  zones: LocationNode[]
}

export interface MapState {
  atEventId: string
  layers: ShipLayer[]
  /** entityId → locationId */
  entityPositions: Record<string, string>
}

// ──────────────────────────────────────────────
// Interface
// ──────────────────────────────────────────────

export interface IMapEngine {
  /** Return the full layered map with entity positions at a given event */
  getMapState(eventId: string): Promise<MapState>

  /** Find the location of a specific entity at a given event */
  getEntityLocation(entityId: string, eventId: string): Promise<LocationNode | null>

  /** Get all entities present in a location at a given event */
  getEntitiesAt(locationId: string, eventId: string): Promise<string[]>

  /** Return all accessible locations from a given location */
  getNeighbors(locationId: string): Promise<LocationNode[]>
}

// ──────────────────────────────────────────────
// Helper Functions
// ──────────────────────────────────────────────

/**
 * Extract deck number from location slug or parent hierarchy
 * Tier locations have slugs like 'tier-1', 'tier-2', etc.
 */
function getDeckFromLocation(
  location: LocationRow,
  allLocations: LocationRow[],
): number | undefined {
  if (location.slug?.startsWith('tier-')) {
    const match = location.slug.match(/tier-(\d+)/)
    if (match) {
      return parseInt(match[1])
    }
  }

  if (location.parentLocationId) {
    const parent = allLocations.find((l) => l.id === location.parentLocationId)
    if (parent) {
      return getDeckFromLocation(parent, allLocations)
    }
  }

  return undefined
}

/**
 * Convert a database Location to a LocationNode
 */
function toLocationNode(dbLocation: LocationRow, allLocations: LocationRow[]): LocationNode {
  const deck = getDeckFromLocation(dbLocation, allLocations)

  return {
    id: dbLocation.id,
    parentId: dbLocation.parentLocationId || undefined,
    name: dbLocation.name,
    deck,
    geometryId: dbLocation.mapElementId || undefined,
    capacity: undefined,
    entrances: [],
    exits: [],
    accessRules: [],
  }
}

/**
 * Build layer structure from flat locations list
 */
function buildLayers(locations: LocationRow[]): ShipLayer[] {
  const nodes: LocationNode[] = locations.map((l) => toLocationNode(l, locations))

  const deckMap = new Map<number, LocationNode[]>()

  for (const node of nodes) {
    if (node.deck !== undefined) {
      if (!deckMap.has(node.deck)) {
        deckMap.set(node.deck, [])
      }
      deckMap.get(node.deck)!.push(node)
    }
  }

  const layers: ShipLayer[] = []
  const sortedDecks = Array.from(deckMap.keys()).sort((a, b) => a - b)

  for (const deck of sortedDecks) {
    layers.push({
      deck,
      label: `Tier ${deck}`,
      zones: deckMap.get(deck) || [],
    })
  }

  return layers
}

// ──────────────────────────────────────────────
// MapEngine Implementation
// ──────────────────────────────────────────────

export class MapEngine implements IMapEngine {
  constructor(private readonly prisma: PrismaClient) {}

  private async resolveEvent(eventId: string): Promise<EventRow | null> {
    const event = await this.prisma.narrativeEvent.findUnique({
      where: { id: eventId },
      include: { chapter: true },
    })
    return event
  }

  private async getActivePresencesAtEvent(targetEvent: EventRow): Promise<PresenceRow[]> {
    const presences = await this.prisma.presence.findMany({
      include: {
        location: true,
        fromEvent: { include: { chapter: true } },
        untilEvent: { include: { chapter: true } },
      },
    })
    return presences.filter((presence) => isActiveAt(presence, targetEvent))
  }

  async getMapState(eventId: string): Promise<MapState> {
    const targetEvent = await this.resolveEvent(eventId)
    if (!targetEvent) {
      throw new Error(`Event not found: ${eventId}`)
    }

    const allLocations = await this.prisma.location.findMany({
      orderBy: { name: 'asc' },
    })

    const activePresences = await this.getActivePresencesAtEvent(targetEvent)

    const entityPositions: Record<string, string> = {}
    for (const presence of activePresences) {
      if (presence.locationId && presence.entityId) {
        entityPositions[presence.entityId] = presence.locationId
      }
    }

    const layers = buildLayers(allLocations)

    return {
      atEventId: eventId,
      layers,
      entityPositions,
    }
  }

  async getEntityLocation(entityId: string, eventId: string): Promise<LocationNode | null> {
    const targetEvent = await this.resolveEvent(eventId)
    if (!targetEvent) {
      return null
    }

    const presence = (await this.getActivePresencesAtEvent(targetEvent)).find(
      (candidate) => candidate.entityId === entityId,
    )

    if (!presence?.location || !presence.locationId) {
      return null
    }

    const allLocations = await this.prisma.location.findMany()

    return toLocationNode(presence.location, allLocations)
  }

  async getEntitiesAt(locationId: string, eventId: string): Promise<string[]> {
    const targetEvent = await this.resolveEvent(eventId)
    if (!targetEvent) {
      return []
    }

    const presences = (await this.getActivePresencesAtEvent(targetEvent)).filter(
      (presence) => presence.locationId === locationId,
    )

    return presences.map((p: { entityId: string }) => p.entityId)
  }

  async getNeighbors(locationId: string): Promise<LocationNode[]> {
    const allLocations = await this.prisma.location.findMany({
      where: {
        OR: [
          { id: locationId },
          { parentLocationId: locationId },
          { parentLocation: { id: locationId } },
        ],
      },
    })

    if (allLocations.length === 0) {
      return []
    }

    const location = allLocations.find((l) => l.id === locationId)
    if (!location) {
      return []
    }

    const children = allLocations.filter((l) => l.parentLocationId === locationId)
    const parent = allLocations.find((l) => l.id === location.parentLocationId)

    const neighbors: LocationNode[] = []

    if (parent) {
      neighbors.push(toLocationNode(parent, allLocations))
    }

    for (const child of children) {
      neighbors.push(toLocationNode(child, allLocations))
    }

    return neighbors
  }
}
