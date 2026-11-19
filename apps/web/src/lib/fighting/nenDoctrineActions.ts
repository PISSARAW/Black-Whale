import { nenCombatDoctrine } from './nenCombatDoctrine'
import { moveForSlot } from './movesets'
import { readAura } from './nenCombat/reading'
import { seesCombatBody } from './fightCounterplay'
import { perceivedOpponentGap } from './opponentAwareness'
import { voluntaryNenAvailable } from './nenAccess'
import { applyAuraContext } from './nen'
import { EMPTY_INPUT, type FightState, type MoveSlot, type ArcadeFighter } from './types'
import type { ArsenalAiContext } from './arsenalAiTypes'

/** Reorder only the plan's existing actions. Activation still uses all normal resource and target checks. */
export function prioritiseNenSlots(
  context: ArsenalAiContext,
  slots: readonly MoveSlot[],
): readonly MoveSlot[] {
  const fighter = context.state.opponent,
    doctrine = nenCombatDoctrine(fighter)
  const reading = readAura(fighter, context.state.player)
  const scored = slots.map((slot, index) => {
    const move = moveForSlot(fighter.id, slot)
    const weak = move && reading?.weak.includes(move.tuning.targetZone ?? 'torso') ? 2 : 0
    const close =
      doctrine.affinity === 'enhancer' && context.gap <= 9 && move?.kind === 'heavy' ? 1 : 0
    const distant = rangedPreference(context, slot) ? 1 : 0
    const personal = personalPreference(fighter, slot)
    return { slot, index, score: personal + weak + close + distant }
  })
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((item) => item.slot)
}

function rangedPreference(context: ArsenalAiContext, slot: MoveSlot): boolean {
  if (context.gap < 14) return false
  const fighter = context.state.opponent
  if (!['franklin', 'kalluto', 'leorio'].includes(fighter.id)) return false
  return ['neutralSpecial', 'forwardSpecial', 'backSpecial'].includes(slot)
}

/** Own affinity shapes preparation; hostile aura is read only through the ordinary Gyo observation. */
export function doctrineOpponentNen(state: FightState): FightState | null {
  const fighter = state.opponent
  if (!voluntaryNenAvailable(fighter, { requireHatsu: false, requireReserve: true })) return null
  if (!canPrepare(fighter)) return null
  const gap = perceivedOpponentGap(state),
    doctrine = nenCombatDoctrine(fighter)
  if (doctrine.affinity === 'enhancer' && gap <= 10 && fighter.aura >= 30)
    return {
      ...state,
      opponent: applyAuraContext(fighter, { ...EMPTY_INPUT, aura: true, focusHands: true }),
    }
  if (doctrine.affinity === 'emitter' && gap >= doctrine.range[0] && fighter.aura >= 50)
    return { ...state, opponent: applyAuraContext(fighter, { ...EMPTY_INPUT, aura: true }) }
  return null
}

function canPrepare(fighter: ArcadeFighter): boolean {
  return (
    fighter.nenTactics?.goal !== 'recover' &&
    !fighter.attack &&
    !fighter.blocking &&
    !fighter.hitStun &&
    seesCombatBody(fighter)
  )
}

function personalPreference(fighter: ArcadeFighter, slot: MoveSlot): number {
  return fighter.nenTactics?.slots.includes(slot) ? 4 : 0
}
