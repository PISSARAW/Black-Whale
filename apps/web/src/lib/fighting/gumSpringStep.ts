import { canAct } from './fightActorState'
import { gumSourceAvailable, gumSourceCommandAllowed } from './bungeeSource'
import { motionOf } from './fighterMovement'
import { styleMobility } from './styleMobility'
import type { FightSide, FightState } from './types'

/** Uses the existing elastic foot and the body's ordinary dash profile, with real travel/collision. */
export function performGumSpringStep(state: FightState, side: FightSide): FightState {
  const actor = state[side]
  const rubber = actor.gumProstheses
  if (!rubber?.parts.includes('right-lower-leg')) return state
  if (!gumSourceAvailable(state, side, rubber) || !gumSourceCommandAllowed(actor, rubber))
    return state
  if (!springBodyReady(state, side)) return state
  return {
    ...state,
    [side]: {
      ...actor,
      blocking: false,
      motion: {
        ...motionOf(actor),
        velocityX: 0,
        dash: {
          direction: actor.facing,
          frame: 0,
          ...styleMobility({ ...actor, id: actor.nenOwner ?? actor.id }).forwardDash,
        },
      },
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
