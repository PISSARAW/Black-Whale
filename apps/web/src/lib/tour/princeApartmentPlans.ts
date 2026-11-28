import type { Blueprint, Polygon, Space, Vec2 } from './types'
import {
  pointInPolygon,
  polygonContains,
  polygonsOverlap,
  structureFootprint,
} from './geometry'

/**
 * Unmeasured transcription of the fourteen apartment cutaways in chapter 363.
 *
 * The panel is an oblique drawing, not a dimensioned architectural plan.  The
 * values below therefore preserve the visible relative partition positions in
 * a common 21 x 20.4 m visiting frame; they must not be presented as surveyed
 * dimensions.  Keeping the transcription here makes `/ship` and `/tour` read
 * one geometry instead of maintaining a hand-drawn SVG and a second 3D plan.
 */
export interface PrinceApartmentPartition {
  room: number
  /** Half-width of the entrance passage. */
  entrance: number
  /** Rear edge of the service/entrance band. */
  serviceRear: number
  kitchenRear: number
  diningRear: number
  privateFront: number
  bathroomLeft: number
  wcLeft: number
  wcFront: number
  wcRear: number
}

export const PRINCE_APARTMENT_PARTITIONS: readonly PrinceApartmentPartition[] = [
  {
    room: 1001,
    entrance: 1.5,
    serviceRear: -2.7,
    kitchenRear: -6.05,
    diningRear: 0.3,
    privateFront: 5.7,
    bathroomLeft: 4.75,
    wcLeft: -3.7,
    wcFront: -6.45,
    wcRear: -4.25,
  },
  {
    room: 1002,
    entrance: 1.7,
    serviceRear: -3.05,
    kitchenRear: -5.45,
    diningRear: 0.65,
    privateFront: 5.7,
    bathroomLeft: 4.5,
    wcLeft: -4.25,
    wcFront: -6.8,
    wcRear: -4.55,
  },
  {
    room: 1003,
    entrance: 1.45,
    serviceRear: -2.6,
    kitchenRear: -5.7,
    diningRear: 0.3,
    privateFront: 5.35,
    bathroomLeft: 5.0,
    wcLeft: -3.65,
    wcFront: -6.15,
    wcRear: -4.0,
  },
  {
    room: 1004,
    entrance: 1.5,
    serviceRear: -2.7,
    kitchenRear: -5.25,
    diningRear: 0.3,
    privateFront: 5.7,
    bathroomLeft: 4.5,
    wcLeft: -4.45,
    wcFront: -7.0,
    wcRear: -4.7,
  },
  {
    room: 1005,
    entrance: 1.5,
    serviceRear: -2.7,
    kitchenRear: -6.2,
    diningRear: 0.3,
    privateFront: 5.7,
    bathroomLeft: 5.15,
    wcLeft: -3.55,
    wcFront: -6.35,
    wcRear: -4.15,
  },
  {
    room: 1006,
    entrance: 1.6,
    serviceRear: -2.9,
    kitchenRear: -5.6,
    diningRear: 0.45,
    privateFront: 5.8,
    bathroomLeft: 4.3,
    wcLeft: -4.05,
    wcFront: -6.65,
    wcRear: -4.4,
  },
  {
    room: 1007,
    entrance: 1.4,
    serviceRear: -2.55,
    kitchenRear: -5.95,
    diningRear: 0.25,
    privateFront: 5.5,
    bathroomLeft: 4.8,
    wcLeft: -3.8,
    wcFront: -6.25,
    wcRear: -4.05,
  },
  {
    room: 1008,
    entrance: 1.9,
    serviceRear: -3.3,
    kitchenRear: -5.15,
    diningRear: 0.95,
    privateFront: 5.7,
    bathroomLeft: 4.5,
    wcLeft: -3.9,
    wcFront: -6.3,
    wcRear: -4.2,
  },
  {
    room: 1009,
    entrance: 1.3,
    serviceRear: -2.4,
    kitchenRear: -6.1,
    diningRear: -0.05,
    privateFront: 5.25,
    bathroomLeft: 5.05,
    wcLeft: -3.6,
    wcFront: -6.4,
    wcRear: -4.2,
  },
  {
    room: 1010,
    entrance: 1.65,
    serviceRear: -3.0,
    kitchenRear: -5.7,
    diningRear: 0.6,
    privateFront: 5.9,
    bathroomLeft: 4.2,
    wcLeft: -4.15,
    wcFront: -6.75,
    wcRear: -4.5,
  },
  {
    room: 1011,
    entrance: 1.5,
    serviceRear: -2.7,
    kitchenRear: -5.8,
    diningRear: 0.35,
    privateFront: 5.65,
    bathroomLeft: 4.55,
    wcLeft: -3.9,
    wcFront: -6.55,
    wcRear: -4.3,
  },
  {
    room: 1012,
    entrance: 1.75,
    serviceRear: -3.1,
    kitchenRear: -5.35,
    diningRear: 0.75,
    privateFront: 5.7,
    bathroomLeft: 4.5,
    wcLeft: -4.35,
    wcFront: -6.9,
    wcRear: -4.6,
  },
  {
    room: 1013,
    entrance: 1.2,
    serviceRear: -2.25,
    kitchenRear: -5.7,
    diningRear: 0.3,
    privateFront: 5.1,
    bathroomLeft: 5.25,
    wcLeft: -3.45,
    wcFront: -6.2,
    wcRear: -3.95,
  },
  {
    room: 1014,
    entrance: 1.55,
    serviceRear: -2.8,
    kitchenRear: -5.7,
    diningRear: 0.5,
    privateFront: 5.75,
    bathroomLeft: 4.45,
    wcLeft: -4.0,
    wcFront: -6.6,
    wcRear: -4.35,
  },
] as const

const X0 = -10.5
const X1 = 10.5
const Z0 = -10.2
const Z1 = 10.2

export function princeApartmentFootprints(
  partition: PrinceApartmentPartition,
): Record<string, Polygon> {
  const e = partition.entrance
  const s = partition.serviceRear
  const k = partition.kitchenRear
  const d = partition.diningRear
  // These private-room and WC limits already anchor detailed manga cameras,
  // beds and bathroom props. Keep those established coordinates stable until
  // a panel supplies enough unobstructed geometry to move the whole scene.
  const p = 5.7
  const b = 4.5
  const w = -3.9
  const wf = -6.3
  const wr = -4.2
  return {
    servants: [
      [X0, Z0],
      [-e, Z0],
      [-e, wf],
      [w, wf],
      [w, wr],
      [-e, wr],
      [-e, s],
      [X0, s],
    ],
    'servants-wc': [
      [w, wf],
      [-e, wf],
      [-e, wr],
      [w, wr],
    ],
    entrance: [
      [-e, Z0],
      [e, Z0],
      [e, s],
      [-e, s],
    ],
    kitchen: [
      [e, Z0],
      [X1, Z0],
      [X1, k],
      [e, k],
    ],
    dining: [
      [e, k],
      [X1, k],
      [X1, d],
      [e, d],
    ],
    living: [
      [X0, s],
      [e, s],
      [e, d],
      [X1, d],
      [X1, p],
      [X0, p],
    ],
    bedroom: [
      [X0, p],
      [b, p],
      [b, Z1],
      [X0, Z1],
    ],
    bathroom: [
      [b, p],
      [X1, p],
      [X1, Z1],
      [b, Z1],
    ],
  }
}

const bounds = (polygon: Polygon) => ({
  x0: Math.min(...polygon.map(([x]) => x)),
  x1: Math.max(...polygon.map(([x]) => x)),
  z0: Math.min(...polygon.map(([, z]) => z)),
  z1: Math.max(...polygon.map(([, z]) => z)),
})

function remapPoint(point: Vec2, from: Polygon, to: Polygon): Vec2 {
  const a = bounds(from)
  const b = bounds(to)
  const u = a.x1 === a.x0 ? 0.5 : (point[0] - a.x0) / (a.x1 - a.x0)
  const v = a.z1 === a.z0 ? 0.5 : (point[1] - a.z0) / (a.z1 - a.z0)
  return [b.x0 + u * (b.x1 - b.x0), b.z0 + v * (b.z1 - b.z0)]
}

const internalMatch = (id: string) =>
  id.match(/^tier-1-royal-residential-sector-room-(10(?:0[1-9]|1[0-4]))-(.+)$/)

/** Apply the shared 2D/3D transcription while preserving all existing scene ids. */
export function applyPrinceApartmentPlans(source: Blueprint): Blueprint {
  const oldSpaces = new Map(source.spaces.map((space) => [space.id, space]))
  const layouts = new Map(
    PRINCE_APARTMENT_PARTITIONS.map((entry) => [entry.room, princeApartmentFootprints(entry)]),
  )
  const spaces = source.spaces.map((space): Space => {
    const match = internalMatch(space.id)
    if (!match) return space
    const footprint = layouts.get(Number(match[1]))?.[match[2]]
    return footprint ? { ...space, footprint } : space
  })
  const newSpaces = new Map(spaces.map((space) => [space.id, space]))

  const mapInSpace = (point: Vec2, spaceId: string): Vec2 => {
    const oldSpace = oldSpaces.get(spaceId)
    const newSpace = newSpaces.get(spaceId)
    return oldSpace && newSpace ? remapPoint(point, oldSpace.footprint, newSpace.footprint) : point
  }

  const fitInSpace = <T extends Blueprint['structures'][number]>(structure: T, space: Space): T => {
    const fits = (candidate: T) =>
      structureFootprint(candidate).every((corner) => pointInPolygon(corner, space.footprint))
    if (fits(structure)) return structure
    for (let radius = 0.1; radius <= 3; radius += 0.1) {
      for (let step = 0; step < 24; step += 1) {
        const angle = (step / 24) * Math.PI * 2
        const candidate = {
          ...structure,
          at: [
            structure.at[0] + Math.cos(angle) * radius,
            structure.at[1] + Math.sin(angle) * radius,
          ] as Vec2,
        }
        if (fits(candidate)) return candidate
      }
    }
    return structure
  }

  const structures = source.structures.map((structure) => {
    if (!internalMatch(structure.spaceId)) return structure
    const newSpace = newSpaces.get(structure.spaceId)!
    // Manga furniture and staged bodies already share exact coordinates. Keep
    // them stable whenever the transcribed partition still contains them and
    // nudge only an item that would otherwise cross its corrected wall.
    return fitInSpace(structure, newSpace)
  })

  const placed: typeof structures = []
  const overlapsPlaced = (candidate: (typeof structures)[number]) => {
    const outline = structureFootprint(candidate)
    return placed.some((other) => {
      if (other.spaceId !== candidate.spaceId) return false
      const otherOutline = structureFootprint(other)
      return (
        polygonsOverlap(outline, otherOutline) &&
        !polygonContains(outline, otherOutline) &&
        !polygonContains(otherOutline, outline)
      )
    })
  }
  for (const structure of structures) {
    if (!internalMatch(structure.spaceId) || !overlapsPlaced(structure)) {
      placed.push(structure)
      continue
    }
    const space = newSpaces.get(structure.spaceId)!
    let resolved = structure
    outer: for (let radius = 0.1; radius <= 2; radius += 0.1) {
      for (let step = 0; step < 24; step += 1) {
        const angle = (step / 24) * Math.PI * 2
        const candidate = fitInSpace(
          {
            ...structure,
            at: [
              structure.at[0] + Math.cos(angle) * radius,
              structure.at[1] + Math.sin(angle) * radius,
            ] as Vec2,
          },
          space,
        )
        if (!overlapsPlaced(candidate)) {
          resolved = candidate
          break outer
        }
      }
    }
    placed.push(resolved)
  }

  const doors = source.doors.map((door) => {
    const owner = internalMatch(door.a) ? door.a : internalMatch(door.b) ? door.b : null
    return owner ? { ...door, at: mapInSpace(door.at, owner) } : door
  })
  const links = source.links.map((link) =>
    link.atTo && internalMatch(link.to) ? { ...link, atTo: mapInSpace(link.atTo, link.to) } : link,
  )

  return { ...source, spaces, structures: placed, doors, links }
}
