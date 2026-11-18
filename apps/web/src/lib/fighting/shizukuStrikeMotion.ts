import { attackData } from './frameData'
import { sampleTimeline, type MoveTimeline } from './keyPoseTimeline'
import { strikeTimeline } from './keyPoseContact'
import type { ArcadeFighter, MoveSlot } from './types'

/** Both hands gather the tool, the hips drive it, then the knees brake its weight. */
const HAMMER = strikeTimeline(
  {
    root: [0, -0.035, -0.04],
    body: [-0.1, 0.12, 0],
    chest: [-0.08, 0.35, 0],
    leadShoulder: [-1.35, 0.08, -0.12],
    leadElbow: [-0.75, 0, 0],
    rearShoulder: [-1.3, -0.15, 0.35],
    rearElbow: [-0.65, 0, 0],
    leadKnee: [0.2, 0, 0],
    rearKnee: [0.3, 0, 0],
  },
  {
    root: [0, -0.025, 0.075],
    body: [0.24, -0.12, 0],
    chest: [0.15, -0.35, 0],
    leadShoulder: [-0.95, 0, 0.03],
    leadElbow: [0.45, 0, 0],
    rearShoulder: [-1, -0.08, 0.2],
    rearElbow: [0.3, 0, 0],
    leadKnee: [0.3, 0, 0],
    rearHip: [0.16, 0, 0],
  },
  {
    root: [0, -0.055, 0.035],
    body: [0.17, 0, 0],
    chest: [0.1, -0.18, 0],
    leadShoulder: [-0.35, 0, 0.03],
    leadElbow: [-0.1, 0, 0],
    rearShoulder: [-0.4, 0, 0.12],
    rearElbow: [-0.1, 0, 0],
    leadKnee: [0.28, 0, 0],
    rearKnee: [0.2, 0, 0],
  },
)

export const SHIZUKU_STRIKE_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  standingHeavy: HAMMER,
  forwardSpecial: HAMMER,
}

const TOOL_ARC: MoveTimeline = [
  { phase: 'startup', at: 0.65, pose: { body: [0.85, 0, -0.08] }, ease: 'out' },
  { phase: 'active', at: 0, pose: { body: [-0.9, 0, 0.08] }, ease: 'snap' },
  { phase: 'active', at: 1, pose: { body: [-0.9, 0, 0.08] } },
  { phase: 'recovery', at: 0.3, pose: { body: [-1.15, 0, 0.04] }, ease: 'out' },
  { phase: 'recovery', at: 0.8, pose: { body: [-0.15, 0, 0] }, ease: 'smooth' },
]

/** An angle in the fighter's space, sampled by the simulation clock, including hitstop. */
export function blinkyStrikeArc(fighter: ArcadeFighter) {
  if (
    !fighter.attack ||
    !['shizuku:standingHeavy', 'shizuku:forwardSpecial'].includes(fighter.attack.moveId ?? '')
  )
    return null
  return sampleTimeline(TOOL_ARC, {
    frame: fighter.attack.frame,
    frames: attackData(fighter.attack.kind, fighter),
    continuous: true,
  }).body!
}
