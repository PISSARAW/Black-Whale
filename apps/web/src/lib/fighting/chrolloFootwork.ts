import { canMove } from './fightActorState'
import { seesCombatBody } from './fightCounterplay'
import { attackData } from './frameData'
import { motionOf, steerFighter } from './fighterMovement'
import { styleMobility, styleReactionFrames } from './styleMobility'
import { EMPTY_INPUT, type ArcadeFighter } from './types'

declare module './types' {
  interface ArcadeFighter {
    chrolloFootwork?: { lastStep: number; threat: string }
  }
}

/** Yorknew: concede a little space, then enter on a seen recovery. No automatic evasion. */
export function moveChrolloOpponent(
  fighter: ArcadeFighter,
  target: ArcadeFighter,
): ArcadeFighter | null {
  if (!canStep(fighter)) return null
  const dash = motionOf(fighter).dash
  if (dash) return step(fighter, dash.direction)
  const read = fighter.pressureRead
  if (!read) return null
  const gap = Math.abs(target.x - fighter.x)
  const rested = read.clock - (fighter.chrolloFootwork?.lastStep ?? -1000)
  const toward = target.x >= fighter.x ? 1 : -1
  if (quietApproach(fighter, gap, rested)) return beginStep(fighter, toward, 'approach')
  return observedStep({ fighter, target, gap }, { toward, rested })
}
function quietApproach(fighter: ArcadeFighter, gap: number, rested: number): boolean {
  return !fighter.pressureRead!.move && gap > 22 && gap < 36 && rested > 95
}
function canStep(fighter: ArcadeFighter): boolean {
  return (
    fighter.id === 'chrollo' &&
    canMove(fighter) &&
    fighter.y === 0 &&
    seesCombatBody(fighter) &&
    !fighter.parallelEyesClosed
  )
}

function observedStep(
  context: { fighter: ArcadeFighter; target: ArcadeFighter; gap: number },
  timing: { toward: 1 | -1; rested: number },
): ArcadeFighter | null {
  const { fighter, target, gap } = context
  const read = fighter.pressureRead!
  if (!target.attack || !read.move || read.seen < styleReactionFrames(fighter)) return null
  const data = attackData(target.attack.kind, target)
  const recovering = read.attackFrame >= data.startup + data.active
  const threat = `${read.move}:${read.clock - read.attackFrame}`
  if (recovering)
    return gap > 8 && gap < 23 && timing.rested >= 14
      ? beginStep(fighter, timing.toward, threat)
      : null
  return retreat(context, {
    ...timing,
    threat,
    reach: data.box.right + Math.max(0, data.lunge) + 3,
  })
}

function retreat(
  { fighter, gap }: { fighter: ArcadeFighter; gap: number },
  timing: { toward: 1 | -1; rested: number; threat: string; reach: number },
): ArcadeFighter | null {
  if (gap > timing.reach || timing.rested < 40 || fighter.chrolloFootwork?.threat === timing.threat)
    return null
  return beginStep(fighter, timing.toward === 1 ? -1 : 1, timing.threat)
}

function beginStep(
  fighter: ArcadeFighter,
  direction: 1 | -1,
  threat: string,
): ArcadeFighter | null {
  if (direction < 0 && fighter.x < 14) return null
  if (direction > 0 && fighter.x > 86) return null
  const mobility = styleMobility(fighter)
  const profile = direction === fighter.facing ? mobility.forwardDash : mobility.backDash
  return step(
    {
      ...fighter,
      blocking: false,
      crouching: false,
      guardFrames: 0,
      chrolloFootwork: { lastStep: fighter.pressureRead!.clock, threat },
      motion: { ...motionOf(fighter), dash: { direction, frame: 0, ...profile } },
    },
    direction,
  )
}

function step(fighter: ArcadeFighter, direction: 1 | -1): ArcadeFighter {
  return steerFighter(fighter, {
    input: { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 },
    mobile: true,
    jumpable: false,
  })
}
