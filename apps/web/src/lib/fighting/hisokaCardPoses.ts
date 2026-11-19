import type { KeyedMove } from './keyPoseMoves'
import type { MoveTimeline } from './keyPoseTimeline'
import type { ArcadeFighter } from './types'

/** A physical card leaves a wrist flick, distinct from the open palm that attaches Gum. */
const CARD_THROW: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.65,
    ease: 'out',
    pose: {
      chest: [0, 0.22, 0],
      leadShoulder: [-1.15, 0, -0.22],
      leadElbow: [-1.3, 0, 0],
      leadWrist: [-0.5, 0, 0.15],
      rearShoulder: [0.08, 0, -0.12],
    },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: {
      chest: [0, -0.28, 0],
      leadShoulder: [-1.25, 0, 0.15],
      leadElbow: [0.65, 0, 0],
      leadWrist: [0.65, 0, -0.15],
      rearShoulder: [0.08, 0, -0.12],
    },
  },
  {
    phase: 'recovery',
    at: 0.35,
    ease: 'out',
    pose: {
      chest: [0, -0.12, 0],
      leadShoulder: [-0.8, 0, 0.25],
      leadElbow: [-0.1, 0, 0],
      leadWrist: [0.2, 0, 0],
    },
  },
]

export function hisokaKeyedMove(fighter: ArcadeFighter): KeyedMove | null {
  return fighter.id === 'hisoka' && fighter.attack?.kind === 'ranged'
    ? { timeline: CARD_THROW, authored: true }
    : null
}
