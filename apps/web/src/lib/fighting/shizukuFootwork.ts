import { blinkyAvailable, exposedBlinkyWounds, BLINKY_HALF_HEIGHT } from './blinky'
import { canMove } from './fightActorState'
import { seesCombatBody } from './fightCounterplay'
import { motionOf, steerFighter } from './fighterMovement'
import { EMPTY_INPUT, type ArcadeFighter } from './types'

/** Pike: walk out to suction distance after opening a wound; active attacks remain committed. */
export function moveShizukuOpponent(
  actor: ArcadeFighter,
  target: ArcadeFighter,
): ArcadeFighter | null {
  if (actor.id !== 'shizuku' || !canMove(actor) || actor.y > 0 || actor.blocking) return null
  if (actor.nenTactics?.goal === 'recover') return null
  if (!bloodSpacingAvailable(actor, target)) return null
  const direction = bloodSpacingDirection(actor, target)
  return steerFighter(
    { ...actor, crouching: false, motion: { ...motionOf(actor), tapWindow: 0, tapDirection: 0 } },
    {
      input: { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 },
      mobile: true,
      jumpable: false,
    },
  )
}

function bloodSpacingDirection(actor: ArcadeFighter, target: ArcadeFighter): number {
  const gap = Math.abs(target.x - actor.x)
  const toward = target.x >= actor.x ? 1 : -1
  return gap < 11 ? -toward : gap > 17 ? toward : 0
}

function bloodSpacingAvailable(actor: ArcadeFighter, target: ArcadeFighter): boolean {
  return (
    blinkyAvailable(actor) &&
    seesCombatBody(actor) &&
    exposedBlinkyWounds(target) > 0 &&
    Math.abs(target.y - actor.y) <= BLINKY_HALF_HEIGHT
  )
}
