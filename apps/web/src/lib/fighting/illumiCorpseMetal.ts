import { historicalPartExists } from './historicalCopyLifetime'
import { corpsePinsLive } from './illumiCorpseMatter'
import { hasIllumiNeedles } from './illumiEquipment'
import { physicalBodyKey } from './fightBodyIdentity'
import type { CorpsePreparation, CorpseNeedles } from './illumiCorpseTypes'
import type { PreparedEntity } from './preparationTypes'
import type { FightState, FightSide, ArcadeFighter } from './types'

export function equippedCorpsePins(state: FightState, side: FightSide): CorpseNeedles | undefined {
  const prop = state[side].equipmentProps?.needles
  const entry = state.battlefield?.entities.find((item) => item.id === prop?.entityId)
  const pins = entry?.corpsePinBundle
  return pins && hasIllumiNeedles(state[side]) && historicalPartExists(state, pins.mediumCopyId)
    ? pins
    : undefined
}
export function corpseMetalReady(
  state: FightState,
  side: FightSide,
  corpse: PreparedEntity,
): boolean {
  return (
    corpsePinsLive(state, corpse) ||
    (hasIllumiNeedles(state[side]) &&
      historicalPartExists(state, state[side].equipmentProps?.needles?.copyId))
  )
}
export function corpseMetalPlan(state: FightState, side: FightSide, corpse: PreparedEntity) {
  const embedded = corpsePinsLive(state, corpse) ? corpse.corpseNeedles : undefined
  const stock = embedded ? undefined : equippedCorpsePins(state, side)
  return {
    pinsId: embedded?.id,
    stockPinsId: stock?.id,
    stockEntityId: stock ? state[side].equipmentProps?.needles?.entityId : undefined,
    mediumCopyId: selectedMedium(state[side], embedded, stock),
  }
}
function selectedMedium(
  actor: ArcadeFighter,
  embedded?: CorpseNeedles,
  stock?: CorpseNeedles,
): string | undefined {
  if (embedded) return embedded.mediumCopyId
  return stock ? stock.mediumCopyId : actor.equipmentProps?.needles?.copyId
}
export function preparationMetalReady(
  state: FightState,
  side: FightSide,
  corpse: PreparedEntity,
): boolean {
  const preparation = state[side].corpsePreparation!
  if (!historicalPartExists(state, preparation.mediumCopyId)) return false
  if (preparation.pinsId)
    return corpsePinsLive(state, corpse) && corpse.corpseNeedles?.id === preparation.pinsId
  if (preparation.stockPinsId) return sameEquippedPins(state, side, preparation)
  return (
    hasIllumiNeedles(state[side]) &&
    state[side].equipmentProps?.needles?.copyId === preparation.mediumCopyId
  )
}
function sameEquippedPins(
  state: FightState,
  side: FightSide,
  preparation: CorpsePreparation,
): boolean {
  return (
    equippedCorpsePins(state, side)?.id === preparation.stockPinsId &&
    state[side].equipmentProps?.needles?.entityId === preparation.stockEntityId
  )
}
export function attachCorpseMetal(state: FightState, side: FightSide, corpse: PreparedEntity) {
  const actor = state[side],
    preparation = actor.corpsePreparation!
  const existing = corpsePinsLive(state, corpse) ? corpse.corpseNeedles : undefined
  const stock = existing ? undefined : equippedCorpsePins(state, side)
  const generation = (actor.illumiNeedleGeneration ?? 0) + 1
  const pins = existing ??
    stock ?? {
      id: `corpse-pins:${physicalBodyKey(state, side)}:${generation}`,
      mediumCopyId: preparation.mediumCopyId,
    }
  let body: ArcadeFighter = { ...actor, corpsePreparation: undefined }
  if (!existing && !stock) body.illumiNeedleGeneration = generation
  if (stock) body = removeEquippedBundle(body)
  return { pins, actor: body }
}
function removeEquippedBundle(actor: ArcadeFighter): ArcadeFighter {
  const equipmentProps = { ...actor.equipmentProps }
  delete equipmentProps.needles
  return {
    ...actor,
    equipment: actor.equipment?.filter((item) => item !== 'needles'),
    equipmentProps,
  }
}
