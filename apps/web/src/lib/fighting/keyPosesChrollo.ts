import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

const HANDLE_BOOK: MoveTimeline = [
  {
    phase: 'startup',
    at: 0.5,
    // Offsets from Chrollo's already folded book stance, not absolute elbow targets.
    pose: { head: [0.25, 0, 0], leadElbow: [-0.35, 0, 0], rearElbow: [-0.5, 0, 0] },
  },
  {
    phase: 'active',
    at: 0,
    pose: { head: [0.18, 0, 0], leadElbow: [-0.28, 0, 0], rearWrist: [0, 0, -0.4] },
  },
  { phase: 'recovery', at: 0.6, pose: {} },
]
const LEFT_STAMP: MoveTimeline = [
  { phase: 'startup', at: 0.7, pose: { chest: [0, 0.2, 0], rearElbow: [-1.2, 0, 0] } },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: { chest: [0.08, -0.25, 0], rearShoulder: [-1.4, 0, 0], rearElbow: [-0.1, 0, 0] },
  },
  { phase: 'recovery', at: 0.65, pose: { rearElbow: [-0.5, 0, 0] } },
]
const RIGHT_STAMP: MoveTimeline = [
  { phase: 'startup', at: 0.7, pose: { chest: [0, -0.2, 0], leadElbow: [-1.2, 0, 0] } },
  {
    phase: 'active',
    at: 0,
    ease: 'snap',
    pose: { chest: [0.08, 0.25, 0], leadShoulder: [-1.4, 0, 0], leadElbow: [-0.1, 0, 0] },
  },
  { phase: 'recovery', at: 0.65, pose: { leadElbow: [-0.5, 0, 0] } },
]

export const CHROLLO_KEY_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  neutralSpecial: LEFT_STAMP,
  forwardSpecial: RIGHT_STAMP,
  backSpecial: HANDLE_BOOK,
  downSpecial: HANDLE_BOOK,
  finisher: RIGHT_STAMP,
}
