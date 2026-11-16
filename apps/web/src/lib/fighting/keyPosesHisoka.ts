import type { MoveTimeline } from './keyPoseTimeline'
import type { MoveSlot } from './types'

/**
 * Hisoka's normals as key poses, added to his stance (or his crouch, or his
 * air tuck). Wide, unhurried windups that release all at once: the card hand
 * sweeps, the long legs whip, and the body leans away from its own kicks.
 */
export const HISOKA_KEY_POSES: Partial<Record<MoveSlot, MoveTimeline>> = {
  // Card Slash: drawn across the chest, released in a flat arc.
  standingLight: [
    {
      phase: 'startup',
      at: 0.6,
      ease: 'out',
      pose: {
        chest: [0, 0.3, 0],
        leadShoulder: [-0.5, 0, -0.7],
        leadElbow: [-0.9, 0, 0],
        leadWrist: [-0.4, 0, 0],
      },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        root: [0, 0, 0.05],
        body: [0.05, 0, 0],
        chest: [0, -0.4, 0],
        leadShoulder: [-1.15, 0, 0.55],
        leadElbow: [0.7, 0, 0],
        leadWrist: [0.3, 0, 0],
      },
    },
    {
      phase: 'recovery',
      at: 0.35,
      ease: 'out',
      pose: {
        chest: [0, -0.5, 0],
        leadShoulder: [-0.9, 0, 0.9],
        leadElbow: [0.5, 0, 0],
      },
    },
  ],
  // Magician Heel: knee chambered high, then the heel snapped up and out.
  standingHeavy: [
    {
      phase: 'startup',
      at: 0.65,
      ease: 'out',
      pose: {
        body: [-0.15, 0, 0],
        chest: [-0.05, 0.2, 0],
        leadHip: [-1.4, 0, 0.1],
        leadKnee: [1.6, 0, 0],
        leadShoulder: [0.2, 0, 0.4],
        rearShoulder: [0, 0, -0.5],
      },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        body: [-0.35, 0, 0],
        chest: [-0.1, -0.3, 0],
        head: [0.2, 0, 0],
        leadHip: [-1.95, 0, 0.15],
        leadKnee: [-0.2, 0, 0],
        leadShoulder: [0.25, 0, 0.6],
        rearShoulder: [0.1, 0, -0.7],
      },
    },
    {
      phase: 'recovery',
      at: 0.4,
      ease: 'out',
      pose: {
        body: [-0.15, 0, 0],
        leadHip: [-1, 0, 0.05],
        leadKnee: [1.1, 0, 0],
      },
    },
  ],
  // Low Card Cut: a flick of the wrist at ankle height.
  lowLight: [
    {
      phase: 'startup',
      at: 0.5,
      ease: 'out',
      pose: { leadShoulder: [0.2, 0, -0.3], leadWrist: [-0.5, 0, 0] },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        body: [0.1, 0, 0],
        chest: [0.08, -0.25, 0],
        leadShoulder: [-0.6, 0, 0.45],
        leadElbow: [0.8, 0, 0],
        leadWrist: [0.6, 0, 0],
      },
    },
  ],
  // Deceptive Sweep: a slow-looking turn that ends in a fast heel along the floor.
  lowHeavy: [
    {
      phase: 'startup',
      at: 0.7,
      ease: 'in',
      pose: { chest: [0, 0.55, 0.05], body: [0, 0, -0.08], leadKnee: [0.3, 0, 0] },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        body: [0.1, 0, 0.06],
        chest: [0.1, -0.8, 0],
        leadHip: [-0.1, 0, 0.45],
        leadKnee: [-1.9, 0, 0],
        rearShoulder: [0.5, 0, -0.4],
        leadShoulder: [0.3, 0, 0.5],
      },
    },
    {
      phase: 'recovery',
      at: 0.5,
      ease: 'out',
      pose: { chest: [0, -0.4, 0], leadKnee: [-0.8, 0, 0] },
    },
  ],
  // Flying Card: thrown from behind the ear with a snap of the wrist.
  airLight: [
    {
      phase: 'startup',
      at: 0.6,
      ease: 'out',
      pose: { chest: [0, 0.25, 0], leadShoulder: [-1.6, 0, 0.2], leadElbow: [-1, 0, 0] },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        body: [0.15, 0, 0],
        chest: [0.05, -0.35, 0],
        leadShoulder: [-1.1, 0, 0],
        leadElbow: [0.85, 0, 0],
        leadWrist: [0.7, 0, 0],
      },
    },
  ],
  // Aerial Axe: the leg rises straight, then chops down.
  airHeavy: [
    {
      phase: 'startup',
      at: 0.7,
      ease: 'out',
      pose: {
        body: [-0.25, 0, 0],
        leadHip: [-1.6, 0, 0],
        leadKnee: [-1.2, 0, 0],
        leadShoulder: [0.3, 0, 0.5],
        rearShoulder: [0.3, 0, -0.5],
      },
    },
    {
      phase: 'active',
      at: 0,
      ease: 'snap',
      pose: {
        body: [0.4, 0, 0],
        chest: [0.1, -0.2, 0],
        leadHip: [-0.6, 0, 0],
        leadKnee: [-1.2, 0, 0],
        leadShoulder: [0.5, 0, 0.3],
        rearShoulder: [0.5, 0, -0.3],
      },
    },
  ],
}
