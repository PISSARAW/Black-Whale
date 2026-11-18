import { steerFighter } from './fighterMovement'
import { EMPTY_INPUT } from './types'
import { canMove as combatCanMove } from './fightActorState'
import { seesCombatBody } from './fightCounterplay'
import { illumiBodyFree } from './illumiState'
import { crossGameBusy } from './crossGame'
import { bashoWriting } from './bashoPoem'
import { musicPacifies } from './melodyRules'
import { healthPercent } from './health'
import { projectionPreparing, sleepingBody } from './hanzoProjection'
import { shouldStyleGuard } from './fightStyles'
import { nenSpacingDirection } from './nenCombatDoctrine'
import type { ArcadeFighter } from './types'

function moveFreeOpponent(fighter: ArcadeFighter, player: ArcadeFighter): ArcadeFighter {
  if (opponentCannotGuard(fighter)) return { ...fighter, blocking: false }
  if (crossGameBusy(fighter) || projectionPreparing(fighter) || bashoWriting(fighter))
    return fighter
  const target = opponentTarget(fighter, player)
  const gap = Math.abs(target.x - fighter.x)
  const next = opponentGuardState(fighter, player, gap)
  const blocking = next.blocking
  if (!canMove(next) || blocking) return next
  const direction = (target.x < next.x ? -1 : 1) * opponentMotion(next, gap)
  const input = { ...EMPTY_INPUT, left: direction < 0, right: direction > 0 }
  // Ordinary AI spacing is a walk; only deliberate double-tap commands initiate dashes.
  const tracked = next.motion
    ? { ...next, motion: { ...next.motion, tapWindow: 0, tapDirection: 0 as const } }
    : next
  return steerFighter(tracked, { input, mobile: canMove(tracked), jumpable: false })
}

function opponentCannotGuard(fighter: ArcadeFighter): boolean {
  return !illumiBodyFree(fighter) || Boolean(fighter.melodyPerformance) || musicPacifies(fighter)
}

function shouldBlock(fighter: ArcadeFighter, player: ArcadeFighter, gap: number): boolean {
  if (!seesCombatBody(fighter)) return false
  const threatened = player.pose === 'heavy' || player.pose === 'special'
  return shouldStyleGuard(fighter.id, { gap, threatened }) && canMove(fighter) && fighter.y === 0
}

function canMove(fighter: ArcadeFighter): boolean {
  return combatCanMove(fighter)
}

function returningToBody(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.hanzoProjection) && fighter.aura < 16
}

function opponentBlocking(fighter: ArcadeFighter, player: ArcadeFighter, gap: number): boolean {
  if (fighter.coveringEars) return false
  if (fighter.hanzoProjection) return false
  return fighter.blockStun > 0 || shouldBlock(fighter, player, gap)
}

function opponentTarget(fighter: ArcadeFighter, player: ArcadeFighter): ArcadeFighter {
  return returningToBody(fighter) ? sleepingBody(fighter) : player
}

function opponentMotion(fighter: ArcadeFighter, gap: number): number {
  return returningToBody(fighter)
    ? 1
    : nenSpacingDirection(fighter, { gap, health: healthPercent(fighter) })
}

function opponentGuardState(
  fighter: ArcadeFighter,
  player: ArcadeFighter,
  gap: number,
): ArcadeFighter {
  const blocking = opponentBlocking(fighter, player, gap)
  const releasedGuard = fighter.blocking && !blocking
  return {
    ...fighter,
    blocking,
    guardFrames: blocking ? (fighter.blocking ? fighter.guardFrames + 1 : 1) : 0,
    ryuWindow: releasedGuard ? 10 : fighter.ryuWindow,
  }
}

export function moveOpponent(fighter: ArcadeFighter, player: ArcadeFighter): ArcadeFighter {
  return illumiBodyFree(fighter)
    ? moveFreeOpponent(fighter, player)
    : { ...fighter, blocking: false }
}
