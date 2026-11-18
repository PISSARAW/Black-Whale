import { martialSlots, type ArsenalAiContext } from './arsenalAiTypes'
import { feitanObservedEvasion } from './feitanEvasion'
import { canMove } from './fightActorState'
import { seesCombatBody } from './fightCounterplay'
import { motionOf, steerFighter } from './fighterMovement'
import { feitanMoveAvailable } from './feitanPain'
import { styleMobility, styleReactionFrames } from './styleMobility'
import { EMPTY_INPUT, type ArcadeFighter, type MoveSlot } from './types'

/** Blade pressure first; injury-driven retaliation only when its real conditions hold. */
export function feitanAiSlots({ state, roll, gap }: ArsenalAiContext): readonly MoveSlot[] {
  const actor = state.opponent
  if (feitanMoveAvailable(actor, 'feitan:finisher')) return ['finisher', 'standingLight']
  if (packPainAtDistance(actor, gap)) return ['neutralSpecial', 'forwardSpecial']
  if (actor.umbrellaFeintFrames) return ['forwardSpecial', 'forwardLight', 'standingHeavy']
  if (gap > 10)
    return roll < 0.3
      ? ['forwardSpecial', 'forwardLight']
      : ['forwardLight', 'forwardHeavy', 'forwardSpecial']
  if (roll < 0.3) return ['lowLight', 'standingHeavy', 'downSpecial']
  if (roll < 0.65) return ['standingLight', 'forwardLight', 'standingHeavy']
  return ['backHeavy', 'backSpecial', 'standingHeavy']
}

function packPainAtDistance(actor: ArcadeFighter, gap: number): boolean {
  const injury = actor.hatsuEffects.painPacker?.injuries ?? 0
  return (
    gap >= 12 &&
    injury >= Math.max(20, actor.maxHealth * 0.2) &&
    feitanMoveAvailable(actor, 'feitan:neutralSpecial')
  )
}

/** Generic Nen planning filters out normals. Preserve this physical fighter's actual priorities. */
export function feitanArsenalSlots(context: ArsenalAiContext): readonly MoveSlot[] | null {
  if (context.state.opponent.id !== 'feitan') return null
  return [...new Set([...feitanAiSlots(context), ...martialSlots(context)])]
}

/** Uses observed pressure and the same finite dash as human input. Never reads hidden inputs. */
export function moveFeitanOpponent(
  fighter: ArcadeFighter,
  target: ArcadeFighter,
): ArcadeFighter | null {
  if (fighter.id !== 'feitan' || !canMove(fighter) || fighter.y > 0) return null
  const motion = motionOf(fighter)
  if (motion.dash) return dashStep(fighter, motion.dash.direction)
  if (!seesCombatBody(fighter)) return null
  return feitanObservedEvasion(fighter, target) ?? observedFootwork(fighter, target)
}

function observedFootwork(fighter: ArcadeFighter, target: ArcadeFighter): ArcadeFighter | null {
  const read = fighter.pressureRead
  if (!read || read.clock % 48 !== 0) return null
  const toward = target.x >= fighter.x ? 1 : -1
  const gap = Math.abs(target.x - fighter.x)
  if (read.seen >= styleReactionFrames(fighter) && gap < 14)
    return beginDash(fighter, toward === 1 ? -1 : 1)
  return approachWhenIdle(fighter, { gap, toward })
}

function approachWhenIdle(
  fighter: ArcadeFighter,
  space: { gap: number; toward: 1 | -1 },
): ArcadeFighter | null {
  const read = fighter.pressureRead!
  if (read.move || space.gap < 14 || space.gap > 30) return null
  if (space.gap <= 22 && read.clock % 96 === 48) return approachJump(fighter, space.toward)
  return beginDash(fighter, space.toward)
}

function approachJump(fighter: ArcadeFighter, direction: 1 | -1): ArcadeFighter {
  return steerFighter(
    { ...fighter, blocking: false, crouching: false, guardFrames: 0 },
    {
      input: { ...EMPTY_INPUT, left: direction < 0, right: direction > 0, jump: true },
      mobile: true,
      jumpable: true,
    },
  )
}

function beginDash(fighter: ArcadeFighter, direction: 1 | -1): ArcadeFighter | null {
  if (direction < 0 && fighter.x < 15) return null
  if (direction > 0 && fighter.x > 85) return null
  const mobility = styleMobility(fighter)
  const profile = direction === fighter.facing ? mobility.forwardDash : mobility.backDash
  const next = {
    ...fighter,
    blocking: false,
    crouching: false,
    guardFrames: 0,
    motion: { ...motionOf(fighter), dash: { direction, frame: 0, ...profile } },
  }
  return dashStep(next, direction)
}

function dashStep(fighter: ArcadeFighter, direction: 1 | -1): ArcadeFighter {
  return steerFighter(fighter, {
    input: { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 },
    mobile: true,
    jumpable: false,
  })
}
