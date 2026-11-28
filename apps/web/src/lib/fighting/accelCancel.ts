import { cancelGrammarFor } from './duelComboProfiles'
import { accelTargets } from './duelComboGrammar'
import { moveById } from './movesets'
import type { FighterMove } from './movesetTypes'
import type { CancelGrammar } from './duelComboTypes'
import type { ArcadeFighter, MoveSlot } from './types'

/**
 * Relance (COMBO_GRAMMAR.md § 9, lot 1): on a confirmed hit, a grammar special may cancel
 * into a later special of the same grammar. Each relance heats the Ren; at the ceiling the
 * fighter overheats and cannot relaunch until the heat has fully drained. The relaunched
 * special may strike the body its predecessor just put down. Duel tuning, not canon.
 */
export const ACCEL_HEAT_COST = 50
export const ACCEL_HEAT_MAX = 100
/** Heat lost per simulated frame: one relance cools down in 200 frames (3.3 s). */
export const ACCEL_HEAT_DRAIN = 0.25

export interface AccelHeat {
  heat: number
  overheated: boolean
}

export function isAccelCancel(fighter: ArcadeFighter, moveId?: string): boolean {
  const grammar = cancelGrammarFor(fighter.id)
  const current = moveById(fighter.attack?.moveId)
  const target = moveById(moveId)
  if (!grammar || !current || !target || !fighter.attack?.confirmedHit) return false
  return (
    accelTargets(grammar, current.slot).includes(target.slot) ||
    superChain(grammar, current, target.id)
  )
}

/**
 * A super that cancels into its own written chain (duelComboGrammar.ts) is a relance too:
 * it heats the Ren, which bounds the loop the grammar's ender → super cancel would close.
 */
function superChain(grammar: CancelGrammar, current: FighterMove, targetId: string): boolean {
  return grammar.supers.includes(current.slot) && current.cancelInto.includes(targetId)
}

export function accelOverheated(fighter: ArcadeFighter): boolean {
  return Boolean(fighter.accelHeat?.overheated)
}

/** A relance is refused while overheated; every other cancel is untouched. */
export function accelAdmitted(fighter: ArcadeFighter, moveId: string): boolean {
  return !accelOverheated(fighter) || !isAccelCancel(fighter, moveId)
}

/** Heat after a relance actually starts. */
export function heatAfterAccel(fighter: ArcadeFighter): AccelHeat {
  const heat = Math.min(ACCEL_HEAT_MAX, (fighter.accelHeat?.heat ?? 0) + ACCEL_HEAT_COST)
  return { heat, overheated: heat >= ACCEL_HEAT_MAX }
}

/** Fields a starting attack takes when it is a relance or ends an accélération; empty otherwise. */
export function accelStart(fighter: ArcadeFighter, moveId?: string) {
  if (isAccelCancel(fighter, moveId))
    return { fighter: { accelHeat: heatAfterAccel(fighter) }, attack: { accel: true as const } }
  // The accélération already paid its heat (dashCancel.ts).
  if (!fighter.attack && fighter.motion?.dash?.accel)
    return { fighter: {}, attack: { accel: true as const } }
  // A body held by tension élastique (elasticHold.ts) stays within reach of the combo.
  if (fighter.elasticHold) return { fighter: {}, attack: { accel: true as const } }
  // A cancel out of a move that already reached the body keeps that reach to the route's end.
  if (fighter.attack?.accel) return { fighter: {}, attack: { accel: true as const } }
  return { fighter: {}, attack: {} }
}

/** Per-frame cooling; the overheat lock lifts only once the gauge is empty. */
export function coolAccelHeat(heat: AccelHeat | undefined): AccelHeat | undefined {
  if (!heat) return undefined
  const next = Math.max(0, heat.heat - ACCEL_HEAT_DRAIN)
  return next === 0 ? undefined : { heat: next, overheated: heat.overheated }
}

/** Chains a move gains when it was started out of an accélération (`CancelGrammar.accelInto`). */
export function accelChains(fighter: ArcadeFighter, move: { slot: MoveSlot }): string[] {
  if (!fighter.attack?.accel) return []
  const chains = cancelGrammarFor(fighter.id)?.accelInto?.[move.slot] ?? []
  return chains.map((slot) => `${fighter.id}:${slot}`)
}
