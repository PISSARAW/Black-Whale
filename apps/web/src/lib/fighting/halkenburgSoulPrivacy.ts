import { mapPhysicalBodies } from './physicalBodyMap'
import type { FightSide, FightState } from './types'

/** A falling body is visible; the exact consciousness drawn from the group is private. */
export function privateHalkenburgSouls(state: FightState, viewer: FightSide): FightState {
  return mapPhysicalBodies(state, (body) => {
    const soul = body.halkenburgSoul
    return soul && soul.owner !== viewer
      ? { ...body, halkenburgSoul: { ...soul, donor: undefined, motion: undefined } }
      : body
  })
}
