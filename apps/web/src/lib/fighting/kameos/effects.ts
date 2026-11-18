import { canReceiveCombatHit } from '../combatTargets'
import { otherSide } from '../frameData'
import { consumeHatsuAvoidance, hatsuAvoidsImpact, hatsuFor } from '../hatsu'
import type { FightSide, FightState } from '../types'
import { kameoDefinition } from './catalogue'
import type { KameoDefinition } from './catalogue'
import type { KameoId, KameoSlot } from './types'

/**
 * Lands one kameo's support Hatsu. The effect itself is the engine's existing
 * adaptation (`hatsu/registry.ts`), never a copy: the same hatsuEffects field is set
 * and the main frame advances it once, wherever it lives.
 */
export function deliverKameoEffect(state: FightState, side: FightSide): FightState {
  const slot = state.kameos?.[side]
  if (!slot || slot.phase !== 'acting') return state
  const definition = kameoDefinition(slot.fighter.id as KameoId)
  if (slot.fighter.aura < definition.auraCost) return state
  const paid = withSlot(state, side, {
    ...slot,
    fighter: { ...slot.fighter, aura: slot.fighter.aura - definition.auraCost },
  })
  return landDelivery(paid, side, definition)
}

function landDelivery(state: FightState, side: FightSide, definition: KameoDefinition) {
  const delivery = definition.delivery
  if (delivery.kind === 'ally') return allyEffect(state, side, definition.id)
  const slot = state.kameos![side]!
  if (delivery.kind === 'trap') {
    const trap = { x: slot.fighter.x, remainingFrames: delivery.lifetimeFrames }
    return withSlot(state, side, { ...slot, trap })
  }
  const gap = Math.abs(slot.fighter.x - state[otherSide(side)].x)
  return gap <= delivery.range ? enemyEffect(state, side, definition.id) : state
}

/** Soin, défense, boost: the leader receives the Hatsu as if it had been triggered on it. */
function allyEffect(state: FightState, side: FightSide, id: KameoId): FightState {
  if (state[side].health <= 0) return state
  return hatsuFor(id).onTrigger({ state, side, source: id })
}

/**
 * Attaque, piège, zone: the opposing leader receives the Hatsu's impact. It must be
 * hittable; an avoidance (isolation, dodges, guards) is spent instead of the effect.
 */
export function enemyEffect(state: FightState, side: FightSide, id: KameoId): FightState {
  const defenderSide = otherSide(side)
  const defender = state[defenderSide]
  if (!canReceiveCombatHit(defender)) return state
  if (hatsuAvoidsImpact(defender))
    return { ...state, [defenderSide]: consumeHatsuAvoidance(defender) }
  return hatsuFor(id).onImpact({
    state,
    side,
    defenderSide,
    source: id,
    blocked: defender.blocking,
    concealed: false,
  })
}

/** Traps age every frame and spring once on a grounded opposing leader within reach. */
export function advanceKameoTraps(state: FightState): FightState {
  if (!state.kameos) return state
  let next = state
  for (const side of ['player', 'opponent'] as const) next = advanceTrap(next, side)
  return next
}

function advanceTrap(state: FightState, side: FightSide): FightState {
  const slot = state.kameos?.[side]
  const trap = slot?.trap
  if (!slot || !trap) return state
  const definition = kameoDefinition(slot.fighter.id as KameoId)
  if (definition.delivery.kind !== 'trap') return state
  const enemy = state[otherSide(side)]
  const sprung = enemy.y === 0 && Math.abs(enemy.x - trap.x) <= definition.delivery.radius
  if (sprung) return enemyEffect(withSlot(state, side, withoutTrap(slot)), side, definition.id)
  const remainingFrames = trap.remainingFrames - 1
  const aged =
    remainingFrames > 0 ? { ...slot, trap: { ...trap, remainingFrames } } : withoutTrap(slot)
  return withSlot(state, side, aged)
}

function withoutTrap(slot: KameoSlot): KameoSlot {
  const { trap: _trap, ...rest } = slot
  return rest
}

function withSlot(state: FightState, side: FightSide, slot: KameoSlot): FightState {
  return { ...state, kameos: { ...state.kameos, [side]: slot } }
}
