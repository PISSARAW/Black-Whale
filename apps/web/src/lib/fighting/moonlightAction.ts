import { chrolloPageForMove } from './chrolloBook'
import {
  breachMoonlightContract,
  MOONLIGHT_MOVE,
  offerMoonlightContract,
} from './moonlightContract'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Moonlight Act has no damaging carrier, no forced signature and no attack finisher. */
export function performMoonlightAction(options: AuraAttackOptions): FightState | null {
  const { state, side, kind, moveId } = options
  if (kind !== 'special') return null
  const fighter = state[side]
  const own = fighter.id === 'longhi'
  if (!own && chrolloPageForMove(fighter, moveId) !== 'longhi') return null
  if (own && moveId && moveId !== MOONLIGHT_MOVE) return state
  return offerMoonlightContract({ state, side, moveId })
}

/** Disclosed duel clause: no attack commands or techniques may start during the truce. */
export function resolveMoonlightAction(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightState {
  if (!before.moonlight?.active || !actionStarted(before[side], after[side])) return after
  const physical = after[side].attack?.kind === 'light' || after[side].attack?.kind === 'heavy'
  // Zetsu interrupts Nen before it takes effect; an ordinary physical blow still proceeds.
  return breachMoonlightContract(physical ? after : before, side)
}

function actionStarted(before: ArcadeFighter, after: ArcadeFighter): boolean {
  if (before === after) return false
  if (after.attack && after.attack !== before.attack) return true
  return !after.attack && !after.bufferedAttack
}
