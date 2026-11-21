import { GUM_RECALL_COST } from './bungeeTypes'
import { halfPriceCost } from './comboHalfPrice'
import type { FightSide, FightState } from './types'

/**
 * Élastique meurtrier (signatureCombos.ts): while Hisoka's opponent is still held in his
 * combo, recalling or rebounding an existing link costs what the network command costs,
 * and the Elastic Execution that closes a combo held by tension élastique (elasticHold.ts)
 * costs 40 instead of 55. Retour à la vraie forme (signatureCombosBiscuitPhinks.ts): Full
 * Impact that closes Perfect Ken → Ko Fist on a held target costs 40 instead of 55. Duel tuning.
 */
const COMBO_COSTS: Readonly<Record<string, number>> = {
  'hisoka:forwardSpecial': GUM_RECALL_COST,
  'hisoka:backSpecial': GUM_RECALL_COST,
  'hisoka:finisher': 40,
  'biscuit:finisher': 40,
}

export function comboAuraCost(state: FightState, side: FightSide, moveId?: string) {
  const cost = moveId === undefined ? undefined : COMBO_COSTS[moveId]
  if (cost === undefined || moveId?.split(':')[0] !== state[side].id) return undefined
  if (!opponentHeldInCombo(state, side)) return undefined
  return discountEarned(state[side], moveId!) ? cost : undefined
}

/** Each discounted finisher concludes its own signature only; the others always qualify. */
function discountEarned(fighter: FightState['player'], moveId: string): boolean {
  // Élastique meurtrier: tension élastique was used.
  if (moveId === 'hisoka:finisher') return Boolean(fighter.elasticHold)
  // Retour à la vraie forme: Full Impact cancels the Ko Fist of the capture chain.
  if (moveId === 'biscuit:finisher') return fighter.attack?.moveId === 'biscuit:downSpecial'
  return true
}

export function opponentHeldInCombo(state: FightState, side: FightSide): boolean {
  const target = state[side === 'player' ? 'opponent' : 'player']
  return target.comboHits > 0 && (target.hitStun > 0 || target.knockdownFrames > 0)
}

/** The combo price of a move: its own table entry, else the half price of comboHalfPrice.ts. */
export function comboMoveCost(
  state: FightState,
  side: FightSide,
  move: { id: string; auraCost: number } | null | undefined,
): number | undefined {
  return comboAuraCost(state, side, move?.id) ?? halfPriceCost(state, side, move)
}

/** The body that admission checks see: credited with the combo discount, never paid with it. */
export function comboAdmissionBody(
  state: FightState,
  side: FightSide,
  move: { id: string; auraCost: number } | null | undefined,
) {
  const fighter = state[side]
  const cost = comboMoveCost(state, side, move)
  return cost === undefined || !move || move.auraCost <= cost
    ? fighter
    : { ...fighter, aura: fighter.aura + move.auraCost - cost }
}
