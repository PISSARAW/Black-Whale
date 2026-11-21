import { attackPhase } from './frameData'
import { BENJAMIN_BURST_SHOTS } from './benjaminWeapon'
import type { ArcadeFighter, AttackKind, FightSide, FightState } from './types'

/**
 * Culdcept hold (Commandement absolu, signatureCombosBookArmy.ts): the Aura Rectangle opened
 * out of a combo capture (throwRules.ts) keeps the captured body held while it charges, and
 * once it is active the machine-gun burst may be fired out of it. The burst stays a real
 * weapon: the rectangle never captures it. Duel tuning, not canon.
 */
const RECTANGLE = 'benjamin:downSpecial'

/** The rectangle is part of a combo route: it followed a capture that already held the body. */
function comboRectangle(fighter: ArcadeFighter): boolean {
  return fighter.attack?.moveId === RECTANGLE && Boolean(fighter.attack.accel)
}

/** The burst may cancel the rectangle of a combo route once that rectangle is active. */
export function culdceptBurstCancel(fighter: ArcadeFighter): boolean {
  return comboRectangle(fighter) && attackPhase(fighter) === 'active'
}

/** Rectangle into burst, then burst into Play Card, inside a combo route only. */
export function culdceptComboCancel(
  fighter: ArcadeFighter,
  kind: AttackKind,
  moveId?: string,
): boolean {
  return (kind === 'ranged' && culdceptBurstCancel(fighter)) || culdceptCardCancel(fighter, moveId)
}

/** Per frame: the captured body's hitstun and knockdown do not run out under the rectangle. */
export function advanceCuldceptHold(state: FightState, side: FightSide): FightState {
  const targetSide = side === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  if (!comboRectangle(state[side]) || target.comboHits === 0) return state
  if (target.hitStun === 0 && target.knockdownFrames === 0) return state
  return {
    ...state,
    [targetSide]: {
      ...target,
      hitStun: target.hitStun > 0 ? target.hitStun + 1 : 0,
      knockdownFrames: target.knockdownFrames > 0 ? target.knockdownFrames + 1 : 0,
    },
  }
}

/** Height above the shooter's feet of a shot aimed at a body lying on the ground. */
export const HELD_BODY_AIM = 2.5

/** A shot that continues a combo route aims down at the held body; otherwise unchanged. */
export function comboShotHeight(state: FightState, side: FightSide, height: number): number {
  const shooter = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  return shooter.attack?.accel && target.knockdownFrames > 0 ? shooter.y + HELD_BODY_AIM : height
}

/** Once the burst of a combo route has fired every shot, it cancels into Play Card. */
export function culdceptCardCancel(fighter: ArcadeFighter, moveId?: string): boolean {
  const attack = fighter.attack
  if (moveId !== 'benjamin:finisher' || attack?.kind !== 'ranged' || !attack.accel) return false
  return (attack.projectilesSpawned ?? 0) >= BENJAMIN_BURST_SHOTS
}
