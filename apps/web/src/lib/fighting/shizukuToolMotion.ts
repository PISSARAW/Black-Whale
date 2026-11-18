import type { MoveTimeline } from './keyPoseTimeline'
import type { Turn } from './fightPose'

function toolArc(load: Turn, contact: Turn, follow: Turn): MoveTimeline {
  return [
    { phase: 'startup', at: 0.65, pose: { body: load }, ease: 'out' },
    { phase: 'active', at: 0, pose: { body: contact }, ease: 'snap' },
    { phase: 'active', at: 1, pose: { body: contact } },
    { phase: 'recovery', at: 0.4, pose: { body: follow }, ease: 'out' },
    { phase: 'recovery', at: 0.9, pose: { body: [0, 0, 0] }, ease: 'smooth' },
  ]
}

/** Tool angles in the fighter's space; the physical move remains the sole source of contacts. */
export const SHIZUKU_TOOL_ARCS: Readonly<Record<string, MoveTimeline>> = {
  'shizuku:standingLight': toolArc([0.15, -0.2, 0], [-0.35, 0.1, 0], [-0.15, 0.05, 0]),
  'shizuku:lowLight': toolArc([0.1, -0.2, 0], [-0.6, 0.1, -0.1], [-0.2, 0, 0]),
  'shizuku:lowHeavy': toolArc([0.2, -0.65, -0.3], [-0.65, 0.7, 0.25], [-0.3, 0.3, 0.1]),
  'shizuku:airLight': toolArc([0.3, -0.2, 0], [-0.5, 0.15, 0], [-0.2, 0, 0]),
  'shizuku:airHeavy': toolArc([1.1, 0, -0.1], [-1, 0, 0.1], [-0.7, 0, 0.05]),
  'shizuku:forwardLight': toolArc([0.2, -0.2, 0], [-0.4, 0.1, 0], [-0.2, 0, 0]),
  'shizuku:forwardHeavy': toolArc([0.5, -0.7, -0.15], [-0.65, 0.65, 0.1], [-0.4, 0.3, 0.05]),
  'shizuku:backHeavy': toolArc([0.1, 0.6, 0.1], [-0.4, -0.65, -0.1], [-0.2, -0.3, 0]),
}
