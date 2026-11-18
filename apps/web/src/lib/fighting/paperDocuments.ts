import { historicalPartExists } from './historicalCopyLifetime'
import { physicalBodyAt } from './fightBodyIdentity'
import { bodyPartFunctional } from './bodyDamage'
import { sleepingBody } from './hanzoProjection'
import { freeDeviceHand, physicalHandsBusy } from './deviceHands'
import type { PaperBodyRef } from './paperDocumentTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export function scenarioPaperDocument(side: FightSide): PreparedEntity {
  return {
    id: `${side}:scenario-document`,
    kind: 'paper',
    owner: side,
    x: side === 'player' ? 26 : 74,
    y: 0,
    present: true,
    material: 'real',
    health: 2,
    document: { text: 'Document 01 · 18:00' },
  }
}

export function paperBodyRef(state: FightState, side: FightSide): PaperBodyRef {
  return { owner: side, member: state.teamMatch?.seats[side].active ?? 0 }
}
export function samePaperBody(a: PaperBodyRef, b: PaperBodyRef): boolean {
  return a.owner === b.owner && a.member === b.member
}
export function actualDocuments(state: FightState): PreparedEntity[] {
  return (state.battlefield?.entities ?? []).filter((entry) => documentExists(state, entry))
}
export function documentExists(state: FightState, entry: PreparedEntity): boolean {
  return Boolean(
    entry.document &&
    entry.present &&
    entry.health > 0 &&
    historicalPartExists(state, entry.document.sheetCopyId),
  )
}
export function documentById(state: FightState, id?: string): PreparedEntity | undefined {
  return actualDocuments(state).find((entry) => entry.id === id)
}
export function heldDocuments(state: FightState, side: FightSide): PreparedEntity[] {
  const body = paperBodyRef(state, side)
  return actualDocuments(state).filter(
    (entry) => entry.document?.holder && samePaperBody(entry.document.holder, body),
  )
}

export function originalDocumentInLeftHand(
  state: FightState,
  side: FightSide,
  id: string,
): boolean {
  const holder = documentById(state, id)?.document?.holder
  return Boolean(
    holder && holder.hand === 'left' && samePaperBody(holder, paperBodyRef(state, side)),
  )
}

export function documentPosition(state: FightState, entry: PreparedEntity) {
  const ref = entry.document?.holder
  const found = ref && physicalBodyAt(state, ref.owner, ref.member)
  const actor = found && sleepingBody(found)
  return actor ? { x: actor.x + actor.facing * 2, y: actor.y + 6 } : { x: entry.x, y: entry.y }
}

/** Contact is checked again at emission; holding an unrelated book supplies no extra hand. */
export function touchesDocument(
  state: FightState,
  side: FightSide,
  entry: PreparedEntity,
): boolean {
  if (
    !documentExists(state, entry) ||
    state[side].hanzoProjection ||
    physicalHandsBusy(state[side])
  )
    return false
  const holder = entry.document!.holder
  if (holder && samePaperBody(holder, paperBodyRef(state, side)))
    return validDocumentGrip(state[side], holder.hand)
  if (!freeDeviceHand(state, side)) return false
  const point = documentPosition(state, entry)
  return (
    Math.abs(point.x - state[side].x) <= 4 &&
    point.y >= state[side].y - 1 &&
    point.y <= state[side].y + 9
  )
}

export function cleanDocumentMatter(state: FightState, entry: PreparedEntity): PreparedEntity {
  if (!entry.document) return entry
  if (!historicalPartExists(state, entry.document.sheetCopyId))
    return {
      ...entry,
      present: false,
      document: { ...entry.document, holder: undefined, textures: undefined },
    }
  const holder = entry.document.holder
  if (!holder) return entry
  const found = physicalBodyAt(state, holder.owner, holder.member)
  const actor = found && sleepingBody(found)
  if (actor && actor.health > 0 && validDocumentGrip(actor, holder.hand)) return entry
  const point = actor ? { x: actor.x + actor.facing * 2, y: actor.y } : entry
  return {
    ...entry,
    x: point.x,
    y: point.y,
    document: { ...entry.document, holder: undefined, outward: false, velocityY: 0 },
  }
}

function validDocumentGrip(
  actor: import('./types').ArcadeFighter,
  hand: import('./deviceHands').DeviceHand,
): boolean {
  return hand !== 'left' || bodyPartFunctional(actor, 'left-hand')
}
