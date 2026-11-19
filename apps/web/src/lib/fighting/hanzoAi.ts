import { hanzoBladeAvailable } from './hanzoBlade'
import { canMove } from './fightActorState'
import { seesCombatBody } from './fightCounterplay'
import { motionOf, steerFighter } from './fighterMovement'
import { styleMobility, styleReactionFrames } from './styleMobility'
import type { ArsenalAiContext } from './arsenalAiTypes'
import { EMPTY_INPUT, type ArcadeFighter, type MoveSlot } from './types'

/** Hunter Exam hand-to-hand pressure first; Skill 4 is a separate exposed preparation. */
export function hanzoAiSlots({ state, gap, roll }: ArsenalAiContext): readonly MoveSlot[] {
  const actor = state.opponent
  if (actor.hanzoProjection) return ['finisher', 'forwardLight', 'standingLight']
  if (actor.y > 0) return ['airLight', 'airHeavy']
  if (prepareDouble(actor, gap, roll)) return ['neutralSpecial', 'forwardHeavy']
  return martialChoices(actor, gap, roll)
}

function martialChoices(actor: ArcadeFighter, gap: number, roll: number): readonly MoveSlot[] {
  if (hanzoBladeAvailable(actor) && roll > 0.82)
    return ['forwardSpecial', 'backSpecial', 'standingLight']
  if (gap > 11) return ['forwardLight', 'forwardHeavy', 'forwardSpecial']
  if (gap <= 5 && roll < 0.2) return ['throw', 'standingLight']
  if (roll < 0.4) return ['lowLight', 'standingHeavy', 'lowHeavy']
  if (roll < 0.75) return ['standingLight', 'standingHeavy', 'forwardLight']
  return ['backHeavy', 'backSpecial', 'standingLight']
}

function prepareDouble(actor: ArcadeFighter, gap: number, roll: number): boolean {
  return gap > 30 && roll > 0.85 && !actor.pressureRead?.move
}

/** A short physical step on observed pressure, never an instant displacement behind the rival. */
export function moveHanzoOpponent(
  fighter: ArcadeFighter,
  target: ArcadeFighter,
): ArcadeFighter | null {
  if (fighter.id !== 'hanzo' || fighter.hanzoProjection || !canMove(fighter) || fighter.y > 0)
    return null
  const dash = motionOf(fighter).dash
  if (dash) return dashStep(fighter, dash.direction)
  if (!seesCombatBody(fighter)) return null
  return observedStep(fighter, target)
}

function observedStep(fighter: ArcadeFighter, target: ArcadeFighter): ArcadeFighter | null {
  const read = fighter.pressureRead
  if (!read || read.clock % 60 !== 0) return null
  const gap = Math.abs(target.x - fighter.x)
  const toward = target.x >= fighter.x ? 1 : -1
  if (read.move) {
    if (read.seen < styleReactionFrames(fighter) || gap >= 13) return null
    return beginStep(fighter, -toward as 1 | -1)
  }
  if (gap < 18 || gap > 34) return null
  return beginStep(fighter, toward)
}

function beginStep(fighter: ArcadeFighter, direction: 1 | -1): ArcadeFighter | null {
  if ((direction < 0 && fighter.x < 14) || (direction > 0 && fighter.x > 86)) return null
  const mobility = styleMobility(fighter)
  const profile = direction === fighter.facing ? mobility.forwardDash : mobility.backDash
  return dashStep(
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

function dashStep(fighter: ArcadeFighter, direction: 1 | -1): ArcadeFighter {
  return steerFighter(fighter, {
    input: { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 },
    mobile: true,
    jumpable: false,
  })
}
