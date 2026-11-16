import { poseProgress } from './sceneMotion'
import type { ArcadeFighter, FightSide, FighterPose } from './types'

interface PoseClock {
  pose: FighterPose
  started: number
  duration: number
  remaining: number
  impact: number
}
const reactionRemaining = (fighter: ArcadeFighter): number => {
  if (fighter.pose === 'hit') return fighter.hitStun
  if (fighter.pose === 'down') return fighter.knockdownFrames
  return fighter.pose === 'wakeup' ? fighter.wakeupInvulnerableFrames : 0
}

/** Reactions use their own stun duration and freeze with simulation, including during hitstop. */
export function createFightPoseClock() {
  const clocks: Partial<Record<FightSide, PoseClock>> = {}
  return (
    side: FightSide,
    fighter: ArcadeFighter,
    { seconds, impact = 0 }: { seconds: number; impact?: number },
  ): number => {
    const remaining = reactionRemaining(fighter)
    let clock = clocks[side]
    const renewed = clock && reactionRenewed(clock, { pose: fighter.pose, remaining, impact })
    if (!clock || clock.pose !== fighter.pose || renewed) {
      clock = {
        pose: fighter.pose,
        started: seconds,
        duration: Math.max(1, remaining),
        remaining,
        impact,
      }
      clocks[side] = clock
    }
    clock.remaining = remaining
    if (impact > 0) clock.impact = impact
    if (remaining > 0) return Math.max(0, Math.min(1, 1 - remaining / clock.duration))
    return poseProgress(fighter, { seconds, started: clock.started })
  }
}

function reactionRenewed(
  clock: PoseClock,
  current: Pick<PoseClock, 'pose' | 'remaining' | 'impact'>,
): boolean {
  return (
    current.remaining > clock.remaining ||
    (current.pose === 'hit' && current.impact > 0 && current.impact !== clock.impact)
  )
}
