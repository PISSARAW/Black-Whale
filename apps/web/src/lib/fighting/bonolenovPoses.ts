import { bonolenovHasSpear } from './bonolenovArmedProfile'
import { bonolenovIdleBeat } from './bonolenovDanceFootwork'
import { fightStance } from './fightStance'
import { motionOf } from './fighterMovement'
import { movementTechPose } from './movementTechPoses'
import { addPoses, lerpPose, type BodyPlan, type FightPose } from './fightPose'
import type { ArcadeFighter } from './types'
import { battleBodyAvailable, battleMindAvailable } from './battleCantabileRules'
import { freeCombatBody } from './fightActorState'
import { PROLOGUE_CARRY_POSE } from './keyPosesBonolenov'
import { bonolenovStepPlan } from './bonolenovLocomotion'

export { armedCarryPlan } from './bonolenovArmedNormals'
export { PROLOGUE_SPEAR_POSE } from './keyPosesBonolenov'

/** Alternating one-foot balances and open arms: reference video 1:12–1:42. */
const DANCE: readonly FightPose[] = [
  {
    chest: [0.04, -0.2, 0],
    leadShoulder: [-0.35, 0, 0.75],
    rearShoulder: [-0.2, 0, -0.8],
    leadElbow: [-0.3, 0, 0],
    rearElbow: [-0.25, 0, 0],
    leadHip: [-0.12, 0, 0.06],
    leadKnee: [0.18, 0, 0],
    rearHip: [0.06, 0, -0.06],
    rearKnee: [0.12, 0, 0],
  },
  {
    chest: [0.08, -0.3, -0.08],
    head: [-0.06, 0, 0],
    leadShoulder: [-1.25, 0, 0.8],
    rearShoulder: [-0.55, 0, -1.05],
    leadElbow: [-0.4, 0, 0],
    rearElbow: [-0.35, 0, 0],
    leadHip: [-1.05, 0, 0.22],
    leadKnee: [1.75, 0, 0],
    rearHip: [-0.08, 0, -0.04],
    rearKnee: [0.12, 0, 0],
  },
  {
    chest: [0.05, 0.2, 0.06],
    head: [-0.03, 0, 0],
    leadShoulder: [-0.5, 0, 1],
    rearShoulder: [-0.9, 0, -0.9],
    leadElbow: [-0.2, 0, 0],
    rearElbow: [-0.45, 0, 0],
    leadHip: [-0.12, 0, 0.06],
    leadKnee: [0.18, 0, 0],
    rearHip: [0.08, 0, -0.06],
    rearKnee: [0.12, 0, 0],
  },
  {
    chest: [0.07, 0.3, 0.08],
    head: [-0.05, 0, 0],
    leadShoulder: [-0.55, 0, 1.05],
    rearShoulder: [-1.25, 0, -0.8],
    leadElbow: [-0.35, 0, 0],
    rearElbow: [-0.4, 0, 0],
    leadHip: [-0.08, 0, 0.04],
    leadKnee: [0.12, 0, 0],
    rearHip: [-1.05, 0, -0.22],
    rearKnee: [1.75, 0, 0],
  },
]

/** Only real preparation advances the choreography; pause and hitstop cannot advance it. */
export function bonolenovDancePlan(fighter: ArcadeFighter): BodyPlan | null {
  const preparation = fighter.battleCantabile?.preparation
  if (!preparation || !danceBodyReady(fighter)) return null
  const progress = Math.max(0, Math.min(1, 1 - preparation.remaining / preparation.total))
  const phase = progress * DANCE.length
  const index = Math.floor(phase) % DANCE.length
  const amount = phase - Math.floor(phase)
  const pose = lerpPose(
    DANCE[index],
    DANCE[(index + 1) % DANCE.length],
    amount * amount * (3 - 2 * amount),
  )
  // A complete turn and a counter-turn resolve at the initial orientation.
  // Turning the whole body avoids twisting the lumbar spine through 360 degrees.
  pose.body = [0.025, Math.PI * (1 - Math.cos(progress * Math.PI * 2)), 0]
  return { key: 'battle-cantabile-dance', plant: true, blend: 0.06, pose }
}

export function bonolenovBodyPlan(fighter: ArcadeFighter, seconds: number): BodyPlan | null {
  const dance = bonolenovDancePlan(fighter)
  if (dance) return dance
  if (!danceBodyReady(fighter)) return null
  const step = bonolenovStepPlan(fighter)
  if (step) return step
  if (fighter.pose !== 'idle' || fighter.crouching) return null
  if (bonolenovHasSpear(fighter))
    return { key: 'bonolenov:prologue-ready', plant: true, blend: 0.1, pose: PROLOGUE_CARRY_POSE }
  const motion = motionOf(fighter)
  const standing = fightStance('bonolenov')!.pose
  if (motion.prejumpFrames || motion.landingFrames || movementTechPose(fighter, standing))
    return null
  return {
    key: 'bonolenov:unarmed-rhythm',
    plant: true,
    blend: 0.1,
    pose: addPoses(standing, bonolenovIdleBeat(seconds)),
  }
}

function danceBodyReady(fighter: ArcadeFighter): boolean {
  return (
    battleBodyAvailable(fighter) &&
    freeCombatBody(fighter) &&
    battleMindAvailable(fighter) &&
    !fighter.attack &&
    !fighter.blocking &&
    fighter.y === 0
  )
}
