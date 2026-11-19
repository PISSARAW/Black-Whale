import { strikeTimeline as strike } from './keyPoseContact'
import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/** Episode 96: release confetti (0:40), fan out (0:49), gather and direct (1:01–1:40).
 * The left hand opens the sleeve; the right fan draws the whole arc before paper launches.
 */
const SCATTER: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.3,
    ease: 'out',
    pose: { rearShoulder: [-0.3, 0, -0.5], rearElbow: [-0.45, 0, 0], leadElbow: [-0.8, 0, 0] },
  },
  {
    phase: 'startup',
    at: 0.7,
    ease: 'smooth',
    pose: {
      chest: [0, 0.3, 0],
      leadShoulder: [-0.9, 0, 0.65],
      leadElbow: [-0.55, 0, 0],
      leadWrist: [0.1, 0, 0.5],
      rearShoulder: [-0.4, 0, -0.65],
      rearElbow: [-0.3, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: {
      chest: [0.015, -0.28, 0],
      leadShoulder: [-1.25, 0, 0.15],
      leadElbow: [0.12, 0, 0],
      leadWrist: [-0.1, 0, -0.65],
      rearShoulder: [-0.25, 0, -0.45],
      rearElbow: [-0.5, 0, 0],
    },
  },
  {
    phase: 'recovery',
    at: 0.45,
    ease: 'out',
    pose: { chest: [0, -0.15, 0], leadShoulder: [-0.75, 0, -0.2], leadWrist: [0, 0, -0.4] },
  },
]

const SERPENT = strike(
  {
    chest: [0, 0.35, 0],
    leadShoulder: [-1.8, 0, 0.5],
    leadElbow: [-0.65, 0, 0],
    leadWrist: [0, 0, 0.65],
    rearElbow: [-0.8, 0, 0],
  },
  {
    chest: [0.02, -0.4, 0],
    head: [0, 0.08, 0],
    leadShoulder: [-1.35, -0.15, 0.1],
    leadElbow: [0.12, 0, 0],
    leadWrist: [-0.15, 0, -0.8],
    rearElbow: [-0.9, 0, 0],
  },
  { chest: [0, -0.2, 0], leadShoulder: [-1.1, 0, 0.1], leadWrist: [0, 0, -0.45] },
)

/** Keep directing the released paper through most of recovery, then lower the fan. */
function holdPaperDirection(timeline: MoveTimeline): MoveTimeline {
  const contact = timeline.find((key) => key.phase === 'active')!
  return [
    ...timeline.filter((key) => key.phase !== 'recovery'),
    { ...contact, phase: 'recovery', at: 0.6, ease: 'smooth' },
    { ...timeline.at(-1)!, at: 0.88 },
  ]
}

const DIRECTED_SERPENT = holdPaperDirection(SERPENT)
export const KALLUTO_PAPER_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  neutralSpecial: holdPaperDirection(SCATTER),
  forwardSpecial: DIRECTED_SERPENT,
  finisher: DIRECTED_SERPENT,
  downSpecial: strike(
    { chest: [0, 0.2, 0], leadShoulder: [-0.7, 0, 0.6], leadElbow: [-0.65, 0, 0] },
    {
      chest: [0.12, -0.3, 0],
      leadShoulder: [-0.4, 0, -0.25],
      leadElbow: [0.1, 0, 0],
      leadWrist: [-0.2, 0, -0.7],
      rearElbow: [-0.8, 0, 0],
    },
    { chest: [0.04, -0.1, 0], leadShoulder: [-0.2, 0, -0.15] },
  ),
  backSpecial: strike(
    { head: [0.08, 0, 0], leadElbow: [-0.75, 0, 0], rearElbow: [-0.9, 0, 0] },
    {
      head: [0.12, 0, 0],
      leadShoulder: [-0.4, 0, 0.1],
      leadElbow: [-1, 0, 0],
      rearShoulder: [-0.55, 0, -0.15],
      rearElbow: [-1.25, 0, 0],
      rearWrist: [-0.25, 0, 0],
    },
    { head: [0.05, 0, 0], rearShoulder: [-0.3, 0, -0.1], rearElbow: [-0.75, 0, 0] },
  ),
}
