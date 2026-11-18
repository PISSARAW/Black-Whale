import { voluntaryNenAvailable } from '../nenAccess'
import { chainAbilitySealed } from '../kurapika'
import { blinkyAvailable } from '../blinky'
import { throwPerformanceFor } from './catalogue'
import type { FightSide, FightState } from '../types'
import type { ThrowCinematicFrame } from '../throwCinematic'

/** Freeze the authored variant at confirmed contact; camera and poses share this choice. */
export function selectThrowPerformance(
  state: FightState,
  attacker: FightSide,
): Pick<ThrowCinematicFrame, 'powered' | 'performance' | 'puppetId' | 'future'> {
  const actor = state[attacker]
  const powered = Boolean(actor.attack?.superThrow)
  const performance = throwPerformanceFor(actor.id, powered)
  if (!performance || (actor.nenOwner && actor.nenOwner !== actor.id)) return { powered }
  if (
    ['chain', 'gum', 'staff', 'thread', 'blinky', 'remote'].includes(performance.effect) &&
    !signatureNenAvailable(state, attacker)
  )
    return { powered }
  return {
    powered,
    performance: performance.id,
    ...throwWitnesses(state, attacker, powered),
  }
}

function throwWitnesses(state: FightState, side: FightSide, powered: boolean) {
  if (!powered) return {}
  if (state[side].id === 'chrollo') return { puppetId: nearbyPuppet(state, side)?.id }
  if (state[side].id === 'tserriednich') return { future: predictedBody(state, side) }
  return {}
}

export function signatureNenAvailable(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  if (actor.id === 'shizuku') return blinkyAvailable(actor)
  const moves: Record<string, string> = {
    saiyu: 'saiyu:backSpecial',
    machi: 'machi:downSpecial',
    shizuku: 'shizuku:neutralSpecial',
    leorio: 'leorio:neutralSpecial',
  }
  const move = moves[actor.id] ?? `${actor.id}:forwardSpecial`
  return voluntaryNenAvailable(actor) && !chainAbilitySealed(actor, move)
}

function nearbyPuppet(state: FightState, side: FightSide) {
  return state.battlefield?.entities.find(
    (entity) =>
      entity.present &&
      entity.kind === 'puppet' &&
      entity.health > 0 &&
      entity.copy?.owner === side &&
      entity.copy.headAttached &&
      entity.copy.order === 'attack' &&
      Math.abs(entity.x - state[side === 'player' ? 'opponent' : 'player'].x) < 16,
  )
}

function predictedBody(state: FightState, side: FightSide) {
  const future = state.parallelFuture
  if (future?.owner !== side || future.phase !== 'diverging') return undefined
  const actor = future.frames[future.cursor]?.[side]
  return actor ? { x: actor.x, y: actor.y } : undefined
}
