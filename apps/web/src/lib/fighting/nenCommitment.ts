import { attackData, attackPhase, attackTotal } from './frameData'
import { seesCombatBody } from './fightCounterplay'
import { gyoSight } from './nenPerception'
import { addPoses, scalePose, type BodyPlan } from './fightPose'
import type { ArcadeFighter, FightSide, FightState, MoveSlot } from './types'
import { moveForSlot } from './movesets'
import type { ArsenalAiContext } from './arsenalAiTypes'

/** Body recovery is public; concealed aura distributions need the ordinary Gyo observation. */
export function readNenCommitment(state: FightState, side: FightSide, viewer: FightSide) {
  const fighter = state[side]
  if (!seesCombatBody(state[viewer])) return null
  const phase = attackPhase(fighter)
  if (phase === 'recovery' && fighter.attack) {
    const frames = attackTotal(attackData(fighter.attack.kind, fighter)) - fighter.attack.frame
    return { kind: 'recovery' as const, frames, zones: [] }
  }
  if (side !== viewer && fighter.nen.in && !gyoSight(state[viewer])) return null
  const transfer = fighter.nenTransfer
  if (!transfer) return null
  const zones = Object.entries(fighter.nen.ryu)
    .filter(([, share]) => Number(share) < 0.15)
    .map(([zone]) => zone)
  return { kind: 'transfer' as const, frames: Math.max(0, transfer.duration - transfer.age), zones }
}

/** Rank only already proposed moves; a visible opening grants no automatic hit or invulnerability. */
export function prioritiseCommitmentPunish(context: ArsenalAiContext, slots: readonly MoveSlot[]) {
  const cue = readNenCommitment(context.state, 'player', 'opponent')
  if (cue?.kind !== 'recovery') return slots
  const scored = slots.map((slot, index) => {
    const move = moveForSlot(context.state.opponent.id, slot)
    const fits = move && move.tuning.startup <= cue.frames && move.tuning.reach >= context.gap
    return { slot, index, score: fits ? move.tuning.damage : 0 }
  })
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map(({ slot }) => slot)
}

/** Small preparation/recovery accents on the authored pose. Contact poses and root separation stay exact. */
export function withNenCommitment(plan: BodyPlan | null, fighter: ArcadeFighter): BodyPlan | null {
  if (!plan || !canAccent(fighter)) return plan
  if (fighter.nenTransfer && !fighter.attack)
    return {
      ...plan,
      pose: addPoses(plan.pose, {
        chest: [0.035, 0, 0],
        leadElbow: [-0.08, 0, 0],
        rearElbow: [-0.06, 0, 0],
      }),
    }
  if (!fighter.attack || attackPhase(fighter) !== 'recovery') return plan
  const data = attackData(fighter.attack.kind, fighter)
  const remaining =
    Math.max(0, attackTotal(data) - fighter.attack.frame) / Math.max(1, data.recovery)
  const spent = fighter.attack.auraCharged || fighter.attack.hatsuSource
  if (!spent) return plan
  return {
    ...plan,
    pose: addPoses(
      plan.pose,
      scalePose(
        { chest: [0.06, 0, 0], leadShoulder: [0.1, 0, 0.04], rearKnee: [0.05, 0, 0] },
        Math.sin(remaining * Math.PI),
      ),
    ),
  }
}

function canAccent(fighter: ArcadeFighter): boolean {
  return !fighter.hitStun && !fighter.knockdownFrames && fighter.health > 0
}
