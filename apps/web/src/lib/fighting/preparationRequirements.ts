import {
  luiniAnchor,
  luiniDestination,
  luiniRequirements,
  luiniRoomAtBody,
  validLuiniRooms,
} from './luiniSpatial'
import { chrolloPageForMove, chrolloPageSource } from './chrolloBook'
import { hasEquipment, liveEntity, nearEntity, readyCohort } from './preparationWorld'
import type { HatsuRequirement, PreparationCheck } from './preparationTypes'
import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'

const REQUIREMENTS: Partial<Record<FighterId, HatsuRequirement[]>> = {
  illumi: ['needles'],
  melody: ['flute', 'free-hands'],
  sayird: ['small-animal'],
  cluck: ['bird'],
  bill: ['living-target'],
  halkenburg: ['cohort', 'cohort-charge', 'free-hands'],
  yokotani: ['hideout', 'morena', 'intruder'],
}
const UTILITY_MOVES: Partial<Record<FighterId, string>> = {
  sayird: 'sayird:littleEye',
  cluck: 'cluck:birdManipulation',
  bill: 'bill:neutralSpecial',
}

/** Resolve execution source without ever copying equipment, allies, visits or consent. */
export function preparationSource(fighter: ArcadeFighter, moveId?: string): FighterId | null {
  if (fighter.id === 'chrollo') return copiedPreparationSource(fighter, moveId)
  if (fighter.id === 'kurapika' && fighter.kurapika?.held) return null // Loading Dolphin is allowed without the eventual material target.
  const utility = UTILITY_MOVES[fighter.id]
  if (utility && moveId && moveId !== utility && moveId !== `${fighter.id}:neutralSpecial`)
    return null
  return fighter.id
}

export function preparationCheck(
  state: FightState,
  side: FightSide,
  moveId?: string,
): PreparationCheck {
  const source = preparationSource(state[side], moveId)
  const ids =
    source === 'luini'
      ? luiniRequirements(state, side)
      : [...(REQUIREMENTS[source as FighterId] ?? [])]
  if (state[side].id === 'chrollo') ids.push('book')
  const requirements = ids.map((id) => ({
    id,
    satisfied: requirementSatisfied({ state, side, id }),
  }))
  return { source, requirements, ready: requirements.every((entry) => entry.satisfied) }
}

function requirementSatisfied(context: {
  state: FightState
  side: FightSide
  id: HatsuRequirement
}): boolean {
  const { state, side, id } = context
  const target = side === 'player' ? 'opponent' : 'player'
  const predicates: Record<HatsuRequirement, () => boolean> = {
    needles: () => hasEquipment(state[side], 'needles'),
    flute: () => hasEquipment(state[side], 'flute'),
    book: () => Boolean(state[side].chrolloBook),
    'free-hands': () => state[side].id !== 'chrollo' || !state[side].chrolloBook?.open,
    'cohort-charge': () =>
      state[side].hatsuEffects.cohortWillFrames >= 480 || state[side].hatsuEffects.arrowNocked > 0,
    'small-animal': () => hasAnimal(state, side, 'animal'),
    bird: () => hasAnimal(state, side, 'bird'),
    'living-target': () =>
      Boolean(nearEntity(state, side, 'seed') && !nearEntity(state, side, 'seed')?.growth),
    cohort: () => readyCohort(state, side).length > 0,
    morena: () => morenaPresent(state),
    hideout: () => state.environment.stageId === 'heilly-hideout',
    intruder: () => state.environment.unlawfulIntruders[target] && state[target].id !== 'morena',
    'sealed-room': () => validLuiniRooms(state, side).length > 0,
    'room-interior': () => Boolean(luiniRoomAtBody(state, side)),
    'luini-anchor': () => Boolean(luiniAnchor(state, side)),
    'visited-destination': () => Boolean(luiniDestination(state, side)),
  }
  return predicates[id]()
}

export function animalTarget(state: FightState, side: FightSide, kind: 'animal' | 'bird') {
  return (state.battlefield?.entities ?? [])
    .filter((entry) => entry.kind === kind && liveEntity(entry))
    .find(
      (entry) =>
        entry.material === 'real' &&
        !entry.controller &&
        Math.hypot(entry.x - state[side].x, entry.y - state[side].y) <= 18,
    )
}

export {
  validLuiniRooms as validRooms,
  luiniRoomAtBody as accessibleLuiniRoom,
} from './luiniSpatial'

export function morenaPresent(state: FightState): boolean {
  if (!state.battlefield) return state.environment.morenaPresent
  return state.battlefield.entities.some((entry) => entry.kind === 'morena' && liveEntity(entry))
}

function hasAnimal(state: FightState, side: FightSide, kind: 'animal' | 'bird'): boolean {
  return (
    Boolean(animalTarget(state, side, kind)) ||
    (state.battlefield?.entities ?? []).some(
      (entry) => entry.kind === kind && entry.controller?.side === side && liveEntity(entry),
    )
  )
}

function copiedPreparationSource(fighter: ArcadeFighter, moveId?: string): FighterId | null {
  const page = chrolloPageForMove(fighter, moveId)
  const source = chrolloPageSource(page)
  return source === 'chrollo' ? null : source
}
