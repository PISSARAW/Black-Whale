import { preparedNenDestinations } from './nenPreparedBranches'
import { openingDestinations } from './comboOpenings'
import { attackData, attackPhase, attackTotal } from './frameData'
import { walkSpeed } from './fighterMovement'
import { styleReactionFrames } from './styleMobility'
import { seesCombatBody } from './fightCounterplay'
import { canAct } from './fightActorState'
import { canUseMovesetMove, moveById, movesetFor } from './movesets'
import type { ArcadeFighter, FightSide, FightState } from './types'

/** A confirmed string may still cancel during recovery: that is pressure, not a guaranteed opening. */
export function hasRecoveryCancel(fighter: ArcadeFighter): boolean {
  const attack = fighter.attack,
    move = moveById(attack?.moveId)
  if (!attack || !move || attack.frame > attackData(attack.kind, fighter).cancelEnd) return false
  return Boolean(
    (attack.confirmedHit && hasHitContinuation(fighter)) ||
    (attack.confirmedBlock && move.cancelOnBlockInto.length),
  )
}
export function recoveryPunishOptions(state: FightState, side: FightSide) {
  const fighter = state[side],
    target = state[side === 'player' ? 'opponent' : 'player']
  if (!readableRecovery(fighter, target)) return []
  const attack = target.attack!
  const frames = attackTotal(attackData(attack.kind, target)) - attack.frame
  const gap = Math.abs(target.x - fighter.x)
  const observed = Math.max(fighter.recoveryWatch?.frames ?? 0, fighter.pressureRead?.seen ?? 0)
  const reaction = Math.max(0, styleReactionFrames(fighter) - observed)
  return (movesetFor(fighter.id)?.moves ?? [])
    .flatMap((move) => {
      if (!['normal', 'command'].includes(move.category) || move.variant === 'air') return []
      if (!canUseMovesetMove(state, side, move)) return []
      const reach = move.tuning.reach + Math.max(0, move.tuning.lunge)
      const approachFrames = Math.ceil(
        Math.max(0, gap - reach) / Math.max(0.01, walkSpeed(fighter) / 60),
      )
      const arrival = approachFrames + move.tuning.startup + reaction
      const margin = frames - arrival
      return margin >= 0 ? [{ move, approachFrames, arrival, margin, frames, reaction }] : []
    })
    .sort(
      (a, b) =>
        a.approachFrames - b.approachFrames ||
        b.move.tuning.damage - a.move.tuning.damage ||
        b.margin - a.margin,
    )
}
function readableRecovery(fighter: ArcadeFighter, target: ArcadeFighter): boolean {
  return (
    seesCombatBody(fighter) &&
    canAct(fighter) &&
    !fighter.attack &&
    fighter.y === 0 &&
    target.y === 0 &&
    attackPhase(target) === 'recovery' &&
    !hasRecoveryCancel(target)
  )
}

function hasHitContinuation(fighter: ArcadeFighter): boolean {
  return Boolean(
    moveById(fighter.attack?.moveId)?.cancelInto.length ||
    preparedNenDestinations(fighter).length ||
    openingDestinations(fighter).length,
  )
}
