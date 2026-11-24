import type { MoveTimeline } from './keyPoseTimeline'
import type { Turn } from './fightPose'
import { shufflePhase } from './fightShuffleStep'
import type { ArcadeFighter } from './types'

export function blinkyCarryAngle(fighter: ArcadeFighter): Turn | undefined {
  if (fighter.attack) return undefined
  if (fighter.pose === 'guard') return [-0.49, 0.37, 0.15]
  if (fighter.pose === 'jump') return [0.27, 0.15, -0.23]
  if (fighter.pose === 'walk') {
    const swing = Math.sin(shufflePhase(fighter))
    return [0.13 + 0.1 * swing, 0.07 * swing, -0.12 + 0.06 * swing]
  }
}

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
