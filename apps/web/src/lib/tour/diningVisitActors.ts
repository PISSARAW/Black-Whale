import type { Apparition } from './apparitions'
import { floorOf, type Ship } from './blueprint'
import { DINING_VISIT_SPACES as spaces } from './diningVisit'
import type { TourWorldMode } from './simulation/mode'
import type { Vec2 } from './types'

interface Routine {
  id: string
  spaceId: string
  from: Vec2
  to: Vec2
  heading: number
  role: 'witness' | 'steward'
  pose: 'idle' | 'wipe-table'
  rest: number
  offset: number
}

const ROUTINES: readonly Routine[] = [
  {
    id: 'dining-visit-passenger',
    spaceId: spaces.transverse,
    from: [15, 8.9],
    to: [29.2, 8.9],
    heading: 0,
    role: 'witness',
    pose: 'idle',
    rest: 1.5,
    offset: 4,
  },
  {
    id: 'dining-visit-steward',
    spaceId: spaces.hall,
    from: [40, 13],
    to: [42, 13],
    heading: Math.PI,
    role: 'steward',
    pose: 'wipe-table',
    rest: 4,
    offset: 1,
  },
]

/** Ambient reconstruction. These people have no place in the canonical cast or Nen simulation. */
export function diningVisitActors(ship: Ship, tierId: string, mode: TourWorldMode): Apparition[] {
  if (mode !== 'FREE_LIFE' || tierId !== 'tier-5') return []
  const found: Apparition[] = []
  for (const actor of ROUTINES) {
    const space = ship.spaces.get(actor.spaceId)
    const tier = ship.plans.get(tierId)?.tier
    if (!space || !tier) continue
    found.push({
      id: actor.id,
      kind: 'avatar',
      spaceId: space.id,
      tierId,
      at: actor.from,
      y: floorOf(space, tier),
      heading: actor.heading,
      size: 1.72,
      colour: 0x79888c,
      stage: 0,
      hidden: false,
      human: {
        role: actor.role,
        pose: actor.pose,
        pace: { from: actor.from, to: actor.to, rest: actor.rest, offset: actor.offset, speed: 1 },
      },
    })
  }
  return found
}
