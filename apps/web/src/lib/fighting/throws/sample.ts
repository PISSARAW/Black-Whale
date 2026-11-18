import { throwTravel, sampleThrowChannel } from './trajectory'
import { FIGHT_JOINTS, lerpPose, type FightPose } from '../fightPose'
import type { ThrowPerformance, ThrowBeat, ThrowCameraKey } from './types'

export const throwSmooth = (value: number) => {
  const t = Math.max(0, Math.min(1, value))
  return t * t * (3 - 2 * t)
}
const mix = (a: number, b: number, t: number) => a + (b - a) * t

export function sampleThrowBeat(performance: ThrowPerformance, progress: number): ThrowBeat {
  const t = Math.max(0, Math.min(1, progress))
  return {
    at: t,
    attacker: continuousThrowPose(performance, t, 'attacker'),
    victim: continuousThrowPose(performance, t, 'victim'),
    path: throwTravel(performance, t, 'path'),
    actorPath: throwTravel(performance, t, 'actorPath'),
  }
}

function continuousThrowPose(
  performance: ThrowPerformance,
  t: number,
  role: 'attacker' | 'victim',
): FightPose {
  return Object.fromEntries(
    FIGHT_JOINTS.filter((joint) => performance.beats.some((beat) => beat[role][joint])).map(
      (joint) => [
        joint,
        [0, 1, 2].map((axis) =>
          sampleThrowChannel(performance.beats, t, (beat) => beat[role][joint]?.[axis] ?? 0),
        ),
      ],
    ),
  ) as FightPose
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
