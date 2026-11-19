import { futurePerceivedTarget } from './parallelFuture'
import { ownsBungeeGum } from './bungeeAccess'
import { ownedGumLinks, selectedGumLink } from './bungeeNetwork'
import type { GumLink } from './bungeeTypes'
import { BUNGEE_REST_DISTANCE } from './hisokaTechnique'
import type { ArsenalAiContext } from './arsenalAiTypes'
import type { MoveSlot } from './types'

/** Gon/Kastro: physical pressure earns the contact; Gum changes an exchange, not every attack. */
export function hisokaAiSlots({ state, roll, gap }: ArsenalAiContext): readonly MoveSlot[] {
  const physical = physicalSlots(roll, gap)
  if (!ownsBungeeGum(state.opponent)) return physical
  const link = selectedGumLink(state, 'opponent')
  if (link?.target.kind === 'fighter') return linkedSlots({ state, roll, gap }, link, physical)
  const attached = ownedGumLinks(state, 'opponent').some((entry) => entry.target.kind === 'fighter')
  if (attached || gap > 12) return physical
  return roll < 0.32 ? ['neutralSpecial', ...physical] : [...physical, 'neutralSpecial']
}

function linkedSlots(
  context: ArsenalAiContext,
  link: GumLink,
  physical: readonly MoveSlot[],
): readonly MoveSlot[] {
  const { state, roll, gap } = context
  const target = futurePerceivedTarget(state, 'opponent', state.player)
  if (gap < 10 && target.hitStun > 0 && roll > 0.55) return ['finisher', ...physical]
  if (link.motion === 'idle' && gap > BUNGEE_REST_DISTANCE)
    return [target.y > 0 || roll < 0.72 ? 'forwardSpecial' : 'backSpecial', ...physical]
  return physical
}

function physicalSlots(roll: number, gap: number): readonly MoveSlot[] {
  if (gap > 18) return []
  if (gap > 10) return ['forwardLight', 'forwardHeavy', 'standingHeavy']
  if (roll < 0.34) return ['standingLight', 'forwardLight', 'standingHeavy']
  if (roll < 0.68) return ['lowLight', 'lowHeavy', 'standingLight']
  return ['backHeavy', 'standingHeavy', 'forwardHeavy']
}
