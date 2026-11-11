import type { Arena } from '../hunt/arena'
import { theShip } from '../tour/blueprint'
import { lamplightOf } from '../tour/light'

export interface PerceptionEnvironment {
  visibility: number
  ambientNoise: number
  surfaceNoise: number
}

export type InfiltrationEnvironment = Map<string, PerceptionEnvironment>

/** Shares the tour's declared room light with stealth and derives ship acoustics by use. */
export function buildInfiltrationEnvironment(arena: Arena): InfiltrationEnvironment {
  const tier = theShip().plans.get(arena.tierId)?.tier
  if (!tier) return new Map()
  return new Map(
    arena.spaces.map((space) => {
      const light = lamplightOf(space, tier)
      const machinery = ['infrastructure', 'storage'].includes(space.category)
      const publicCrowd = space.category === 'public'
      return [
        space.id,
        {
          visibility: clamp(light.power * (1 - light.dead), 0.35, 1.15),
          ambientNoise: machinery ? 0.42 : publicCrowd ? 0.28 : 0.08,
          surfaceNoise: machinery || space.category === 'corridor' ? 1.25 : 0.9,
        },
      ]
    }),
  )
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value))
}
