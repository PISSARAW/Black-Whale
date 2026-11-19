import { mapPhysicalBodies } from './physicalBodyMap'
import { documentById } from './paperDocuments'
import { visibleArenaMap } from './arenaMap'
import { ownsDowsing, dowsingHandReady } from './dowsingRules'
import { voluntaryNenAvailable } from './nenAccess'
import type { FightState } from './types'

/** A copied sheet's lifetime and a Nen cut also apply during frozen combat. */
export function reconcileDowsingMapMatter(state: FightState): FightState {
  return mapPhysicalBodies(state, (actor) => {
    const id = actor.dowsingMapSearch?.mapId ?? actor.dowsingMapPose?.mapId
    if (!id) return actor
    const map = documentById(state, id)
    if (map && visibleArenaMap(state, map) && mapNenLive(state, actor)) return actor
    return { ...actor, dowsingMapSearch: undefined, dowsingMapPose: undefined }
  })
}

function mapNenLive(state: FightState, actor: FightState['player']): boolean {
  if (!voluntaryNenAvailable(actor)) return false
  if (!actor.dowsingMapSearch) return true // Redacted visible manifestation.
  if (!ownsDowsing(actor)) return false
  const side = state.player === actor ? 'player' : state.opponent === actor ? 'opponent' : undefined
  return side ? dowsingHandReady(state, side) : true
}
