import type { ArcadeFighter, FightProjectile, FightState } from './types'

/** The real fan's edge cuts (ch. 226); confiscation leaves only the unarmed normal. */
export function kallutoFanStrike(fighter: ArcadeFighter): boolean {
  return (
    fighter.id === 'kalluto' &&
    Boolean(fighter.paperKit?.fan && fighter.paperKit.integrity > 0) &&
    !fighter.weaponsConfiscated &&
    Boolean(
      fighter.attack &&
      ['light', 'heavy'].includes(fighter.attack.kind) &&
      fighter.attack.variant !== 'throw',
    )
  )
}

/** A physical cut can be covered, stitched or drained; blocks and transferred wounds never duplicate it. */
export function recordThreeCombatProjectileWound(
  state: FightState,
  shot: FightProjectile,
): FightState {
  const hit = state.impact
  if (!cuttingProjectile(shot) || !landedCut(hit) || hit!.projectileId !== shot.id) return state
  const target = shot.owner === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    [target]: { ...state[target], openWounds: (state[target].openWounds ?? 0) + 1 },
  }
}

function cuttingProjectile(shot: FightProjectile): boolean {
  return (
    Boolean(shot.kallutoPaper) ||
    (shot.fighterId === 'hinrigh' && shot.shape === 'needle' && shot.matter === 'object')
  )
}
function landedCut(hit: FightState['impact']): boolean {
  return Boolean(hit && !hit.blocked && !hit.avoided && !hit.transfer && hit.damage > 0)
}
