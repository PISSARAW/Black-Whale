import { mapPhysicalBodies } from './physicalBodyMap'
import type { FightSide, FightState } from './types'

/** The wearer sees real pins; only their Nen's creator receives acquisition and theft details. */
export function privateNeedleFaces(state: FightState, viewer: FightSide): FightState {
  return mapPhysicalBodies(state, (actor) => {
    const face = actor.needleFace
    return face && face.owner !== viewer ? { ...actor, needleFace: { ...face, origin: {} } } : actor
  })
}
