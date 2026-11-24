import { addPoses, scalePose, type FightPose } from './fightPose'
import type { MoveTimeline, PhaseFrames } from './keyPoseTimeline'
import { STANDING_STRIKES } from './standingStrikeDirections'
import { standingFootwork } from './standingFootwork'
import type { ArcadeFighter, FighterId, MoveSlot } from './types'

function direction(id: FighterId, slot: MoveSlot) {
  if (slot !== 'standingLight' && slot !== 'standingHeavy') return undefined
  return STANDING_STRIKES[id]?.[slot]
}

const CACHE = new Map<string, MoveTimeline>()

export function standingStrikeTimeline(
  id: FighterId,
  slot: MoveSlot,
  native: MoveTimeline | null,
): MoveTimeline | null {
  const strike = direction(id, slot)
  const footwork = standingFootwork(id, slot)
  if (!strike && (!footwork || !native)) return native
  const key = `${id}:${slot}`
  const cached = CACHE.get(key)
  if (cached) return cached
  const timeline = strike ? compileStrike(strike) : driveFromSupport(native!, footwork!)
  CACHE.set(key, timeline)
  return timeline
}

function compileStrike({
  load,
  contact,
  release,
  chamberAt,
}: NonNullable<ReturnType<typeof direction>>): MoveTimeline {
  return [
    { phase: 'startup', at: 0.22, pose: scalePose(load, 0.47), ease: 'out' },
    {
      phase: 'startup',
      at: chamberAt,
      pose: load,
      ease: 'smooth',
      jointEase: { pelvis: 'out', chest: 'in' },
    },
    {
      phase: 'active',
      at: 0,
      pose: contact,
      ease: 'snap',
      jointEase: { pelvis: 'out', leadKnee: 'out', rearKnee: 'out' },
    },
    { phase: 'active', at: 1, pose: contact },
    {
      phase: 'recovery',
      at: 0.15,
      pose: addPoses(scalePose(contact, 0.68), scalePose(release, 0.32)),
      ease: 'out',
    },
    { phase: 'recovery', at: 0.52, pose: release, ease: 'smooth' },
    { phase: 'recovery', at: 0.87, pose: scalePose(release, 0.19), ease: 'out' },
  ]
}

export function standingStrikeSupport(fighter: ArcadeFighter, slot: MoveSlot, frames: PhaseFrames) {
  const strike = direction(fighter.id, slot)
  const footwork = standingFootwork(fighter.id, slot)
  if (!fighter.attack || (!strike && !footwork)) return undefined
  const supportFoot = strike?.support ?? footwork![1]
  const pressure = Math.min(1, fighter.attack.frame / Math.max(1, frames.startup))
  const recovery = Math.max(0, fighter.attack.frame - frames.startup - frames.active)
  const release = 1 - Math.min(1, recovery / Math.max(1, frames.recovery))
  return {
    supportFoot,
    pivotFoot: supportFoot === 'lead' ? ('rear' as const) : ('lead' as const),
    pivotAngle: (strike?.contact.pelvis?.[1] ?? footwork?.[3] ?? 0) * pressure * release * 0.6,
  }
}

/** The weight arrives from a fighter's chosen side before the native arm or kick hits. */
function driveFromSupport(
  native: MoveTimeline,
  footwork: NonNullable<ReturnType<typeof standingFootwork>>,
): MoveTimeline {
  const [, support, chamberAt, pivot, compression, reachStep] = footwork
  const left = support === 'lead'
  const knee = left ? 'leadKnee' : 'rearKnee'
  const hip = left ? 'leadHip' : 'rearHip'
  const freeHip = left ? 'rearHip' : 'leadHip'
  const load: FightPose = {
    root: [0, -compression * 0.09, -Math.abs(reachStep) * 0.26],
    pelvis: [0, -pivot * 0.68, 0],
    chest: [0, -pivot * 0.28, 0],
    [hip]: [-compression * 0.6, 0, 0],
    [knee]: [compression, 0, 0],
  }
  const drive: FightPose = {
    root: [left ? 0.025 : -0.025, -compression * 0.07, reachStep],
    pelvis: [0, pivot, 0],
    chest: [reachStep * 0.35, -pivot * 0.24, 0],
    [hip]: [-compression * 0.55, 0, 0],
    [knee]: [compression * 0.82, 0, 0],
    [freeHip]: [reachStep * (left ? 1.35 : -1.35), 0, 0],
  }
  const lastLoad = native.filter((key) => key.phase === 'startup').at(-1)
  return native.map((key) => {
    if (key.phase === 'startup') {
      const weight = key === lastLoad ? 1 : 0.45
      return {
        ...key,
        at: key === lastLoad ? chamberAt : key.at,
        pose: addPoses(key.pose, scalePose(load, weight)),
      }
    }
    const amount = key.phase === 'active' ? 1 : (1 - key.at) ** 2
    return { ...key, pose: addPoses(key.pose, scalePose(drive, amount)) }
  })
}
