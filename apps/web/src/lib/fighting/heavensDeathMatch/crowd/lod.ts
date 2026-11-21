import type { Vec3 } from '../stands/geometry'
import { present, type CrowdState, type Spectator } from './types'

/**
 * near: full body, collisions, wounds; mid: simplified trajectory and contacts;
 * far: visual instance and minimal logical state (no collision).
 */
export type CrowdLod = 'near' | 'mid' | 'far'

export const NEAR_RADIUS = 8
export const MID_RADIUS = 18

export function crowdLod(spectator: Spectator, focus: Vec3): CrowdLod {
  const distance = Math.hypot(spectator.at.x - focus.x, spectator.at.z - focus.z)
  if (distance <= NEAR_RADIUS) return 'near'
  return distance <= MID_RADIUS ? 'mid' : 'far'
}

export function lodCounts(crowd: CrowdState, focus: Vec3): Record<CrowdLod, number> {
  const counts: Record<CrowdLod, number> = { near: 0, mid: 0, far: 0 }
  for (const spectator of crowd.spectators)
    if (present(spectator)) counts[crowdLod(spectator, focus)] += 1
  return counts
}

export interface CrowdInstance {
  id: string
  at: Vec3
  palette: number
  height: number
  posture: Spectator['posture']
  /** Chrollo's face worn by a spectator: the renderer draws his head, not theirs. */
  chrolloFace: boolean
  headless: boolean
}

/** What the renderer needs per body. The nature is deliberately absent. */
export function crowdInstances(crowd: CrowdState): CrowdInstance[] {
  return crowd.spectators.filter(present).map((spectator) => ({
    id: spectator.id,
    at: spectator.at,
    palette: spectator.look.palette,
    height: spectator.look.height,
    posture: spectator.posture,
    chrolloFace: spectator.face === 'chrollo',
    headless: Boolean(spectator.headless),
  }))
}
