import { combatReducer } from '../combat/reducer'
import type { BodyZone, CombatState } from '../combat/types'
import { arenaZone } from '../combat/clashNen'
import { moveById, moveForSlot, movesetFor } from '../fighting/movesets'
import type { FighterId, MoveSlot } from '../fighting/types'
import type { ArenaDifficulty } from './ai'

/** How many moves of an authored Clash route each difficulty dares to chain. */
const COMBO_DEPTH: Record<ArenaDifficulty, number> = { initiate: 1, fighter: 3, master: 5 }

/** Authored Clash combo routes that start on the ground; Arena has no jump yet. */
function groundRoutes(fighterId: FighterId): readonly (readonly string[])[] {
  const routes = movesetFor(fighterId)?.combos ?? []
  return routes.filter((route) => route.every((id) => !moveById(id)?.slot.startsWith('air')))
}

/** First move of the route the opponent commits to on this decision beat. */
export function aiOpeningSlot(fighterId: FighterId, beat: number): MoveSlot {
  const routes = groundRoutes(fighterId)
  if (!routes.length) return beat % 3 === 0 ? 'standingHeavy' : 'standingLight'
  return moveById(routes[beat % routes.length][0])?.slot ?? 'standingLight'
}

/** Under Clash rules a Ko powers only its limb: engage it where the next opening strikes. */
export function aiKoZone(fighterId: FighterId, beat: number): BodyZone {
  const move = moveForSlot(fighterId, aiOpeningSlot(fighterId, beat))
  return arenaZone(move?.tuning.auraZone ?? 'hands')
}

/**
 * Follows an authored Clash route while its cancel window is open. It runs on
 * every tick, because a cancel window is shorter than the decision cadence.
 */
export function continueAiCombo(
  state: CombatState,
  fighterId: FighterId,
  difficulty: ArenaDifficulty,
): CombatState | null {
  const chain = state.opponent.chain
  if (!chain || chain.connected !== 'hit' || chain.until < state.clock) return null
  if (state.opponent.intent || chain.history.length >= COMBO_DEPTH[difficulty]) return null
  const route = groundRoutes(fighterId).find((candidate) =>
    chain.history.every((id, index) => candidate[index] === id),
  )
  const next = route ? moveById(route[chain.history.length]) : null
  if (!next) return null
  const after = combatReducer(state, {
    type: 'FIGHTING_MOVE',
    side: 'opponent',
    fighterId,
    slot: next.slot,
    targetAt: state.player.position,
  })
  return after === state ? null : after
}
