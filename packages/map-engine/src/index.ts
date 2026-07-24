import type { Location } from '@black-whale/domain'

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
// Stub
// ──────────────────────────────────────────────

export class MapEngine implements IMapEngine {
  async getMapState(eventId: string): Promise<MapState> {
    throw new Error(`MapEngine.getMapState not implemented — eventId: ${eventId}`)
  }

  async getEntityLocation(entityId: string, eventId: string): Promise<LocationNode | null> {
    throw new Error(`MapEngine.getEntityLocation not implemented — entityId: ${entityId}, eventId: ${eventId}`)
  }

  async getEntitiesAt(locationId: string, eventId: string): Promise<string[]> {
    throw new Error(`MapEngine.getEntitiesAt not implemented — locationId: ${locationId}, eventId: ${eventId}`)
  }

  async getNeighbors(locationId: string): Promise<LocationNode[]> {
    throw new Error(`MapEngine.getNeighbors not implemented — locationId: ${locationId}`)
  }
}
