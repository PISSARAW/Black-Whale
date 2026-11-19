import { mapPhysicalBodies } from './physicalBodyMap'
import { corpseImplantContinues, usableCorpse } from './illumiCorpseImplant'
import type { FightState, FightSide } from './types'

/** Source cuts and physical loss cancel preparation without advancing its normal-frame clock. */
export function reconcileCorpsePreparations(state: FightState): FightState {
  return mapPhysicalBodies(state, (actor) => {
    const preparation = actor.corpsePreparation
    if (!preparation) return actor
    const side: FightSide | undefined =
      actor === state.player ? 'player' : actor === state.opponent ? 'opponent' : undefined
    const corpse = state.battlefield?.entities.find((entry) => entry.id === preparation.target)
    const live =
      side &&
      corpse &&
      usableCorpse(corpse) &&
      !corpse.controller &&
      corpseImplantContinues(state, side, corpse)
    return live ? actor : { ...actor, corpsePreparation: undefined }
  })
}
