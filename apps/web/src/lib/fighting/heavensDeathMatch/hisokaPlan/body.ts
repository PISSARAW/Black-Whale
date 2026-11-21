import { limbPosition } from '../crowd/heads'
import type { CrowdState } from '../crowd/types'
import type { Blast } from '../stands/damage'
import type { Vec3 } from '../stands/geometry'
import type { HisokaBody } from '../chrolloPlan/world'
import { breathe, woundByBlast, type HisokaWounds, type WoundSite } from '../wounds'

const SITES: readonly [WoundSite, (at: Vec3) => Vec3][] = [
  ['left-hand', (at) => limbPosition(at, 'left-hand')],
  ['right-hand', (at) => limbPosition(at, 'right-hand')],
  ['right-leg', (at) => ({ x: at.x + 0.15, y: at.y + 0.3, z: at.z })],
  ['face-neck', (at) => ({ x: at.x, y: at.y + 1.6, z: at.z })],
  ['torso', (at) => ({ x: at.x, y: at.y + 1.1, z: at.z })],
]

const gap = (a: Vec3, b: Vec3) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)

/** The part of Hisoka a blast is closest to, and how close. */
export function blastSite(hisoka: Vec3, blast: Blast): { site: WoundSite; distance: number } {
  let best: { site: WoundSite; distance: number } = { site: 'torso', distance: Infinity }
  for (const [site, place] of SITES) {
    const distance = gap(place(hisoka), blast.at)
    if (distance < best.distance) best = { site, distance }
  }
  return best
}

/** Bodies lying on or pressed against him, the ones that take his breath. */
export function compressionOn(crowd: CrowdState, hisoka: Vec3): number {
  let count = 0
  for (const body of crowd.spectators) {
    if (body.posture === 'vanished' || body.posture === 'evacuated') continue
    if (Math.hypot(body.at.x - hisoka.x, body.at.z - hisoka.z) <= 0.6) count += 1
  }
  return count
}

/** One frame of Hisoka's body: the blasts that reached him, then his breath. */
export function stepHisokaBody(
  hisoka: HisokaBody,
  blasts: readonly Blast[],
  crowd: CrowdState,
): HisokaBody {
  let wounds: HisokaWounds = hisoka.wounds
  for (const blast of blasts)
    wounds = woundByBlast(wounds, { power: blast.power, ...blastSite(hisoka.at, blast) })
  return { ...hisoka, wounds: breathe(wounds, compressionOn(crowd, hisoka.at)) }
}
