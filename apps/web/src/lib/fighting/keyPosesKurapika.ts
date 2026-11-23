import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'
import { strikeTimeline } from './keyPoseContact'

/**
 * Kurapika's normals as key poses, added to his stance (or his crouch, or his
 * air tuck). Short, exact motions: the chain hand does the work and the body
 * turns just enough to put the shoulder behind it.
 */
export const KURAPIKA_KEY_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  forwardSpecial: strikeTimeline(
    {
      root: [0, -0.02, -0.025],
      body: [-0.04, 0.12, 0],
      chest: [0.04, 0.32, 0],
      leadShoulder: [-0.15, 0, -0.35],
      leadElbow: [-0.55, 0, 0],
      leadWrist: [-0.35, 0, 0],
      rearKnee: [0.22, 0, 0],
    },
    {
      root: [0, 0, 0.09],
      body: [0.12, -0.12, 0],
      chest: [0.04, -0.48, 0],
      leadShoulder: [-1.08, 0, 0.2],
      leadElbow: [1.2, 0, 0],
      leadWrist: [0.22, 0, 0],
      rearShoulder: [-0.05, 0, -0.12],
      rearElbow: [-0.2, 0, 0],
      rearHip: [0.18, 0, 0],
      leadKnee: [0.1, 0, 0],
    },
    {
      root: [0, -0.01, 0.035],
      chest: [0.03, -0.28, 0],
      leadShoulder: [-0.65, 0, 0.12],
      leadElbow: [0.55, 0, 0],
      leadWrist: [0.08, 0, 0],
      rearKnee: [0.14, 0, 0],
    },
  ),
  // Dowsing Jab: a straight lead hand, chest turned into it.
  standingLight: [
    {
      phase: 'startup',
      at: 0.6,
      ease: 'out',
      pose: { chest: [0, 0.1, 0], leadShoulder: [0.15, 0, 0], leadElbow: [-0.3, 0, 0] },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        root: [0, 0, 0.06],
        body: [0.06, 0, 0],
        chest: [0.04, -0.3, 0],
        leadShoulder: [-0.8, 0, -0.1],
        leadElbow: [1.4, 0, 0],
        leadWrist: [-0.2, 0, 0],
        rearElbow: [-0.1, 0, 0],
      },
    },
    {
      phase: 'recovery',
      at: 0.3,
      ease: 'out',
      pose: { chest: [0, -0.15, 0], leadShoulder: [-0.5, 0, 0], leadElbow: [0.8, 0, 0] },
    },
  ],
  // Low Dowsing Chain: a jab skimming the floor from the crouch.
  lowLight: [
    {
      phase: 'startup',
      at: 0.6,
      ease: 'out',
      pose: { chest: [0, 0.12, 0], leadElbow: [-0.3, 0, 0] },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        body: [0.12, 0, 0],
        chest: [0.1, -0.3, 0],
        leadShoulder: [-0.45, 0, -0.1],
        leadElbow: [1.35, 0, 0],
        leadWrist: [0.3, 0, 0],
      },
    },
  ],
  // Dowsing Sweep: the lead leg scythes along the floor, chest spun into it.
  lowHeavy: [
    {
      phase: 'startup',
      at: 0.65,
      ease: 'out',
      pose: { chest: [0, 0.4, 0], leadHip: [0.3, 0, 0], leadKnee: [0.2, 0, 0] },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        body: [0.15, 0, 0],
        chest: [0.1, -0.7, 0],
        leadHip: [-0.15, 0, 0.35],
        leadKnee: [-1.85, 0, 0],
        rearKnee: [0.15, 0, 0],
        rearShoulder: [0.4, 0, -0.3],
      },
    },
    {
      phase: 'recovery',
      at: 0.45,
      ease: 'out',
      pose: { chest: [0, -0.35, 0], leadKnee: [-0.9, 0, 0] },
    },
  ],
  // Aerial Dowsing Point: a downward jab from the jump.
  airLight: [
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        body: [0.2, 0, 0],
        chest: [0.1, -0.25, 0],
        leadShoulder: [-0.4, 0, 0],
        leadElbow: [1.4, 0, 0],
        leadWrist: [0.35, 0, 0],
      },
    },
  ],
  // Dowsing Dive: the lead leg drives down at an angle, arms swept back.
  airHeavy: [
    {
      phase: 'startup',
      at: 0.6,
      ease: 'out',
      pose: { body: [-0.1, 0, 0], leadHip: [-0.4, 0, 0], leadKnee: [0.6, 0, 0] },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        body: [0.35, 0, 0],
        chest: [0, -0.3, 0],
        leadHip: [-0.5, 0, 0],
        leadKnee: [-1.25, 0, 0],
        leadShoulder: [0.7, 0, 0.3],
        rearShoulder: [0.5, 0, -0.3],
        leadElbow: [1, 0, 0],
      },
    },
  ],
}
