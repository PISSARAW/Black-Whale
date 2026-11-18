import { canAct } from './fightActorState'
import { freeDeviceHand } from './deviceHands'
import { historicalPartExists } from './historicalCopyLifetime'
import type { ArsenalCommand, ArsenalOption } from './retrospectiveTypes'
import type { FightSide, FightState } from './types'
import type { PreparedEntity } from './preparationTypes'

/** Physical extraction is available to the affected body; it does not require Illumi's Hatsu. */
export function removeNeedleFace(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    face = actor.needleFace
  if (!state.battlefield || !face || !canAct(actor) || actor.attack || actor.hanzoProjection)
    return state
  if (!freeDeviceHand(state, side) || !historicalPartExists(state, face.mediumCopyId)) return state
  const entry: PreparedEntity = {
    id: `removed:${face.needles[0]}`,
    kind: 'needles',
    owner: side,
    x: actor.x + actor.facing * 2,
    y: actor.y,
    present: true,
    health: 3,
    material: face.mediumCopyId ? 'nen' : 'real',
    detachedFaceNeedles: { needles: face.needles, mediumCopyId: face.mediumCopyId },
  }
  return {
    ...state,
    [side]: { ...actor, needleFace: undefined, arenaRecovery: 18 },
    battlefield: { ...state.battlefield, entities: [...state.battlefield.entities, entry] },
  }
}

export function performNeedleFaceRemoval(
  state: FightState,
  side: FightSide,
  _command: ArsenalCommand,
): FightState {
  return removeNeedleFace(state, side)
}

export function needleFaceRemovalOptions(state: FightState, side: FightSide): ArsenalOption[] {
  if (!state[side].needleFace) return []
  return [
    {
      command: { action: 'needle-face-remove' },
      labelFr: 'Visage · Retirer les trois aiguilles',
      labelEn: 'Face · Remove the three needles',
      ready: removeNeedleFace(state, side) !== state,
      conditionFr:
        'Retrait physique avec une main libre après la douleur d’impact. Les mêmes aiguilles sont déposées ; aucune guérison de Needle People ni restitution de PV.',
      conditionEn:
        'Physical removal with a free hand after impact pain. The same needles are put down; no healing of Needle People or HP restoration.',
    },
  ]
}
