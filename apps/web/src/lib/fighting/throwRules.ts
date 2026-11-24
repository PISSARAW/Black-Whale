import { canAct } from './fightActorState'
import { sleepingBody } from './hanzoProjection'
import { throwTechSeparation } from './defensiveMovementTech'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** Explicit arcade windows, not manga timings. */
export const THROW_TECH_FRAMES = 8
export const THROW_TECH_RECOVERY_FRAMES = 12
export const WAKEUP_INVULNERABLE_FRAMES = 10
export const REVERSAL_WINDOW_FRAMES = 5

/** A capture that ends an accélération (dashCancel.ts) seizes a body still in hitstun or down. */
export function throwImmune(fighter: ArcadeFighter, comboCapture?: boolean): boolean {
  const body = sleepingBody(fighter)
  if (body.y > 0 || body.health <= 0) return true
  if (comboCapture || fighter.needlePuppet?.needleEmbedded) return false
  return (
    body.hitStun > 0 ||
    body.blockStun > 0 ||
    body.knockdownFrames > 0 ||
    body.wakeupInvulnerableFrames > 0
  )
}

export function canTechThrow(fighter: ArcadeFighter): boolean {
  return !fighter.hanzoProjection && (fighter.throwTechFrames ?? 0) > 0 && canAct(fighter)
}

export function resolveThrowTech(state: FightState, side: FightSide): FightState {
  const other = side === 'player' ? 'opponent' : 'player'
  return {
    ...state,
    throwTech: { frame: state.frame, sequence: (state.throwTech?.sequence ?? 0) + 1 },
    [side]: techBody(state[side], state[other]),
    [other]: techBody(state[other], state[side]),
  }
}

function techBody(fighter: ArcadeFighter, opponent: ArcadeFighter): ArcadeFighter {
  const direction = fighter.x <= opponent.x ? -1 : 1
  const distance = throwTechSeparation(fighter)
  return {
    ...fighter,
    x: Math.max(7, Math.min(93, fighter.x + direction * distance)),
    attack: null,
    bufferedAttack: null,
    throwTechFrames: 0,
    throwTechRecoveryFrames: THROW_TECH_RECOVERY_FRAMES,
    blocking: false,
    guardFrames: 0,
    motion: undefined,
    pose: 'idle',
  }
}

export function throwTechPossible(attacker: ArcadeFighter, defender: ArcadeFighter): boolean {
  return attacker.attack?.variant === 'throw' && canTechThrow(defender)
}

export function throwMisses(
  attacker: ArcadeFighter & { attack: NonNullable<ArcadeFighter['attack']> },
  defender: ArcadeFighter,
): boolean {
  return attacker.attack.variant === 'throw' && throwImmune(defender, attacker.attack.accel)
}
