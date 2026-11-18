import { attackData, attackPhase } from './frameData'
import { motionOf, steerFighter } from './fighterMovement'
import { styleReactionFrames } from './styleMobility'
import { EMPTY_INPUT, type ArcadeFighter } from './types'

/** React to a seen swing: low slip under a high line, or a real jump over a sweep. */
export function feitanObservedEvasion(
  fighter: ArcadeFighter,
  target: ArcadeFighter,
): ArcadeFighter | null {
  if ((fighter.pressureRead?.seen ?? 0) < styleReactionFrames(fighter)) return null
  if (!target.attack || attackPhase(target) === 'recovery') return null
  if (Math.abs(target.x - fighter.x) > 13) return null
  const data = attackData(target.attack.kind, target)
  if (data.guard === 'low') return hopSweep(fighter)
  if (data.targetZone !== 'head' && data.box.bottom < 7) return null
  return { ...fighter, pose: 'idle', crouching: true, blocking: false, guardFrames: 0 }
}

function hopSweep(fighter: ArcadeFighter): ArcadeFighter {
  const grounded = motionOf(fighter).landingFrames === 0
  return steerFighter(
    { ...fighter, crouching: false, blocking: false, guardFrames: 0 },
    {
      input: { ...EMPTY_INPUT, jump: true },
      mobile: true,
      jumpable: grounded,
    },
  )
}
