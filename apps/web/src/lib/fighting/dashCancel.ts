// movesets first: it builds every moveset at load and completes duelComboProfiles itself.
import { moveById } from './movesets'
import { cancelGrammarFor } from './duelComboProfiles'
import { accelOverheated, heatAfterAccel } from './accelCancel'
import { attackData } from './frameData'
import { canAct } from './fightActorState'
import { doubleTapDirection, motionOf } from './fighterMovement'
import { releaseFocusedAura, setIn } from './nen'
import { styleMobility } from './styleMobility'
import { CROSSING_SPEED } from './signatureCrossing'
import type { ArcadeFighter, FightInput } from './types'

/**
 * Accélération (COMBO_GRAMMAR.md § 9): on a confirmed hit, a move its grammar lists in
 * `dash` cancels into an ordinary dash by a double tap. The fighter is then free and the
 * dash can be cancelled by any attack. It heats the Ren like a relance, so a combo holds
 * at most two of them before the overheat lock. Duel tuning, not canon.
 */
export function dashCancel(fighter: ArcadeFighter, input: FightInput): ArcadeFighter | null {
  const direction = doubleTapDirection(fighter, input)
  if (direction === 0 || !dashCancelReady(fighter, direction)) return null
  const mobility = styleMobility(fighter)
  const profile = direction === fighter.facing ? mobility.forwardDash : mobility.backDash
  const released = setIn(releaseFocusedAura(fighter), false)
  return {
    ...released,
    attack: null,
    bufferedAttack: null,
    hatsuChargeFrames: 0,
    accelHeat: heatAfterAccel(fighter),
    motion: {
      ...motionOf(fighter),
      heldDirection: direction,
      tapDirection: 0,
      tapWindow: 0,
      dash: { direction, frame: 0, ...profile, accel: true, ...crossing(fighter, profile.peak) },
    },
  }
}

function dashCancelReady(fighter: ArcadeFighter, direction: -1 | 1): boolean {
  const wanted = dashDirection(fighter)
  if (!wanted || accelOverheated(fighter) || !canAct(fighter) || fighter.y > 0) return false
  if ((wanted !== 'back') !== (direction === fighter.facing)) return false
  return dashWindowOpen(fighter)
}

/** The confirmed attack is inside its cancel window; a volley fires in full before it opens. */
export function dashWindowOpen(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack
  if (!attack?.confirmedHit) return false
  const data = attackData(attack.kind, fighter)
  const start = data.startup + (moveById(attack.moveId)?.cancelWindow?.start ?? 0)
  return attack.frame >= start && attack.frame <= data.cancelEnd
}

/** The direction the current, confirmed attack may dash-cancel into, if any. */
function dashDirection(fighter: ArcadeFighter) {
  const attack = fighter.attack
  if (!attack?.confirmedHit) return undefined
  const move = moveById(attack.moveId)
  return move && cancelGrammarFor(fighter.id)?.dash?.[move.slot]
}

/** A `through` accélération crosses the other body, faster (signatureCrossing.ts). */
function crossing(fighter: ArcadeFighter, peak: number): { through?: true; peak?: number } {
  const move = moveById(fighter.attack?.moveId)
  return move && cancelGrammarFor(fighter.id)?.dash?.[move.slot] === 'through'
    ? { through: true, peak: peak * CROSSING_SPEED }
    : {}
}
