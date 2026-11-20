import { GUM_RECALL_COST } from './bungeeTypes'
import type { FightSide, FightState } from './types'

/**
 * Élastique meurtrier (signatureCombos.ts): while Hisoka's opponent is still held in his
 * combo, recalling or rebounding an existing link costs what the network command costs,
 * and the Elastic Execution that closes a combo held by tension élastique (elasticHold.ts)
 * costs 40 instead of 55. Duel tuning, not canon.
 */
const COMBO_COSTS: Readonly<Record<string, number>> = {
  'hisoka:forwardSpecial': GUM_RECALL_COST,
  'hisoka:backSpecial': GUM_RECALL_COST,
  'hisoka:finisher': 40,
}

export function comboAuraCost(state: FightState, side: FightSide, moveId?: string) {
  const cost = moveId === undefined ? undefined : COMBO_COSTS[moveId]
  if (cost === undefined || state[side].id !== 'hisoka') return undefined
  if (!opponentHeldInCombo(state, side)) return undefined
  // The discounted execution concludes Élastique meurtrier only: tension élastique was used.
  return moveId !== 'hisoka:finisher' || state[side].elasticHold ? cost : undefined
}

export function opponentHeldInCombo(state: FightState, side: FightSide): boolean {
  const target = state[side === 'player' ? 'opponent' : 'player']
  return target.comboHits > 0 && (target.hitStun > 0 || target.knockdownFrames > 0)
}

/** The body that admission checks see: credited with the combo discount, never paid with it. */
export function comboAdmissionBody(
  state: FightState,
  side: FightSide,
  move: { id: string; auraCost: number } | null | undefined,
) {
  const fighter = state[side]
  const cost = comboAuraCost(state, side, move?.id)
  return cost === undefined || !move || move.auraCost <= cost
    ? fighter
    : { ...fighter, aura: fighter.aura + move.auraCost - cost }
}
