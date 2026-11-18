import { mapPhysicalBodies, somePhysicalBody } from './physicalBodyMap'
import { physicalBodyAt } from './fightBodyIdentity'
import { illumiOriginAvailable } from './illumiDisguiseClock'
import { historicalPartExists } from './historicalCopyLifetime'
import { equippedDolphin } from './dolphinBorrowing'
import type { ArcadeFighter, FightSide, FightState } from './types'
import type { PreparedEntity } from './preparationTypes'

export function reconcileNeedleFaces(state: FightState): FightState {
  return mapPhysicalBodies(state, (actor) => cleanNeedleFace(state, actor))
}
function cleanNeedleFace(state: FightState, actor: ArcadeFighter): ArcadeFighter {
  const face = actor.needleFace
  if (!face) return actor
  if (!historicalPartExists(state, face.mediumCopyId)) return { ...actor, needleFace: undefined }
  if (!face.reshaping || !face.origin.source || face.origin.source === 'personal') return actor
  const owner = physicalBodyAt(state, face.owner, face.member)
  return owner && illumiOriginAvailable(state, owner, face.origin)
    ? actor
    : { ...actor, needleFace: { ...face, reshaping: false } }
}

export function cleanDetachedFaceNeedles(state: FightState, entry: PreparedEntity): PreparedEntity {
  const bundle = entry.detachedFaceNeedles ?? entry.disguisePinBundle ?? entry.corpsePinBundle
  return bundle && entry.present && !historicalPartExists(state, bundle.mediumCopyId)
    ? { ...entry, present: false }
    : entry
}

export function borrowedNeedleFaceBusy(state: FightState, side: FightSide): boolean {
  const member = state.teamMatch?.seats[side].active ?? 0
  const held = equippedDolphin(state[side])
  return somePhysicalBody(state, (actor) => {
    const face = actor.needleFace
    return Boolean(
      face?.reshaping &&
      face.owner === side &&
      face.member === member &&
      face.origin.source === 'dolphin' &&
      face.origin.theftId === held?.theftId,
    )
  })
}

/** Dismiss only this loan's shaping effect; real implanted metal is not conjured away. */
export function finishBorrowedNeedleFace(state: FightState, side: FightSide): FightState | null {
  if (!borrowedNeedleFaceBusy(state, side)) return null
  const held = equippedDolphin(state[side])!
  const member = state.teamMatch?.seats[side].active ?? 0
  return mapPhysicalBodies(state, (actor) => {
    const face = actor.needleFace
    return face?.reshaping &&
      face.owner === side &&
      face.member === member &&
      face.origin.source === 'dolphin' &&
      face.origin.theftId === held.theftId
      ? { ...actor, needleFace: { ...face, reshaping: false } }
      : actor
  })
}

export function anyCopiedNeedleFaceBusy(state: FightState): boolean {
  return somePhysicalBody(state, (actor) => {
    const face = actor.needleFace
    return Boolean(face?.reshaping && face.origin.source && face.origin.source !== 'personal')
  })
}
