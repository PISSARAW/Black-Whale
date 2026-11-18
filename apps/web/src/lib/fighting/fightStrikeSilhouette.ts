import { addPoses, scalePose, type FightPose } from './fightPose'
import { rosterMoveShape, rosterMotionStyle } from './rosterStrikeMotion'
import type { PhaseFrames } from './keyPoseTimeline'
import type { ArcadeFighter } from './types'

/** Distinct load, contact and braking silhouettes, expressed in the character's own choreography. */
export function strikeSilhouette(
  fighter: ArcadeFighter,
  timing: { frame: number; frames: PhaseFrames },
): FightPose {
  const attack = fighter.attack
  if (!attack || fighter.y > 0 || attack.variant === 'throw') return {}
  const shape = rosterMoveShape(attack.moveId),
    style = rosterMotionStyle(fighter.id)
  if (!shape || !style) return {}
  const { frame, frames } = timing
  const p = Math.min(1, Math.max(0, frame / Math.max(1, frames.startup)))
  const r = Math.min(
    1,
    Math.max(0, (frame - frames.startup - frames.active) / Math.max(1, frames.recovery)),
  )
  const weight = (attack.kind === 'heavy' ? 0.9 : 0.45) * style.amplitude
  const load = Math.sin(Math.PI * p) ** 2
  const drive = p * p * (3 - 2 * p) * (1 - r * r * (3 - 2 * r))
  return addPoses(
    scalePose(style.load, load * weight * 0.22),
    scalePose(shapeAccent(shape), drive * weight),
    scalePose(style.release, Math.sin(Math.PI * r) * weight * 0.35),
  )
}

function shapeAccent(shape: string): FightPose {
  if (['hook', 'cross', 'backhand', 'slash', 'spin'].includes(shape))
    return {
      chest: [0, -0.14, 0.04],
      body: [0, -0.04, 0],
      leadElbow: [-0.08, 0, 0],
      rearKnee: [0.14, 0, 0],
    }
  if (['kick', 'lowKick', 'sweep', 'dive'].includes(shape))
    return {
      chest: [-0.08, 0.08, 0],
      rearShoulder: [-0.12, 0, -0.12],
      leadShoulder: [-0.1, 0, 0.12],
    }
  if (shape === 'uppercut')
    return {
      chest: [-0.06, -0.06, 0],
      leadHip: [-0.12, 0, 0],
      leadKnee: [0.2, 0, 0],
      rearElbow: [-0.18, 0, 0],
    }
  if (shape === 'hammer' || shape === 'charge')
    return { chest: [0.09, -0.08, 0], leadKnee: [0.18, 0, 0], rearKnee: [0.16, 0, 0] }
  return { chest: [0.03, -0.07, 0], rearElbow: [-0.18, 0, 0], leadKnee: [0.1, 0, 0] }
}
