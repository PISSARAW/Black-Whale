import { projectionPreparing, sleepingBody } from './hanzoProjection'
import { FIXED_STEP } from './frameData'
import { fightingStyle, shouldStyleGuard, styleMovement } from './fightStyles'
import { fighterDefinition } from './roster'
import type { ArcadeFighter } from './types'

const MIN_X = 7
const MAX_X = 93

export function moveOpponent(fighter: ArcadeFighter, player: ArcadeFighter): ArcadeFighter {
  if (projectionPreparing(fighter)) return fighter
  const target = opponentTarget(fighter, player)
  const gap = Math.abs(target.x - fighter.x)
  const blocking = opponentBlocking(fighter, player, gap)
  const releasedGuard = fighter.blocking && !blocking
  const next = {
    ...fighter,
    blocking,
    guardFrames: blocking ? (fighter.blocking ? fighter.guardFrames + 1 : 1) : 0,
    ryuWindow: releasedGuard ? 10 : fighter.ryuWindow,
  }
  if (!canMove(next) || blocking) return next
  const direction = target.x < next.x ? -1 : 1
  const motion = opponentMotion(next, gap)
  const speed = fighterDefinition(next.id).speed * fightingStyle(next.id).moveScale * 20
  return {
    ...next,
    x: clamp(next.x + direction * motion * speed * FIXED_STEP, MIN_X, MAX_X),
    pose: motion === 0 ? 'idle' : 'walk',
  }
}

function shouldBlock(fighter: ArcadeFighter, player: ArcadeFighter, gap: number): boolean {
  const threatened = player.pose === 'heavy' || player.pose === 'special'
  return shouldStyleGuard(fighter.id, { gap, threatened }) && canMove(fighter) && fighter.y === 0
}

function canMove(fighter: ArcadeFighter): boolean {
  return (
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    fighter.health > 0 &&
    fighter.attack === null
  )
}

function clamp(value: number, minimum: number, maximum: number): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function returningToBody(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.hanzoProjection) && fighter.aura < 16
}

function opponentBlocking(fighter: ArcadeFighter, player: ArcadeFighter, gap: number): boolean {
  if (fighter.hanzoProjection) return false
  return fighter.blockStun > 0 || shouldBlock(fighter, player, gap)
}

function opponentTarget(fighter: ArcadeFighter, player: ArcadeFighter): ArcadeFighter {
  return returningToBody(fighter) ? sleepingBody(fighter) : player
}

function opponentMotion(fighter: ArcadeFighter, gap: number): number {
  return returningToBody(fighter) ? 1 : styleMovement(fighter.id, { gap, health: fighter.health })
}
