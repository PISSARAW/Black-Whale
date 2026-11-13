/**
 * Aura left behind where a technique did its damage, for Gyo to find.
 *
 * The archive records what an event did to the ship — a wall cut through, a
 * door forced — as `vestiges`, and the walk already honours them in the plan
 * (`planSealed` opens the wall). What it never showed is that a wall a Nen user
 * cut through is a wall with aura on it: the residue a reader in Gyo would see
 * at the seam and nobody else would. This draws that, and only that.
 *
 * Three lines it holds:
 *
 * - **Only Gyo.** Every trace is `hidden`, which the scene draws for a visitor
 *   in Gyo and for nobody else. A residue anyone could see would be a marker.
 * - **Only what the archive recorded.** One trace per vestige, at the seam it
 *   names. Nothing is inferred from who stood in the room.
 * - **Only aura's damage.** The two kinds below are the ones a technique
 *   leaves; a vestige of another kind would be the walk guessing who did it.
 */
import type { Apparition } from '../apparitions'
import { floorOf, type Ship } from '../blueprint'
import { centroid } from '../geometry-movement'
import type { Space, Vec2 } from '../types'
import type { TourAuraObject, TourAuraTrace, TourVestige } from './types'

const AURA_DAMAGE = new Set(['wall_cut', 'door_broken'])

/** Pale violet: not any one user's colour, since the residue does not say whose. */
const RESIDUE_COLOUR = 0xb9a6ff

/** How far from the room's middle towards the seam the trace hangs. */
const TOWARDS_SEAM = 0.7

function spaceFor(ship: Ship, key: string): Space | null {
  const direct = ship.spaces.get(key)
  if (direct) return direct
  for (const space of ship.spaces.values()) if (space.locationId === key) return space
  return null
}

/** Between the room's middle and the room it was opened onto, inside the room. */
function seamOf(space: Space, target: Space | null): Vec2 {
  const from = centroid(space)
  if (!target) return from
  const to = centroid(target)
  return [
    from[0] + (to[0] - from[0]) * TOWARDS_SEAM * 0.5,
    from[1] + (to[1] - from[1]) * TOWARDS_SEAM * 0.5,
  ]
}

interface ResidueInput {
  ship: Ship
  vestiges: Readonly<Record<string, readonly TourVestige[]>>
  /** The deck being walked: traces elsewhere are not built. */
  tierId: string
  traces?: readonly TourAuraTrace[]
  objects?: readonly TourAuraObject[]
  awakened?: boolean
}

function hashOffset(id: string): Vec2 {
  let hash = 0
  for (const character of id) hash = (hash * 31 + character.charCodeAt(0)) | 0
  const angle = ((hash >>> 0) % 360) * (Math.PI / 180)
  return [Math.cos(angle) * 0.45, Math.sin(angle) * 0.45]
}

export function residueApparitions({
  ship,
  vestiges,
  tierId,
  traces = [],
  objects = [],
  awakened = true,
}: ResidueInput): Apparition[] {
  const found: Apparition[] = []
  for (const [key, list] of Object.entries(vestiges)) {
    const space = spaceFor(ship, key)
    const tier = space ? ship.tiers.find((candidate) => candidate.id === space.tierId) : null
    if (!space || !tier || space.tierId !== tierId) continue
    list.forEach((vestige, index) => {
      if (!AURA_DAMAGE.has(vestige.type)) return
      const target = vestige.metadata?.target
        ? spaceFor(ship, String(vestige.metadata.target))
        : null
      found.push({
        id: `residue:${key}:${index}`,
        kind: 'residue',
        spaceId: space.id,
        tierId: space.tierId,
        at: seamOf(space, target),
        y: floorOf(space, tier) + 1.1,
        size: 0.55,
        colour: RESIDUE_COLOUR,
        stage: 0,
        hidden: true,
      })
    })
  }
  for (const source of [
    ...traces.map((trace) => ({ ...trace, visibility: 'gyo' as const, kind: 'trace' })),
    ...objects,
  ]) {
    if (!awakened) continue
    const space = spaceFor(ship, source.locationId)
    const tier = space ? ship.tiers.find((candidate) => candidate.id === space.tierId) : null
    if (!space || !tier || space.tierId !== tierId) continue
    const middle = centroid(space)
    const offset = hashOffset(source.anchor ?? source.id)
    found.push({
      id: `aura-source:${source.id}`,
      kind: 'residue',
      spaceId: space.id,
      tierId: space.tierId,
      at: [middle[0] + offset[0], middle[1] + offset[1]],
      y: floorOf(space, tier) + 0.9,
      size: source.kind === 'trace' ? 0.42 : 0.32,
      colour: RESIDUE_COLOUR,
      stage: 0,
      hidden: source.visibility === 'gyo',
    })
  }
  return found
}
