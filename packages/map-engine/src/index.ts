import type { Location, Presence } from '@black-whale/domain'

// Minimal PrismaClient interface for our needs
interface PrismaClient {
  location: {
    findMany: (args?: any) => Promise<any[]>
    findFirst: (args?: any) => Promise<any | null>
  }
  narrativeEvent: {
    findUnique: (args?: any) => Promise<any | null>
  }
  presence: {
    findMany: (args?: any) => Promise<any[]>
    findFirst: (args?: any) => Promise<any | null>
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
function getDeckFromLocation(location: any, allLocations: any[]): number | undefined {
  if (location.slug?.startsWith('tier-')) {
    const match = location.slug.match(/tier-(\d+)/)
    if (match) {
      return parseInt(match[1])
    }
  }
  
  if (location.parentLocationId) {
    const parent = allLocations.find(l => l.id === location.parentLocationId)
    if (parent) {
      return getDeckFromLocation(parent, allLocations)
    }
  }
  
  return undefined
}

/**
 * Convert a database Location to a LocationNode
 */
function toLocationNode(dbLocation: any, allLocations: any[]): LocationNode {
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
    accessRules: []
  }
}

/**
 * Build layer structure from flat locations list
 */
function buildLayers(locations: any[]): ShipLayer[] {
  const nodes: LocationNode[] = locations.map(l => toLocationNode(l, locations))
  
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
      zones: deckMap.get(deck) || []
    })
  }
  
  return layers
}

// ──────────────────────────────────────────────
// MapEngine Implementation
// ──────────────────────────────────────────────

export class MapEngine implements IMapEngine {
  constructor(private readonly prisma: PrismaClient) {}

  private async resolveSequence(eventId: string): Promise<number | undefined> {
    const event = await this.prisma.narrativeEvent.findUnique({
      where: { id: eventId },
      select: { sequence: true }
    })
    return event?.sequence
  }

  private async getActivePresencesAtSequence(sequence: number): Promise<Presence[]> {
    const presences = await this.prisma.presence.findMany({
      where: {
        fromEvent: {
          sequence: { lte: sequence }
        },
        OR: [
          { untilEventId: null },
          {
            untilEvent: {
              sequence: { gt: sequence }
            }
          }
        ]
      },
      include: {
        location: true
      }
    })
    return presences as any
  }

  async getMapState(eventId: string): Promise<MapState> {
    const sequence = await this.resolveSequence(eventId)
    if (sequence === undefined) {
      throw new Error(`Event not found: ${eventId}`)
    }

    const allLocations = await this.prisma.location.findMany({
      orderBy: { name: 'asc' }
    })

    const activePresences = await this.getActivePresencesAtSequence(sequence)

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
      entityPositions
    }
  }

  async getEntityLocation(entityId: string, eventId: string): Promise<LocationNode | null> {
    const sequence = await this.resolveSequence(eventId)
    if (sequence === undefined) {
      return null
    }

    const presence = await this.prisma.presence.findFirst({
      where: {
        entityId,
        fromEvent: {
          sequence: { lte: sequence }
        },
        OR: [
          { untilEventId: null },
          {
            untilEvent: {
              sequence: { gt: sequence }
            }
          }
        ]
      },
      include: {
        location: true
      }
    })

    if (!presence || !presence.locationId) {
      return null
    }

    const allLocations = await this.prisma.location.findMany()
    
    return toLocationNode(presence.location, allLocations)
  }

  async getEntitiesAt(locationId: string, eventId: string): Promise<string[]> {
    const sequence = await this.resolveSequence(eventId)
    if (sequence === undefined) {
      return []
    }

    const presences = await this.prisma.presence.findMany({
      where: {
        locationId,
        fromEvent: {
          sequence: { lte: sequence }
        },
        OR: [
          { untilEventId: null },
          {
            untilEvent: {
              sequence: { gt: sequence }
            }
          }
        ]
      }
    })

    return presences.map((p: { entityId: string }) => p.entityId)
  }

  async getNeighbors(locationId: string): Promise<LocationNode[]> {
    const allLocations = await this.prisma.location.findMany({
      where: {
        OR: [
          { id: locationId },
          { parentLocationId: locationId },
          { parentLocation: { id: locationId } }
        ]
      }
    })

    if (allLocations.length === 0) {
      return []
    }

    const location = allLocations.find((l: any) => l.id === locationId)
    if (!location) {
      return []
    }

    const children = allLocations.filter((l: any) => l.parentLocationId === locationId)
    const parent = allLocations.find((l: any) => l.id === location.parentLocationId)
    
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
