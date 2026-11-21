import { chrolloPageForMove } from './chrolloBook'
import { canAct } from './fightActorState'
import {
  breachMoonlightContract,
  MOONLIGHT_MOVE,
  offerMoonlightContract,
} from './moonlightContract'
import type { AuraAttackOptions } from './auraAttackAction'
import type { ArcadeFighter, FightSide, FightState } from './types'
import { moonlightBinds } from './moonlightParties'
import { clausePermitsAction } from './moonlightClauses'

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

/** Disclosed duel clause: only what the signed terms leave open may start during the pact. */
export function resolveMoonlightAction(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightState {
  if (!before.moonlight?.active || !actionStarted(before[side], after[side])) return after
  if (!moonlightBinds(before, side, before.moonlight.active)) return after
  if (clausePermitsAction(before.moonlight.active.terms, after[side])) return after
  const physical = after[side].attack?.kind === 'light' || after[side].attack?.kind === 'heavy'
  // Zetsu interrupts Nen before it takes effect; an ordinary physical blow still proceeds.
  return breachMoonlightContract(physical ? after : before, side)
}

function actionStarted(before: ArcadeFighter, after: ArcadeFighter): boolean {
  if (before === after) return false
  if (after.attack && after.attack !== before.attack) return true
  return !after.attack && !after.bufferedAttack
}

const BARE_HANDS_AI_REACH = 14

/** Under a bare-hands pact the AI honours its own signature: uncharged strikes, nothing more. */
export function moonlightAiBareHands(
  state: FightState,
  strike: (state: FightState, kind: 'light' | 'heavy') => FightState,
): FightState | null {
  const pact = state.moonlight?.active
  if (!pact || pact.terms !== 'no-techniques' || !moonlightBinds(state, 'opponent', pact))
    return null
  if (!canAct(state.opponent)) return state
  if (Math.abs(state.player.x - state.opponent.x) > BARE_HANDS_AI_REACH) return state
  return strike(state, state.rng % 3 === 0 ? 'heavy' : 'light')
}
