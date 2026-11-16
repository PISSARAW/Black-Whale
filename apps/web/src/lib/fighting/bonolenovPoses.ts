import type { BodyPlan, FightPose } from './fightPose'
import type { ArcadeFighter } from './types'
import type { MoveTimeline } from './keyPoseTimeline'

/** The preparation is performed by the body, with exposed holes and a repeatable dance. */
export function bonolenovDancePlan(fighter: ArcadeFighter, seconds: number): BodyPlan | null {
  const battle = fighter.battleCantabile
  if ((!battle?.preparation && !battle?.prologue) || fighter.attack || fighter.hitStun > 0)
    return null
  const beat = Math.sin(seconds * 9)
  const pose: FightPose = {
    chest: [0.12, beat * 0.55, beat * 0.14],
    leadShoulder: [-0.6, 0, -0.8 - beat * 0.25],
    rearShoulder: [-0.6, 0, 0.8 - beat * 0.25],
    leadHip: [-0.3 + beat * 0.25, 0, 0.1],
    rearHip: [0.2 - beat * 0.25, 0, -0.1],
    leadKnee: [0.4 - beat * 0.2, 0, 0],
    rearKnee: [0.3 + beat * 0.2, 0, 0],
  }
  return { key: 'battle-cantabile-dance', plant: true, blend: 0.08, pose }
}

export const PROLOGUE_SPEAR_POSE: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.5,
    pose: { chest: [0.1, -0.5, 0], rearShoulder: [-0.3, -0.5, 0.1], rearElbow: [-1.2, 0, 0] },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: { chest: [0.2, 0.6, 0], rearShoulder: [-1.5, 0, 0], rearElbow: [0, 0, 0] },
  },
]
