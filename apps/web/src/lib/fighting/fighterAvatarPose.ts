import type { HumanPose } from '$lib/tour/humanAnimation'
import { KO_DURATION } from './fightMoves'
import { attackProgress } from './frameData'
import type { ArcadeFighter, FighterPose } from './types'

/** Fight pose → base pose of the human rig used by the avatar. */
export const MODEL_POSES: Record<FighterPose, HumanPose> = {
  idle: 'idle',
  walk: 'walk',
  jump: 'idle',
  guard: 'guard',
  light: 'idle',
  heavy: 'idle',
  special: 'idle',
  ranged: 'idle',
  hit: 'idle',
  down: 'fallen',
  wakeup: 'idle',
  ko: 'idle',
}

/** Progress of the current pose; `elapsed` is seconds since the pose began. */
export function avatarPoseProgress(fighter: ArcadeFighter, elapsed: number): number {
  let progress = attackProgress(fighter)
  if (fighter.pose === 'jump') {
    progress = Math.min(1, Math.max(0, (48 - fighter.velocityY) / 96))
  } else if (fighter.pose === 'hit') {
    progress = Math.min(1, Math.max(0, 1 - fighter.hitStun / 26))
  } else if (fighter.pose === 'ko') {
    // The match loop stops on K.O.; the fall finishes on the render clock.
    progress = Math.max(progress, Math.min(1, elapsed / KO_DURATION))
  }
  return progress
}
