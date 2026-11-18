import { blinkyAvailable, blinkyUtilityAttack, plugWoundsInput } from './blinky'
import { luiniKnifeStrike } from './luiniKnife'
import { kallutoFanStrike } from './threeCombatWounds'
import { EMPTY_INPUT, type ArcadeFighter, type FightSide, type FightState } from './types'

/** A landed vacuum blow or actual knife cut opens a wound; ordinary hitstun does not. */
export function recordBlinkyWound(
  before: FightState,
  after: FightState,
  side: FightSide,
): FightState {
  const hit = after.impact
  if (!eligibleWoundImpact(hit)) return after
  if (!woundingStrike(before[side])) return after
  const target = side === 'player' ? 'opponent' : 'player'
  if (after[target].health >= before[target].health) return after
  return {
    ...after,
    [target]: { ...after[target], openWounds: (after[target].openWounds ?? 0) + 1 },
  }
}
function woundingStrike(fighter: ArcadeFighter): boolean {
  return (
    Boolean(fighter.hinrighAxeCounter) ||
    kallutoFanStrike(fighter) ||
    luiniKnifeStrike(fighter) ||
    (blinkyAvailable(fighter) && !blinkyUtilityAttack(fighter))
  )
}

/** AI reacts to visible suction; it can cover two wounds or keep fighting if there are more. */
export function blinkyAiDefense(state: FightState, fighter: ArcadeFighter): ArcadeFighter {
  const threat =
    state.player.hatsuEffects.blinkyFrames > 0 &&
    state.player.attack?.moveId === 'shizuku:finisher' &&
    (fighter.openWounds ?? 0) <= 2
  return plugWoundsInput(fighter, { ...EMPTY_INPUT, plugWounds: threat })
}

function eligibleWoundImpact(hit: FightState['impact']): boolean {
  return Boolean(hit && !hit.blocked && !hit.avoided && hit.damage > 0 && hit.projectileId === null)
}
