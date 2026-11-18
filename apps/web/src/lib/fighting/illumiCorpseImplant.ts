import { corpseHeadContact } from './preparedCorpseBody'
import { canAct } from './fightActorState'
import {
  freeDeviceHand,
  physicalHandOccupancy,
  physicalHandsBusy,
  type DeviceHand,
} from './deviceHands'
import { newGumSource } from './bungeeSource'
import { paperBodyRef } from './paperDocuments'
import { corpseNenReady, corpseOriginAvailable } from './illumiCorpseAccess'
import {
  corpseMetalReady,
  corpseMetalPlan,
  preparationMetalReady,
  attachCorpseMetal,
} from './illumiCorpseMetal'
import { corpseLoanUsed, spendCorpseUse } from './illumiCorpseDolphin'
import { updateEntity, liveEntity } from './preparationWorld'
import { witnessedHatsuState } from './nenWitness'
import { judgmentActionBreach } from './judgmentAction'
import { ILLUMI_IMPLANT } from './illumiState'
import type { CorpsePreparation } from './illumiCorpseTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightSide, FightState } from './types'

export const CORPSE_PREPARE_FRAMES = 60
export function usableCorpse(entry: PreparedEntity): boolean {
  return entry.kind === 'corpse' && entry.material === 'real' && liveEntity(entry)
}
export function beginCorpseImplant(
  state: FightState,
  side: FightSide,
  corpse: PreparedEntity,
): FightState {
  const hand = freeDeviceHand(state, side)
  if (!hand || !canBeginCorpseImplant(state, side, corpse)) return state
  const breach = judgmentActionBreach({
    state,
    side,
    kind: 'special',
    moveId: ILLUMI_IMPLANT,
    auraCharged: false,
  })
  if (breach) return breach
  const preparation = createCorpsePreparation(state, side, { corpse, hand })
  const paid = spendCorpseUse(state, side, 30)
  return { ...paid, [side]: { ...paid[side], corpsePreparation: preparation } }
}
function canBeginCorpseImplant(
  state: FightState,
  side: FightSide,
  corpse: PreparedEntity,
): boolean {
  const actor = state[side]
  return (
    !corpse.controller &&
    actor.aura >= 30 &&
    !corpseLoanUsed(actor) &&
    corpseNenReady(actor) &&
    corpseMetalReady(state, side, corpse) &&
    corpseHeadContact(state, side, corpse)
  )
}
function createCorpsePreparation(
  state: FightState,
  side: FightSide,
  context: { corpse: PreparedEntity; hand: DeviceHand },
): CorpsePreparation {
  const actor = state[side]
  return {
    target: context.corpse.id,
    frames: CORPSE_PREPARE_FRAMES,
    x: actor.x,
    y: actor.y,
    hand: context.hand,
    owner: paperBodyRef(state, side),
    origin: newGumSource(actor),
    ...corpseMetalPlan(state, side, context.corpse),
  }
}
export function advanceCorpseImplant(state: FightState, side: FightSide): FightState {
  const actor = state[side],
    preparation = actor.corpsePreparation
  if (!preparation) return state
  const corpse = state.battlefield?.entities.find((entry) => entry.id === preparation.target)
  const clear = { ...state, [side]: { ...actor, corpsePreparation: undefined } }
  if (
    !corpse ||
    !usableCorpse(corpse) ||
    corpse.controller ||
    !corpseImplantContinues(state, side, corpse)
  )
    return clear
  if (preparation.frames > 1)
    return {
      ...state,
      [side]: { ...actor, corpsePreparation: { ...preparation, frames: preparation.frames - 1 } },
    }
  return finishCorpseImplant(state, side, corpse)
}
export function corpseImplantContinues(
  state: FightState,
  side: FightSide,
  corpse: PreparedEntity,
): boolean {
  const actor = state[side],
    preparation = actor.corpsePreparation!
  if (
    !canAct({ ...actor, corpsePreparation: undefined }) ||
    actor.attack ||
    physicalHandsBusy(actor)
  )
    return false
  return (
    !physicalHandOccupancy(state, side).has(preparation.hand) &&
    preparationMetalReady(state, side, corpse) &&
    corpseOriginAvailable(state, actor, preparation.origin) &&
    distance(actor, preparation) < 0.1 &&
    corpseHeadContact(state, side, corpse)
  )
}
function finishCorpseImplant(
  state: FightState,
  side: FightSide,
  corpse: PreparedEntity,
): FightState {
  const preparation = state[side].corpsePreparation!
  const material = attachCorpseMetal(state, side, corpse)
  const cast = witnessCorpseControl({ ...state, [side]: material.actor }, side)
  return updateEntity(cast, corpse.id, {
    corpseNeedles: material.pins,
    corpseControl: {
      owner: preparation.owner,
      pinsId: material.pins.id,
      origin: preparation.origin,
    },
    controller: { side, source: 'illumi', member: preparation.owner.member },
    corpseOrder: 'stay',
    arena: { ...corpse.arena!, height: 12 },
  })
}
function witnessCorpseControl(state: FightState, side: FightSide): FightState {
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    [other]: {
      ...state[other],
      hatsuEffects: {
        ...state[other].hatsuEffects,
        ...witnessedHatsuState(state, { side, source: 'illumi', moveId: ILLUMI_IMPLANT }),
      },
    },
  }
}
function distance(actor: { x: number; y: number }, target: { x: number; y: number }): number {
  return Math.hypot(actor.x - target.x, actor.y - target.y)
}
