import type { MoveTimeline } from './keyPoseTimeline'
import type { ArcadeFighter } from './types'

/** Black Whale bodyguard shot: compact draw, two-hand sight picture, brief recoil. */
const BLACK_WHALE_HANDGUN: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.45,
    pose: {
      body: [-0.04, 0, 0],
      chest: [0.02, -0.12, 0],
      leadShoulder: [-1.1, 0, 0.18],
      leadElbow: [-0.75, 0, 0],
      leadWrist: [0.22, 0, 0],
      rearShoulder: [-1.45, 0, -0.12],
      rearElbow: [0.85, 0, 0],
    },
  },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: {
      body: [-0.07, 0, 0],
      chest: [0.01, -0.14, 0],
      leadShoulder: [-1.42, 0, 0.08],
      leadElbow: [0.78, 0, 0],
      leadWrist: [-0.1, 0, 0],
      rearShoulder: [-1.72, 0, -0.08],
      rearElbow: [1.12, 0, 0],
      rearWrist: [-0.1, 0, 0],
    },
  },
  {
    phase: 'recovery',
    at: 0.55,
    pose: {
      chest: [0, -0.1, 0],
      leadElbow: [-0.45, 0, 0],
      rearElbow: [-0.55, 0, 0],
    },
  },
]

export function kurapikaKeyedMove(fighter: ArcadeFighter) {
  return fighter.id === 'kurapika' && fighter.attack?.kind === 'ranged'
    ? { timeline: BLACK_WHALE_HANDGUN, authored: true as const }
    : null
}
