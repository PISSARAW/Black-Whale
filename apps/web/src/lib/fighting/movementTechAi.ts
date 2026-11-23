import { styleMatchup } from './styleMatchups'
import { canGuard, canMove } from './fightActorState'
import { EMPTY_INPUT, type ArcadeFighter, type FightInput } from './types'

const WAKEUP_PRESSURE_RANGE = 18
const SWAY_MIN_RANGE = 6
const SWAY_MAX_RANGE = 13

/**
 * Deterministic AI wakeup choice when pressured at close range: alternates between
 * directional Ukemi roll (away from pressure or out of the corner), Delayed Wakeup,
 * and ordinary standing wakeup. Never reads hidden buffers or private forecasts.
 */
export function aiWakeupInput(
  fighter: ArcadeFighter,
  target: ArcadeFighter,
  frame: number,
): FightInput {
  if (fighter.knockdownFrames !== 1) return EMPTY_INPUT
  if (Math.abs(fighter.x - target.x) > WAKEUP_PRESSURE_RANGE) return EMPTY_INPUT
  const choice = (frame + Math.round(fighter.health)) % 3
  if (choice === 0) return ukemiDirectionInput(fighter, target)
  if (choice === 1 && !fighter.wakeupDelayUsed) return { ...EMPTY_INPUT, down: true }
  return EMPTY_INPUT
}

/**
 * Deterministic AI Back Sway against a visible standing strike startup at poke range.
 * Reserved to mobile/control styles and gated by normal sway cooldown and guard rules.
 */
export function aiBackSwayInput(
  fighter: ArcadeFighter,
  target: ArcadeFighter,
): FightInput | null {
  if (!swayEligible(fighter) || !visibleHighPoke(fighter, target)) return null
  const back = -fighter.facing
  return { ...EMPTY_INPUT, left: back < 0, right: back > 0, guard: true }
}

function ukemiDirectionInput(fighter: ArcadeFighter, target: ArcadeFighter): FightInput {
  const away = target.x >= fighter.x ? -1 : 1
  const dir = fighter.x <= 14 ? 1 : fighter.x >= 86 ? -1 : away
  return { ...EMPTY_INPUT, left: dir < 0, right: dir > 0, guard: true }
}

function swayEligible(fighter: ArcadeFighter): boolean {
  if (!canMove(fighter) || !canGuard(fighter) || fighter.y > 0) return false
  if ((fighter.swayFrames ?? 0) > 0 || (fighter.swayCooldown ?? 0) > 0) return false
  const role = styleMatchup(fighter.id).role
  return role === 'mobile' || role === 'control'
}

function visibleHighPoke(fighter: ArcadeFighter, target: ArcadeFighter): boolean {
  const attack = target.attack
  if (!attack || attack.impacted || attack.frame < 2 || attack.frame > 6) return false
  if ((attack.variant ?? 'standing') !== 'standing') return false
  if (attack.kind !== 'light' && attack.kind !== 'heavy') return false
  const dist = Math.abs(fighter.x - target.x)
  return dist >= SWAY_MIN_RANGE && dist <= SWAY_MAX_RANGE
}
