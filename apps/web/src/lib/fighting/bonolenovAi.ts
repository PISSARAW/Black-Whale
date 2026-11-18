import { canMove } from './fightActorState'
import { seesCombatBody } from './fightCounterplay'
import { motionOf, steerFighter } from './fighterMovement'
import { styleMobility, styleReactionFrames } from './styleMobility'
import { EMPTY_INPUT, type ArcadeFighter } from './types'

/** Retreating pivots use ordinary dash distance and vulnerability, after a readable threat. */
export function moveBonolenovOpponent(
  fighter: ArcadeFighter,
  target: ArcadeFighter,
): ArcadeFighter | null {
  if (fighter.id !== 'bonolenov' || !canMove(fighter) || fighter.y > 0) return null
  const motion = motionOf(fighter)
  if (motion.dash) return step(fighter, motion.dash.direction)
  const read = fighter.observedHabits
  if (!read || !seesCombatBody(fighter) || read.lastFrame % 24 !== 0) return null
  const direction = pivotDirection(fighter, target)
  return direction ? pivot(fighter, direction) : null
}

function pivotDirection(fighter: ArcadeFighter, target: ArcadeFighter): 1 | -1 | null {
  const read = fighter.observedHabits!
  const gap = Math.abs(target.x - fighter.x)
  const away = target.x >= fighter.x ? -1 : 1
  if (
    read.seenAttackFrame !== null &&
    read.lastFrame - read.firstSeenAt >= styleReactionFrames(fighter) &&
    gap < 18
  )
    return away
  // A prepared spear approaches its actual reach instead of standing still or starting Jupiter.
  if (canApproachWithSpear(fighter, gap)) return away === 1 ? -1 : 1
  return null
}

function canApproachWithSpear(fighter: ArcadeFighter, gap: number): boolean {
  return Boolean(
    fighter.battleCantabile?.prologue &&
    fighter.observedHabits?.seenAttackFrame === null &&
    gap > 20 &&
    gap < 34,
  )
}

function pivot(fighter: ArcadeFighter, direction: 1 | -1): ArcadeFighter | null {
  if ((direction < 0 && fighter.x < 16) || (direction > 0 && fighter.x > 84)) return null
  const mobility = styleMobility(fighter)
  const profile = direction === fighter.facing ? mobility.forwardDash : mobility.backDash
  return step(
    {
      ...fighter,
      blocking: false,
      crouching: false,
      guardFrames: 0,
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
