import { ALTERNATE_SIGNATURE_MOVES } from './alternateSignatureMoves'
import { ALTERNATE_SIGNATURE_CHOREOGRAPHY } from './alternateSignatureChoreography'
import { GESTURE_POSES } from './alternateSignatureGesturePoses'
import { signatureOpeningId, signatureTransitionId } from './alternateSignatureAttacks'
import { strikeTimeline } from './keyPoseContact'
import { keyFrameOf, sampleTimeline, type MoveTimeline } from './keyPoseTimeline'
import { lerpPose } from './fightPose'
import { personalSignaturePose } from './personalSignaturePoses'
import type { ArcadeFighter } from './types'

const poses = {
  standingHeavy: strikeTimeline(
    { body: [-0.13, 0.28, 0], rearElbow: [-1.35, 0, 0], rearKnee: [0.25, 0, 0] },
    { body: [0.23, -0.35, 0], rearShoulder: [-1.35, 0, -0.2], rearElbow: [-0.62, 0, 0] },
    { body: [0.12, -0.16, 0], rearShoulder: [-0.65, 0, 0], rearElbow: [-0.95, 0, 0] },
  ),
  backHeavy: strikeTimeline(
    { chest: [0, -0.35, 0.12], leadShoulder: [-0.55, 0, -0.3], leadElbow: [-1.65, 0, 0] },
    { chest: [0.08, 0.46, -0.14], leadShoulder: [-1.22, 0, 0.47], leadElbow: [-0.28, 0, 0] },
    { chest: [0, 0.17, 0], leadShoulder: [-0.62, 0, 0.26], leadElbow: [-0.94, 0, 0] },
  ),
  forwardHeavy: strikeTimeline(
    { body: [-0.16, 0.17, 0], rearHip: [0.17, 0, 0], rearKnee: [0.58, 0, 0] },
    {
      body: [0.23, -0.32, 0],
      rearHip: [-0.91, 0, 0],
      rearKnee: [1.1, 0, 0],
      rearShoulder: [-0.48, 0, 0],
    },
    { body: [0.06, -0.12, 0], rearHip: [-0.37, 0, 0], rearKnee: [0.65, 0, 0] },
  ),
  lowHeavy: strikeTimeline(
    { body: [0.22, 0.21, 0], leadKnee: [0.42, 0, 0], rearKnee: [0.35, 0, 0] },
    {
      body: [0.14, -0.39, -0.12],
      leadHip: [-0.47, -0.29, 0.17],
      leadKnee: [0.13, 0, 0],
      leadFoot: [0.28, 0, 0],
    },
    { body: [0.19, -0.14, 0], leadHip: [-0.22, 0, 0], leadKnee: [0.38, 0, 0] },
  ),
} as const

// Sample the character's authored motion at matching phases to keep their own
// stance, limb work and equipment posture in the new strike.
const phaseFrames = { startup: 10, active: 4, recovery: 18 }

export function alternateSignaturePose(
  fighter: ArcadeFighter,
  native: MoveTimeline,
): MoveTimeline | null {
  const personal = personalSignaturePose(fighter)
  if (personal) return personal
  const timeline = signatureTimeline(fighter)
  if (!timeline) return null
  return timeline.map((key) => {
    const original = sampleTimeline(native, {
      frame: keyFrameOf(key, phaseFrames),
      frames: phaseFrames,
      continuous: true,
    })
    return { ...key, pose: lerpPose(key.pose, original, 0.3) }
  })
}

function signatureTimeline(fighter: ArcadeFighter): MoveTimeline | null {
  const move = ALTERNATE_SIGNATURE_MOVES[fighter.id]
  const choreography = ALTERNATE_SIGNATURE_CHOREOGRAPHY[fighter.id]
  const id = fighter.attack?.moveId
  if (!move || !choreography || !id) return null
  const finisher = `${fighter.id}:${move.id}`
  if (id === finisher) return poses[move.base]
  const opening = GESTURE_POSES[choreography[0][0]]
  if (id === signatureOpeningId(finisher)) return opening
  if (id !== signatureTransitionId(finisher)) return null
  // Carry the preceding strike's contact pose into the next wind-up on the cancel frame.
  return [{ phase: 'startup', at: 0, pose: opening[1].pose }, ...GESTURE_POSES[choreography[1][0]]]
}
