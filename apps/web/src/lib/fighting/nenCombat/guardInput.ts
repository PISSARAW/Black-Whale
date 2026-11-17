import { canGuard } from '../fightActorState'
import type { ArcadeFighter, FightInput } from '../types'
/** The player still presses Guard; an explicit defensive Ko may replace Ken's aura posture. */
export function playerIsBlocking(fighter: ArcadeFighter, input: FightInput): boolean {
  if (!input.guard || !canGuard(fighter)) return false
  if (!input.aura || fighter.nen.ken) return true
  return Boolean(fighter.defensiveKo && fighter.nen.ko === fighter.defensiveKo)
}

const RYU_FOLLOW_UP_FRAMES = 10
export function updatePlayerGuard(fighter: ArcadeFighter, input: FightInput): ArcadeFighter {
  const blocking = playerIsBlocking(fighter, input)
  const releasedGuard = fighter.blocking && !blocking
  return {
    ...fighter,
    blocking,
    guardFrames: blocking ? (fighter.blocking ? fighter.guardFrames + 1 : 1) : 0,
    ryuWindow: releasedGuard ? RYU_FOLLOW_UP_FRAMES : fighter.ryuWindow,
  }
}
