import { blinkyBloodReady, blinkyState, inBlinkyNozzle } from './blinky'
import { perceivedProjectiles } from './projectilePerception'
import { martialSlots, type ArsenalAiContext } from './arsenalAiTypes'
import type { MoveSlot } from './types'

/** Pike: wound with the implement, then exploit uncovered wounds at real nozzle range. */
export function shizukuCombatSlots(context: ArsenalAiContext): readonly MoveSlot[] {
  const { state, gap, roll } = context
  if (gap >= 10 && blinkyBloodReady(state, 'opponent')) return ['finisher']
  if (hasSuctionTarget(context)) return ['neutralSpecial']
  if (canEjectObject(context)) return ['backSpecial', 'forwardSpecial']
  if (gap < 7)
    return roll < 0.5 ? ['standingLight', 'lowLight', 'backHeavy'] : ['backHeavy', 'standingHeavy']
  if (gap <= 14)
    return roll < 0.5 ? ['forwardSpecial', 'standingHeavy'] : ['forwardLight', 'forwardHeavy']
  return martialSlots(context)
}

function canEjectObject({ state, gap }: ArsenalAiContext): boolean {
  const stored = blinkyState(state.opponent)
  return gap > 10 && Boolean(stored.lastObject || stored.lastArenaObject)
}

function hasSuctionTarget({ state }: ArsenalAiContext): boolean {
  const actor = state.opponent
  const target = blinkyState(actor).target
  return perceivedProjectiles(state, 'opponent').some(
    (shot) =>
      shot.matter === 'object' &&
      !shot.living &&
      !shot.illusionHarmless &&
      shot.shape === target &&
      inBlinkyNozzle(actor, shot),
  )
}
