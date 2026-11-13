import { floorOf, type Ship } from '../blueprint'
import { centroid } from '../geometry-movement'
import type { Space, Vec2 } from '../types'

export interface AuraPlacementSource {
  id: string
  locationId: string
  anchor?: string
}

export interface AuraSourcePlacement {
  at: Vec2
  y: number
  space: Space
  approximate: boolean
}

interface PlacementInput {
  ship: Ship
  source: AuraPlacementSource
  tierId: string
}

const tierFor = (ship: Ship, space: Space) =>
  ship.tiers.find((candidate) => candidate.id === space.tierId) ?? null

function offsetFor(id: string): Vec2 {
  let hash = 0
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) | 0
  const angle = ((hash >>> 0) % 360) * (Math.PI / 180)
  return [Math.cos(angle) * 0.45, Math.sin(angle) * 0.45]
}

function anchored({ ship, source, tierId }: PlacementInput): AuraSourcePlacement | null {
  if (!source.anchor) return null
  const structure = ship.structures.find((candidate) => candidate.id === source.anchor)
  const space = structure ? ship.spaces.get(structure.spaceId) : ship.spaces.get(source.anchor)
  const tier = space ? tierFor(ship, space) : null
  if (!space || !tier || space.tierId !== tierId) return null
  return {
    space,
    at: structure?.at ?? centroid(space),
    y: floorOf(space, tier) + (structure ? structure.base + structure.height + 0.08 : 0.9),
    approximate: false,
  }
}

function approximate({ ship, source, tierId }: PlacementInput): AuraSourcePlacement | null {
  const direct = ship.spaces.get(source.locationId)
  const space =
    direct?.tierId === tierId
      ? direct
      : [...ship.spaces.values()].find(
          (candidate) => candidate.locationId === source.locationId && candidate.tierId === tierId,
        )
  const tier = space ? tierFor(ship, space) : null
  if (!space || !tier) return null
  const middle = centroid(space)
  const offset = offsetFor(source.id)
  return {
    space,
    at: [middle[0] + offset[0], middle[1] + offset[1]],
    y: floorOf(space, tier) + 0.9,
    approximate: true,
  }
}

/** Resolve declared anchors exactly; only sources without an anchor may fall back. */
export function auraSourcePlacement(input: PlacementInput): AuraSourcePlacement | null {
  return input.source.anchor ? anchored(input) : approximate(input)
}
