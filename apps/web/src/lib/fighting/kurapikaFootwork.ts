import { canMove } from './fightActorState'
import { seesCombatBody } from './fightCounterplay'
import { attackPhase } from './frameData'
import { motionOf, steerFighter } from './fighterMovement'
import { styleMobility, styleReactionFrames } from './styleMobility'
import { EMPTY_INPUT, type ArcadeFighter } from './types'

/** Finite, ordinary dashes in response to an observed attack; no invulnerability or input reading. */
export function moveKurapikaOpponent(
  actor: ArcadeFighter,
  target: ArcadeFighter,
): ArcadeFighter | null {
  if (actor.id !== 'kurapika' || !canMove(actor) || actor.y > 0) return null
  const motion = motionOf(actor)
  if (motion.dash) return dashStep(actor, motion.dash.direction)
  if (!seesCombatBody(actor)) return null
  return approachPrisoner(actor, target) ?? observedPressureStep(actor, target)
}

function approachPrisoner(actor: ArcadeFighter, target: ArcadeFighter): ArcadeFighter | null {
  if (target.chainJail?.owner !== 'opponent') return null
  if (Math.abs(target.x - actor.x) <= 6) return actor
  const direction = target.x >= actor.x ? 1 : -1
  return dashStep(actor, direction)
}

function observedPressureStep(actor: ArcadeFighter, target: ArcadeFighter): ArcadeFighter | null {
  const read = actor.pressureRead
  if (!read?.move || read.seen < styleReactionFrames(actor) || read.clock % 36 !== 0) return null
  return observedStep(actor, target)
}

function observedStep(actor: ArcadeFighter, target: ArcadeFighter): ArcadeFighter | null {
  const gap = Math.abs(target.x - actor.x)
  const toward = target.x >= actor.x ? 1 : -1
  if (gap < 12 && attackPhase(target) !== 'recovery') return beginStep(actor, toward === 1 ? -1 : 1)
  if (actor.nenTactics?.goal === 'recover') return null
  if (gap > 8 && gap < 19 && attackPhase(target) === 'recovery') return beginStep(actor, toward)
  return null
}

function beginStep(actor: ArcadeFighter, direction: 1 | -1): ArcadeFighter | null {
  if (direction < 0 && actor.x < 14) return null
  if (direction > 0 && actor.x > 86) return null
  const mobility = styleMobility(actor)
  const profile = direction === actor.facing ? mobility.forwardDash : mobility.backDash
  return dashStep(
    {
      ...actor,
      blocking: false,
      crouching: false,
      guardFrames: 0,
      motion: { ...motionOf(actor), dash: { direction, frame: 0, ...profile } },
    },
    direction,
  )
}

function dashStep(actor: ArcadeFighter, direction: 1 | -1): ArcadeFighter {
  return steerFighter(actor, {
    input: { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 },
    mobile: true,
    jumpable: false,
  })
}
