import { canAct } from './fightActorState'
import { gumSourceAvailable, gumSourceCommandAllowed } from './bungeeSource'
import {
  isWallReboundPosition,
  WALL_REBOUND_PEAK_FACTOR,
  WALL_REBOUND_VELOCITY_Y,
} from './characterMovementTech'
import { motionOf } from './fighterMovement'
import { styleMobility } from './styleMobility'
import type { FightSide, FightState } from './types'

/**
 * Uses the existing elastic foot and the body's ordinary dash profile, with real travel/collision.
 * With the fighter's back against the corner wall, the rubber foot rebounds diagonally out of it.
 */
export function performGumSpringStep(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  if (!canUseSpringProsthesis(state, side)) return state
  const baseDash = styleMobility({ ...actor, id: actor.nenOwner ?? actor.id }).forwardDash
  const nextActor = isWallReboundPosition(actor)
    ? applyWallRebound(actor, baseDash.peak * WALL_REBOUND_PEAK_FACTOR)
    : applyGroundSpring(actor, baseDash)
  return { ...state, [side]: nextActor }
}

function canUseSpringProsthesis(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  const rubber = actor.gumProstheses
  if (!rubber?.parts.includes('right-lower-leg')) return false
  if (!gumSourceAvailable(state, side, rubber) || !gumSourceCommandAllowed(actor, rubber))
    return false
  return springBodyReady(state, side)
}

function applyWallRebound(actor: FightState['player'], peak: number): FightState['player'] {
  return {
    ...actor,
    y: 0.2,
    velocityY: WALL_REBOUND_VELOCITY_Y,
    pose: 'jump',
    blocking: false,
    motion: { ...motionOf(actor), velocityX: actor.facing * (peak * 0.35), dash: null },
  }
}

function applyGroundSpring(
  actor: FightState['player'],
  baseDash: { frames: number; peak: number },
): FightState['player'] {
  return {
    ...actor,
    blocking: false,
    motion: {
      ...motionOf(actor),
      velocityX: 0,
      dash: { direction: actor.facing, frame: 0, ...baseDash },
    },
  }
}

function springBodyReady(state: FightState, side: FightSide): boolean {
  const actor = state[side]
  const motion = motionOf(actor)
  return (
    canAct(actor) &&
    !actor.attack &&
    !actor.hanzoProjection &&
    actor.y === 0 &&
    actor.velocityY <= 0 &&
    !motion.dash &&
    !motion.prejumpFrames &&
    !motion.landingFrames
  )
}
