import { illumiBodyFree } from './illumiState'
import { witnessedHatsuState } from './nenWitness'
import { voluntaryNenAvailable } from './nenAccess'
import { performLuiniAction } from './luiniSpatial'
import { PREPARED_COSTS } from './preparationTuning'
import { chainAbilitySealed } from './kurapika'
import { preparationCheck, preparationSource, animalTarget } from './preparationRequirements'
import { nearEntity, liveEntity, updateEntity } from './preparationWorld'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightSide, FightState, FighterId } from './types'

export const PREPARED_SOURCES: readonly FighterId[] = ['sayird', 'cluck', 'bill', 'luini']
export { PREPARED_COSTS } from './preparationTuning'
const CANONICAL_MOVE: Partial<Record<FighterId, string>> = {
  sayird: 'sayird:littleEye',
  cluck: 'cluck:birdManipulation',
  bill: 'bill:neutralSpecial',
}

export function preparedSource(
  state: FightState,
  side: FightSide,
  moveId?: string,
): FighterId | null {
  const source = preparationSource(state[side], moveId)
  return source && PREPARED_SOURCES.includes(source) ? source : null
}

export function preparedActionReady(state: FightState, side: FightSide, moveId?: string): boolean {
  const source = preparedSource(state, side, moveId)
  if (!source || !preparedUserAvailable(state, side, source)) return false
  if (controlledEntities(state, side, source).length) return true
  return (
    preparationCheck(state, side, moveId).ready && state[side].aura >= (PREPARED_COSTS[source] ?? 0)
  )
}

/** Utility activations have no damaging carrier, invulnerability or fake finisher. */
export function performPreparedAction(options: AuraAttackOptions): FightState | null {
  if (options.kind !== 'special') return null
  const { state, side, moveId } = options
  const source = preparedSource(state, side, moveId)
  if (!source) return null
  if (!preparedActionReady(state, side, moveId)) return state
  if (controlledEntities(state, side, source).length) return releasePreparedControl(state, side)
  const activated = activate(state, side, source)
  if (activated === state) return state
  const witness = side === 'player' ? 'opponent' : 'player'
  return {
    ...activated,
    [side]: {
      ...activated[side],
      aura: state[side].aura - (PREPARED_COSTS[source] ?? 0),
      preparationRecovery: 18,
    },
    [witness]: {
      ...activated[witness],
      hatsuEffects: {
        ...activated[witness].hatsuEffects,
        ...witnessedHatsuState(state, { side, source: source }),
      },
    },
  }
}

function activate(state: FightState, side: FightSide, source: FighterId): FightState {
  if (source === 'bill') return growSeed(state, side)
  if (source === 'luini') return performLuiniAction(state, side)
  const target = animalTarget(state, side, source === 'sayird' ? 'animal' : 'bird')
  return target
    ? updateEntity(state, target.id, { controller: { side, source }, delivered: false })
    : state
}

function growSeed(state: FightState, side: FightSide): FightState {
  const seed = nearEntity(state, side, 'seed')
  if (!seed || seed.copy || seed.growth) return state
  const grown = updateEntity(state, seed.id, { growth: 1 })
  return completePreparation(grown, side)
}

export function completePreparation(state: FightState, side: FightSide): FightState {
  const field = state.battlefield
  return field
    ? {
        ...state,
        battlefield: {
          ...field,
          completed: { ...field.completed, [side]: field.completed[side] + 1 },
        },
      }
    : state
}

export function controlledEntities(state: FightState, side: FightSide, source?: FighterId) {
  return (state.battlefield?.entities ?? []).filter(
    (entry) =>
      liveEntity(entry) &&
      entry.controller?.side === side &&
      (!source || entry.controller.source === source),
  )
}

export function releasePreparedControl(state: FightState, side: FightSide): FightState {
  if (!state.battlefield) return state
  return {
    ...state,
    battlefield: {
      ...state.battlefield,
      entities: state.battlefield.entities.map((entry) =>
        entry.controller?.side === side ? { ...entry, controller: undefined } : entry,
      ),
    },
  }
}

export function preparedUserAvailable(
  state: FightState,
  side: FightSide,
  source: FighterId,
): boolean {
  const fighter = state[side]
  return (
    preparedBodyFree(fighter) &&
    preparationAuraAvailable(fighter) &&
    !chainAbilitySealed(fighter, CANONICAL_MOVE[source])
  )
}

function preparedBodyFree(fighter: ArcadeFighter): boolean {
  return (
    illumiBodyFree(fighter) &&
    fighter.health > 0 &&
    !fighter.attack &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.knockdownFrames === 0 &&
    !fighter.preparationRecovery
  )
}

function preparationAuraAvailable(fighter: ArcadeFighter): boolean {
  return voluntaryNenAvailable(fighter)
}
