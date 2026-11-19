import type { BodyPlan, FightPose, Turn } from './fightPose'
import { fightFamily } from './fightArchetypes'
import type { ArcadeFighter } from './types'

interface LeanBudget {
  body: readonly [number, number]
  trunk: readonly [number, number]
}

/**
 * The pose system deliberately adds stance, locomotion and strike accents.
 * Keep that layering, but stop several individually plausible leans becoming
 * one implausible angle on the finished body.
 */
export const FIGHT_LEAN_BUDGETS = {
  ready: { body: [-0.12, 0.16], trunk: [-0.2, 0.26] },
  crouch: { body: [-0.16, 0.24], trunk: [-0.24, 0.36] },
  moving: { body: [-0.18, 0.22], trunk: [-0.28, 0.34] },
  attack: { body: [-0.22, 0.24], trunk: [-0.32, 0.38] },
  bruteAttack: { body: [-0.18, 0.16], trunk: [-0.26, 0.26] },
} as const satisfies Record<string, LeanBudget>

/** Leave a visible crouch without letting layered low attacks fold through the calf. */
export const ATTACK_KNEE_FLEXION_MAX = 2.35

/** Falls and hit reactions need their full authored silhouette; active fighting does not. */
export function keepFightPosture(plan: BodyPlan, fighter: ArcadeFighter): BodyPlan {
  const budget = leanBudget(fighter)
  if (!budget) return plan
  const pose = keepPosePosture(plan.pose, budget, Boolean(fighter.attack))
  const contact = plan.attackFlow?.contact
  if (pose === plan.pose && (!contact || keepPosePosture(contact, budget, true) === contact))
    return plan
  return {
    ...plan,
    pose,
    attackFlow:
      contact && plan.attackFlow
        ? { ...plan.attackFlow, contact: keepPosePosture(contact, budget, true) }
        : plan.attackFlow,
  }
}

function leanBudget(fighter: ArcadeFighter): LeanBudget | null {
  if (['hit', 'down', 'wakeup', 'ko'].includes(fighter.pose)) return null
  if (fighter.attack)
    return fighter.id === 'franklin' || fightFamily(fighter.id) === 'brute'
      ? FIGHT_LEAN_BUDGETS.bruteAttack
      : FIGHT_LEAN_BUDGETS.attack
  if (fighter.crouching) return FIGHT_LEAN_BUDGETS.crouch
  if (fighter.pose === 'walk' || fighter.pose === 'jump' || fighter.motion?.dash)
    return FIGHT_LEAN_BUDGETS.moving
  return FIGHT_LEAN_BUDGETS.ready
}

function keepPosePosture(pose: FightPose, budget: LeanBudget, limitKnees: boolean): FightPose {
  const leaned = keepLeanPosture(pose, budget)
  return limitKnees ? keepKneePosture(leaned) : leaned
}

function keepLeanPosture(pose: FightPose, budget: LeanBudget): FightPose {
  const body = pose.body ?? ZERO
  const chest = pose.chest ?? ZERO
  const bodyX = clamp(body[0], budget.body)
  const chestX = clamp(bodyX + chest[0], budget.trunk) - bodyX
  if (bodyX === body[0] && chestX === chest[0]) return pose
  return {
    ...pose,
    ...(pose.body || bodyX !== 0 ? { body: turnWithX(body, bodyX) } : {}),
    ...(pose.chest || chestX !== 0 ? { chest: turnWithX(chest, chestX) } : {}),
  }
}

function keepKneePosture(pose: FightPose): FightPose {
  const leadKnee = limitedKnee(pose.leadKnee)
  const rearKnee = limitedKnee(pose.rearKnee)
  if (leadKnee === pose.leadKnee && rearKnee === pose.rearKnee) return pose
  return {
    ...pose,
    ...(leadKnee ? { leadKnee } : {}),
    ...(rearKnee ? { rearKnee } : {}),
  }
}

function limitedKnee(turn: Turn | undefined): Turn | undefined {
  if (!turn || turn[0] <= ATTACK_KNEE_FLEXION_MAX) return turn
  return turnWithX(turn, ATTACK_KNEE_FLEXION_MAX)
}

const ZERO: Turn = [0, 0, 0]

function turnWithX(turn: Turn, x: number): Turn {
  return [x, turn[1], turn[2]]
}

function clamp(value: number, range: readonly [number, number]): number {
  return Math.min(range[1], Math.max(range[0], value))
}
