import { lerpPose, type FightPose } from '../fightPose'
import type { ThrowPerformance, ThrowBeat, ThrowCameraKey } from './types'

export const throwSmooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t

export function sampleThrowBeat(performance: ThrowPerformance, progress: number): ThrowBeat {
  const t = Math.max(0, Math.min(1, progress))
  const keys = performance.beats
  const index = Math.max(
    1,
    keys.findIndex((beat) => beat.at >= t),
  )
  const a = keys[index - 1],
    b = keys[index]
  const f = throwSmooth((t - a.at) / (b.at - a.at))
  return {
    at: t,
    attacker: lerpPose(a.attacker, b.attacker, f),
    victim: lerpPose(a.victim, b.victim, f),
    path: [
      mix(a.path[0], b.path[0], f),
      mix(a.path[1], b.path[1], f),
      mix(a.path[2], b.path[2], f),
    ],
    actorPath: actorTravel(a, b, f),
  }
}

function actorTravel(a: ThrowBeat, b: ThrowBeat, f: number): readonly [number, number, number] {
  const from = a.actorPath ?? [0, 0, 0],
    to = b.actorPath ?? [0, 0, 0]
  return [mix(from[0], to[0], f), mix(from[1], to[1], f), mix(from[2], to[2], f)]
}

export function sampleThrowCamera(performance: ThrowPerformance, progress: number): ThrowCameraKey {
  const t = Math.max(0, Math.min(1, progress))
  const index = t < 0.5 ? 0 : 1
  const f = throwSmooth((t - index * 0.5) * 2)
  const a = performance.camera[index],
    b = performance.camera[index + 1]
  return [mix(a[0], b[0], f), mix(a[1], b[1], f), mix(a[2], b[2], f), mix(a[3], b[3], f)]
}

export function returningThrowPose(pose: FightPose, ordinary: FightPose, progress: number) {
  return lerpPose(pose, ordinary, throwSmooth((progress - 0.8) / 0.2))
}
