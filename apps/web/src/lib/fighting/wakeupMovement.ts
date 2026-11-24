import { physicalCombatProfile } from './physicalCombatProfiles'
import type { ArcadeFighter, FightInput } from './types'

declare module './types' {
  interface ArcadeFighter {
    /** Prevents chaining delayed wakeups during the same knockdown. */
    wakeupDelayUsed?: boolean
    /** Short directional ukemi roll executed upon waking from a knockdown. */
    ukemiRoll?: { direction: -1 | 1; frames: number }
  }
}

export const DELAYED_WAKEUP_FRAMES = 14
export const UKEMI_ROLL_FRAMES = 10
export const UKEMI_ROLL_SPEED = 0.6

const MIN_X = 7
const MAX_X = 93

/**
 * Applies delayed wakeup (holding down on the last knockdown frame) and starts a directional
 * ukemi roll (holding left/right + guard on wakeup). Grants no extra invulnerability.
 */
export function resolveWakeupMovement(
  fighter: ArcadeFighter,
  input: FightInput,
  knockdownAfter: number,
): Partial<ArcadeFighter> {
  const roll = advanceUkemiRoll(fighter)
  if (fighter.knockdownFrames === 1 && canDelayWakeup(fighter, input)) {
    return {
      ...roll,
      knockdownFrames: DELAYED_WAKEUP_FRAMES,
      wakeupDelayUsed: true,
    }
  }
  const wokeUp = fighter.knockdownFrames > 0 && knockdownAfter === 0
  if (!wokeUp) {
    return fighter.knockdownFrames === 0 && fighter.wakeupDelayUsed
      ? { ...roll, wakeupDelayUsed: undefined }
      : roll
  }
  const ukemi = startUkemiRoll(fighter, input)
  return {
    ...roll,
    wakeupDelayUsed: undefined,
    ...(ukemi ? { ukemiRoll: ukemi } : {}),
  }
}

function canDelayWakeup(fighter: ArcadeFighter, input: FightInput): boolean {
  if (!input.down || fighter.wakeupDelayUsed || fighter.health <= 0) return false
  return !fighter.halkSoulSleep && !fighter.arsenalSleep && fighter.machiThread?.kind !== 'bind'
}

function startUkemiRoll(
  fighter: ArcadeFighter,
  input: FightInput,
): { direction: -1 | 1; frames: number } | undefined {
  if (!input.guard || input.down || fighter.health <= 0) return undefined
  if (fighter.halkSoulSleep || fighter.arsenalSleep || fighter.machiThread?.kind === 'bind') {
    return undefined
  }
  const direction = (Number(input.right) - Number(input.left)) as -1 | 0 | 1
  if (direction === 0) return undefined
  return { direction, frames: UKEMI_ROLL_FRAMES }
}

function advanceUkemiRoll(fighter: ArcadeFighter): Partial<ArcadeFighter> {
  const roll = fighter.ukemiRoll
  if (!roll) return {}
  if (fighter.hitStun > 0 || fighter.knockdownFrames > 0 || fighter.attack) {
    return { ukemiRoll: undefined }
  }
  const speed = UKEMI_ROLL_SPEED * (physicalCombatProfile(fighter.id)?.roll ?? 1)
  const x = Math.min(MAX_X, Math.max(MIN_X, fighter.x + roll.direction * speed))
  const nextFrames = roll.frames - 1
  return {
    x,
    ukemiRoll: nextFrames > 0 ? { ...roll, frames: nextFrames } : undefined,
  }
}
