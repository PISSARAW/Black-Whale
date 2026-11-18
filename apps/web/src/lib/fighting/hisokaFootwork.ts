import { canMove } from './fightActorState'
import { seesCombatBody } from './fightCounterplay'
import { attackData } from './frameData'
import { motionOf, steerFighter } from './fighterMovement'
import { styleMobility, styleReactionFrames } from './styleMobility'
import { EMPTY_INPUT, type ArcadeFighter } from './types'

declare module './types' {
  interface ArcadeFighter {
    hisokaFootwork?: { lastStep: number; threat?: string }
  }
}

/** A short retreat then a committed return. Real dash physics keep startup and recovery vulnerable. */
export function moveHisokaOpponent(
  fighter: ArcadeFighter,
  target: ArcadeFighter,
): ArcadeFighter | null {
  if (!bodyAvailable(fighter)) return null
  const dash = motionOf(fighter).dash
  if (dash) return dashStep(fighter, dash.direction)
  return observedFootwork(fighter, target)
}

function bodyAvailable(fighter: ArcadeFighter): boolean {
  return (
    fighter.id === 'hisoka' &&
    canMove(fighter) &&
    fighter.y === 0 &&
    seesCombatBody(fighter) &&
    !fighter.parallelEyesClosed
  )
}

function observedFootwork(fighter: ArcadeFighter, target: ArcadeFighter): ArcadeFighter | null {
  const read = fighter.pressureRead
  if (!read) return null
  const toward = target.x >= fighter.x ? 1 : -1
  const gap = Math.abs(target.x - fighter.x)
  const threat = `${read.move}:${read.clock - read.attackFrame}`
  const memory = fighter.hisokaFootwork
  const rested = read.clock - (memory?.lastStep ?? -1000)
  if (read.seen >= styleReactionFrames(fighter) && target.attack)
    return reactToAttack({ fighter, target, gap }, { toward, threat, rested })
  if (gap > 22 && gap < 42 && rested > 85) return beginStep(fighter, toward, threat)
  return null
}

function reactToAttack(
  context: { fighter: ArcadeFighter; target: ArcadeFighter; gap: number },
  timing: { toward: 1 | -1; threat: string; rested: number },
): ArcadeFighter | null {
  const { fighter, target, gap } = context
  const read = fighter.pressureRead!
  const data = attackData(target.attack!.kind, target)
  const recovering = read.attackFrame >= data.startup + data.active
  if (recovering) return returnToRange(context, timing)
  if (
    !canWithdraw(fighter, { gap, reach: data.box.right + Math.max(0, data.lunge) + 4, ...timing })
  )
    return null
  return beginStep(fighter, timing.toward === 1 ? -1 : 1, timing.threat)
}

function returnToRange(
  { fighter, gap }: { fighter: ArcadeFighter; gap: number },
  timing: { toward: 1 | -1; threat: string; rested: number },
): ArcadeFighter | null {
  return gap >= 9 && gap < 24 && timing.rested >= 14
    ? beginStep(fighter, timing.toward, timing.threat)
    : null
}

function canWithdraw(
  fighter: ArcadeFighter,
  timing: { gap: number; reach: number; threat: string; rested: number },
): boolean {
  return (
    timing.gap <= timing.reach &&
    timing.rested >= 36 &&
    fighter.hisokaFootwork?.threat !== timing.threat
  )
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
  return dashStep(
    {
      ...fighter,
      blocking: false,
      crouching: false,
      guardFrames: 0,
      hisokaFootwork: { lastStep: fighter.pressureRead!.clock, threat },
      motion: { ...motionOf(fighter), dash: { direction, frame: 0, ...profile } },
    },
    direction,
  )
}

function dashStep(fighter: ArcadeFighter, direction: 1 | -1): ArcadeFighter {
  return steerFighter(fighter, {
    input: { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 },
    mobile: true,
    jumpable: false,
  })
}
