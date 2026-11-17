import { equippedDolphin, loanCarrier } from './dolphinBorrowing'
import { stolenAuraActor } from './dolphinSupply'
import { advanceLuiniAnchors } from './luiniSpatial'
import { advanceCopiedInventory, recordEquipmentPickup } from './copiedInventory'
import { historicalMatterExists } from './historicalCopyLifetime'
import { illumiBodyFree } from './illumiState'
import { chrolloHasActivePage } from './chrolloBook'
import { chainAbilitySealed } from './kurapika'
import { hasEquipment, liveEntity, PREPARATION_REACH, updateEntity } from './preparationWorld'
import { completePreparation } from './preparationActions'
import type { PreparedEntity } from './preparationTypes'
import type { FightInput, FightSide, FightState } from './types'

/** Every mutation is immutable: forecasting must not alter the real prepared scene. */
export function advancePreparation(
  state: FightState,
  inputs: { player: FightInput; opponent?: FightInput },
): FightState {
  if (!state.battlefield) return state
  let next = state
  for (const side of ['player', 'opponent'] as const)
    next = readInteraction(next, side, Boolean(inputs[side]?.interact))
  const entities = next.battlefield!.entities.map((entry) => advanceEntity(next, entry))
  next = { ...next, battlefield: { ...next.battlefield!, entities } }
  return advanceLuiniAnchors(completeDeliveries(state, next))
}

function readInteraction(state: FightState, side: FightSide, pressed: boolean): FightState {
  const next =
    pressed && !state.battlefield!.interactionHeld[side]
      ? interactWithPreparation(state, side)
      : state
  return {
    ...next,
    battlefield: {
      ...next.battlefield!,
      interactionHeld: { ...next.battlefield!.interactionHeld, [side]: pressed },
    },
  }
}

function completeDeliveries(before: FightState, after: FightState): FightState {
  let next = after
  for (const entry of after.battlefield!.entities) {
    const previous = before.battlefield!.entities.find((held) => held.id === entry.id)
    if (entry.delivered && !previous?.delivered && previous?.controller)
      next = completePreparation(next, previous.controller.side)
  }
  return next
}

export function interactWithPreparation(state: FightState, side: FightSide): FightState {
  state = advanceCopiedInventory(state)
  const fighter = state[side]
  if (!state.battlefield || !canInteractBody(fighter)) return state
  const target = preparationInteractionTarget(state, side)
  if (!target) return state
  if (target.arena && target.kind === 'crate') return pushPreparationCrate(state, side, target)
  if (target.kind === 'needles' || target.kind === 'flute')
    return pickPreparationEquipment(state, side, target)
  if (target.kind === 'room')
    return updateEntity(state, target.id, { sealed: false, invalidated: true })
  return updateEntity(state, target.id, { consenting: false })
}

function pickPreparationEquipment(
  state: FightState,
  side: FightSide,
  target: PreparedEntity,
): FightState {
  const fighter = state[side]
  const equipment = target.kind === 'needles' ? 'needles' : 'flute'
  if (
    hasEquipment(fighter, equipment) ||
    !historicalMatterExists(state, target.copy ? target.id : undefined)
  )
    return state
  const picked = updateEntity(state, target.id, { present: false })
  return {
    ...picked,
    [side]: recordEquipmentPickup(fighter, target, equipment),
  }
}

function pushPreparationCrate(
  state: FightState,
  side: FightSide,
  target: PreparedEntity,
): FightState {
  const fighter = state[side]
  const proposed = Math.max(10, Math.min(90, target.x + fighter.facing * 3))
  const blocker = state.battlefield!.entities.find(
    (entry) =>
      entry.id !== target.id &&
      entry.arena &&
      liveEntity(entry) &&
      (entry.x - target.x) * fighter.facing > 0 &&
      Math.abs(entry.x - proposed) < 6,
  )
  const x = blocker ? blocker.x - fighter.facing * 6 : proposed
  if (Math.abs(state[side === 'player' ? 'opponent' : 'player'].x - x) < 6) return state
  return updateEntity(state, target.id, { x })
}

function canInteract(entry: PreparedEntity, side: FightSide): boolean {
  if (!liveEntity(entry)) return false
  if (entry.arena && entry.kind === 'crate') return true
  if (entry.kind === 'flute' || entry.kind === 'needles') return true
  if (entry.kind === 'room') return Boolean(entry.sealed)
  return entry.kind === 'supporter' && entry.owner === side && Boolean(entry.consenting)
}

function advanceEntity(state: FightState, entry: PreparedEntity): PreparedEntity {
  const awake = { ...entry, sleepingFrames: Math.max(0, (entry.sleepingFrames ?? 0) - 1) }
  const control = entry.controller
  if (!control) return awake
  if (!liveEntity(entry) || !controllerKeepsAbility(state, entry))
    return { ...awake, controller: undefined }
  if (control.source === 'sayird') return advanceAnimal(state, awake)
  return advanceCourier(state, awake)
}

function advanceAnimal(state: FightState, entry: PreparedEntity): PreparedEntity {
  const side = entry.controller!.side === 'player' ? 'opponent' : 'player'
  const target = state[side]
  return { ...entry, x: approach(entry.x, target.x, 0.12), y: entry.kind === 'bird' ? 5 : 0 }
}

function advanceCourier(state: FightState, entry: PreparedEntity): PreparedEntity {
  const side = entry.controller!.side
  const destination = state.battlefield!.entities.find(
    (held) => held.kind === 'delivery' && held.owner === side && liveEntity(held),
  )
  if (!destination) return { ...entry, controller: undefined }
  const x = approach(entry.x, destination.x, 0.4)
  const delivered = Math.abs(x - destination.x) < 0.1
  return {
    ...entry,
    x,
    y: delivered ? 0 : 6,
    delivered,
    controller: delivered ? undefined : entry.controller,
  }
}

function controllerKeepsAbility(state: FightState, entry: PreparedEntity): boolean {
  const { side, source } = entry.controller!
  const fighter = preparedControllerBody(state, side, source)
  if (fighter.health <= 0 || fighter.hatsuEffects.hatsuStolen > 0) return false
  if (fighter.id === 'chrollo')
    return chrolloHasActivePage(fighter, source as Exclude<typeof source, 'chrollo'>)
  if (fighter.kurapika?.held?.used) return fighter.kurapika.held.source === source
  if (fighter.id !== source) return false
  return !chainAbilitySealed(
    fighter,
    source === 'sayird' ? 'sayird:littleEye' : 'cluck:birdManipulation',
  )
}

function preparedControllerBody(
  state: FightState,
  side: FightSide,
  source: FightState['player']['id'],
) {
  const actor = state[side]
  const held = equippedDolphin(actor)
  return held?.used && !held.returned && held.source === source
    ? stolenAuraActor(loanCarrier(actor))
    : actor
}

function approach(from: number, to: number, speed: number): number {
  return from + Math.sign(to - from) * Math.min(speed, Math.abs(to - from))
}

function canInteractBody(fighter: FightState['player']): boolean {
  if (fighter.arenaRecovery) return false
  if (fighter.hanzoProjection || fighter.melodyPerformance || fighter.parallelEyesClosed)
    return false
  if (!illumiBodyFree(fighter)) return false
  return (
    !fighter.attack &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    fighter.health > 0
  )
}

export function preparationInteractionTarget(
  state: FightState,
  side: FightSide,
): PreparedEntity | undefined {
  if (!state.battlefield) return undefined
  const fighter = state[side]
  return state.battlefield.entities
    .filter(
      (entry) =>
        canInteract(entry, side) &&
        historicalMatterExists(state, entry.copy ? entry.id : undefined) &&
        needsPreparedEquipment(fighter, entry) &&
        Math.hypot(entry.x - fighter.x, entry.y - fighter.y) <= PREPARATION_REACH,
    )
    .sort(
      (a, b) => Math.abs(a.x - fighter.x) - Math.abs(b.x - fighter.x) || a.id.localeCompare(b.id),
    )[0]
}

function needsPreparedEquipment(fighter: FightState['player'], entry: PreparedEntity): boolean {
  return entry.kind === 'flute' || entry.kind === 'needles'
    ? !hasEquipment(fighter, entry.kind)
    : true
}
