import { lerpPose, type FightPose } from '../fightPose'
import { rightHandedPose } from '../fightHandedPose'
import type { IntroCameraKey, IntroPerformance } from './introPerformanceTypes'

export const introProgress = (value: number) => Math.max(0, Math.min(1, value))
const smooth = (value: number) => value * value * (3 - 2 * value)
const mix = (a: number, b: number, t: number) => a + (b - a) * t

/** The same authored beats drive the actor and the orbit, independent of render cadence. */
export function sampleIntroPose(
  performance: IntroPerformance,
  base: { standing: FightPose; mirrorHands: boolean },
  progress: number,
): FightPose {
  const t = introProgress(progress)
  if (t === 0 || t === 1) return base.standing
  const keys = [
    base.standing,
    ...performance.poses.map((pose) => ({
      ...base.standing,
      ...(base.mirrorHands ? rightHandedPose(pose) : pose),
    })),
    base.standing,
  ]
  const times = [0, ...performance.beats, 1]
  for (let index = 1; index < times.length; index++) {
    if (t <= times[index]) {
      const travel = smooth((t - times[index - 1]) / (times[index] - times[index - 1]))
      return lerpPose(keys[index - 1], keys[index], travel)
    }
  }
  return base.standing
}

export function sampleIntroCamera(performance: IntroPerformance, progress: number): IntroCameraKey {
  const t = introProgress(progress)
  const signature = performance.beats[1]
  const index = t < signature ? 0 : 1
  const start = index === 0 ? 0 : signature
  const end = index === 0 ? signature : 1
  const amount = smooth((t - start) / (end - start))
  const from = performance.camera[index]
  const to = performance.camera[index + 1]
  return [
    mix(from[0], to[0], amount),
    mix(from[1], to[1], amount),
    mix(from[2], to[2], amount),
    mix(from[3], to[3], amount),
    mix(from[4] ?? 0, to[4] ?? 0, amount),
  ]
}
