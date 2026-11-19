import { canonicalTechniqueAllowed } from './techniqueContracts'
import { martialSlots, type ArsenalAiContext } from './arsenalAiTypes'
import type { FightState, MoveSlot } from './types'

/** Uvogin: create space, bind an eligible Spider, then approach for the announced judgment.
 * The Succession Contest applications remain available with their own existing conditions.
 */
export function kurapikaCombatSlots(context: ArsenalAiContext): readonly MoveSlot[] {
  const { state, gap, roll } = context
  const utility = kurapikaSelfCare(state, gap) ?? kurapikaTarget(state, gap)
  if (utility) return utility
  if (prefersJail(context)) return ['neutralSpecial', 'forwardSpecial', 'forwardLight']
  if (gap < 8) return martialSlots(context)
  if (state.player.drainingChain?.owner === 'opponent') return ['forwardSpecial', 'standingLight']
  if (roll > 0.8 && !state.opponent.kurapika?.held) return ['backSpecial', 'forwardSpecial']
  return ['forwardSpecial', 'forwardLight', 'backHeavy']
}

function prefersJail({ state, gap, roll }: ArsenalAiContext): boolean {
  return (
    roll < 0.5 &&
    gap <= 18 &&
    canonicalTechniqueAllowed(state, 'opponent', { id: 'kurapika:neutralSpecial' })
  )
}

function kurapikaSelfCare(state: FightState, gap: number): readonly MoveSlot[] | null {
  const actor = state.opponent
  if (actor.maxHealth - actor.health >= 25 && gap > 12) return ['downSpecial']
  if (actor.kurapika?.held && !actor.kurapika.held.used) return ['backSpecial']
  return null
}

function kurapikaTarget(state: FightState, gap: number): readonly MoveSlot[] | null {
  if (state.player.chainJail?.owner === 'opponent') {
    if (state.player.judgmentChain) return ['standingLight', 'standingHeavy', 'forwardSpecial']
    return gap <= 7 ? ['finisher', 'standingLight'] : ['forwardSpecial', 'forwardLight']
  }
  if (state.opponent.kurapika?.emperorTime && !state.player.judgmentChain && gap <= 7)
    return ['finisher']
  return null
}
