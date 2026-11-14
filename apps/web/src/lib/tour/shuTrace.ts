import type { Ship } from './blueprint'
import { solidById, type TourWorld } from './hatsu'
import type { Apparition } from './apparitions'

export interface ShuTrace {
  until: number
  apparition: Apparition
}

interface ShuTraceOptions {
  ship: Ship
  world: TourWorld
  objectId: string
  now?: number
}

/** Preserve the aura left by an object whose Shu coating has just been released. */
export function shuTraceOf(options: ShuTraceOptions): ShuTrace | null {
  const { ship, world, objectId, now = Date.now() } = options
  const solid = solidById(ship, world, objectId)
  const space = solid ? ship.spaces.get(solid.spaceId) : null
  if (!solid || !space) return null

  const until = now + 10_000
  return {
    until,
    apparition: {
      id: `shu-trace:${objectId}:${until}`,
      kind: 'residue',
      spaceId: solid.spaceId,
      tierId: space.tierId,
      at: solid.at,
      y: solid.base + solid.height * 0.5,
      size: Math.max(0.25, Math.min(0.7, ...solid.size)),
      colour: 0xb9a6ff,
      stage: 0,
      hidden: true,
    },
  }
}

export const liveShuTraces = (traces: readonly ShuTrace[], now = Date.now()): ShuTrace[] =>
  traces.filter((trace) => trace.until > now)
