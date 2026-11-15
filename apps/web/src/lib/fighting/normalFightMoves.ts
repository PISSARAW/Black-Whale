import type { AnimatedHuman } from '$lib/tour/humanAnimation'
import type { FighterId } from './types'

interface StrikeBeat {
  gather: number
  extension: number
  chamber: number
}

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

function smooth(value: number): number {
  const x = clamp01(value)
  return x * x * (3 - 2 * x)
}

function strikeBeat(progress: number, impact: number): StrikeBeat {
  const windupEnd = impact * 0.62
  const windup = smooth(progress / windupEnd)
  const strike = smooth((progress - windupEnd) / (impact - windupEnd))
  const returning = smooth((progress - impact) / (1 - impact))
  return {
    gather: windup * (1 - returning),
    extension: strike * (1 - returning),
    chamber: windup * (1 - strike) * (1 - returning),
  }
}

interface NormalMoveOptions {
  rig: AnimatedHuman
  fighter: FighterId
  beat: StrikeBeat
}

function extendedLightMove(options: NormalMoveOptions): boolean {
  const { rig, fighter, beat } = options
  const { gather, extension } = beat
  switch (fighter) {
    case 'theta':
      rig.figure.rotation.y -= 0.3 * extension
      rig.arms[0].rotation.z += 0.5 * gather
      rig.arms[1].rotation.x -= 0.45 * gather + 0.85 * extension
      return true
    case 'biscuit':
      rig.figure.rotation.x += 0.18 * gather - 0.4 * extension
      rig.arms[1].rotation.x -= 0.9 * gather + 1.3 * extension
      rig.arms[0].rotation.z += 0.45 * gather
      return true
    case 'marayam':
      rig.figure.rotation.y += 0.2 * gather - 0.4 * extension
      rig.arms[0].rotation.z += 0.75 * gather
      rig.arms[1].rotation.x -= 0.5 * extension
      return true
    case 'phinks':
      rig.figure.rotation.x += 0.16 * gather - 0.38 * extension
      rig.arms[1].rotation.x -= 0.8 * gather + 1.25 * extension
      return true
    case 'franklin':
      rig.figure.rotation.x += 0.12 * gather
      rig.arms[0].rotation.x -= 0.7 * extension
      rig.arms[1].rotation.x -= 0.7 * extension
      return true
    case 'machi':
      rig.figure.rotation.y -= 0.48 * extension
      rig.arms[1].rotation.z -= 0.8 * gather + 0.45 * extension
      return true
    case 'illumi':
      rig.figure.rotation.y += 0.35 * gather - 0.65 * extension
      rig.arms[1].rotation.x -= 0.55 * gather + 0.95 * extension
      return true
    case 'kalluto':
      rig.figure.rotation.y += 0.65 * gather - 0.95 * extension
      rig.arms[0].rotation.z += 0.9 * gather
      rig.arms[1].rotation.z -= 0.65 * extension
      return true
    case 'bonolenov':
      rig.figure.rotation.y -= 0.45 * extension
      rig.arms[0].rotation.z += 0.7 * gather
      rig.arms[1].rotation.x -= 0.75 * gather + 1.05 * extension
      return true
    default:
      return false
  }
}

function extendedHeavyMove(options: NormalMoveOptions): boolean {
  const { rig, fighter, beat } = options
  const { gather, extension, chamber } = beat
  switch (fighter) {
    case 'theta':
      rig.figure.rotation.y -= 0.55 * extension
      rig.legs[0].rotation.x -= 0.65 * chamber + 0.9 * extension
      rig.arms[1].rotation.z -= 0.65 * gather
      return true
    case 'biscuit':
      rig.figure.rotation.x += 0.28 * gather - 0.65 * extension
      rig.arms.forEach((arm) => (arm.rotation.x -= 1.7 * gather + 0.7 * extension))
      rig.knees.forEach((knee) => (knee.rotation.x += 0.35 * gather))
      return true
    case 'marayam':
      rig.figure.rotation.y += 0.6 * gather - 0.9 * extension
      rig.legs[1].rotation.x -= 0.5 * chamber + 0.75 * extension
      rig.arms[0].rotation.z += 0.9 * gather
      return true
    case 'phinks':
      rig.figure.rotation.x += 0.24 * gather - 0.62 * extension
      rig.arms[1].rotation.x -= 1.4 * gather + 1.25 * extension
      rig.knees.forEach((knee) => (knee.rotation.x += 0.3 * gather))
      return true
    case 'franklin':
      rig.figure.rotation.x += 0.3 * gather - 0.48 * extension
      rig.arms.forEach((arm) => (arm.rotation.x -= 1.2 * gather + 0.6 * extension))
      return true
    case 'machi':
      rig.figure.rotation.y -= 0.8 * gather - 1.15 * extension
      rig.legs[1].rotation.x -= 0.7 * chamber + 1.05 * extension
      return true
    case 'illumi':
      rig.figure.rotation.y += 0.7 * gather - 1.05 * extension
      rig.arms[0].rotation.z += 0.8 * gather
      rig.arms[1].rotation.x -= 1.1 * extension
      return true
    case 'kalluto':
      rig.figure.rotation.y += 1.05 * gather - 1.4 * extension
      rig.legs[0].rotation.z += 0.55 * extension
      rig.arms[1].rotation.z -= 1.05 * gather
      return true
    case 'bonolenov':
      rig.figure.rotation.y -= 0.9 * gather - 1.3 * extension
      rig.figure.rotation.z += 0.24 * gather
      rig.legs[1].rotation.x -= 0.75 * chamber + 1.1 * extension
      return true
    default:
      return false
  }
}

/** A character-specific quick attack, authored around the first active frame. */
export function lightFightMove(rig: AnimatedHuman, fighter: FighterId, progress: number): void {
  const beat = strikeBeat(progress, 5 / 18)
  const { gather, extension, chamber } = beat
  if (extendedLightMove({ rig, fighter, beat })) return
  switch (fighter) {
    case 'kurapika':
      rig.figure.rotation.y -= 0.12 * gather - 0.3 * extension
      rig.arms[1].rotation.set(-0.42 * gather - 1.02 * extension, 0, -0.12 * gather)
      rig.arms[1].children[1].rotation.x -= 1.1 * chamber
      rig.arms[0].rotation.set(-0.72 * gather, 0, 0.62 * gather)
      rig.head.rotation.y += 0.12 * gather
      break
    case 'hisoka':
      rig.figure.rotation.y += 0.42 * gather - 0.74 * extension
      rig.figure.rotation.z -= 0.12 * gather
      rig.arms[1].rotation.set(-0.35 * gather, 0, -1.15 * gather - 0.55 * extension)
      rig.arms[1].children[1].rotation.x -= 0.78 * chamber
      rig.arms[0].rotation.z += 0.48 * gather
      break
    case 'chrollo':
      rig.figure.rotation.y -= 0.22 * extension
      rig.arms[0].rotation.set(-0.5 * gather, 0, 0.38 * gather)
      rig.arms[1].rotation.set(-0.3 * gather - 0.72 * extension, 0, -0.3 * gather)
      rig.arms[1].children[1].rotation.x -= 1.42 * chamber
      rig.head.rotation.x += 0.12 * gather
      break
    case 'morena':
      rig.figure.rotation.x += 0.1 * gather
      rig.figure.rotation.y += 0.26 * gather - 0.34 * extension
      rig.head.rotation.z -= 0.14 * gather
      rig.arms[0].rotation.z += 0.92 * gather
      rig.arms[1].rotation.set(-0.22 * gather - 0.66 * extension, 0, -0.82 * gather)
      break
    case 'benjamin':
      rig.figure.rotation.x += 0.16 * gather - 0.34 * extension
      rig.figure.rotation.y -= 0.18 * gather - 0.38 * extension
      rig.arms[1].rotation.x -= 0.8 * gather + 1.2 * extension
      rig.arms[1].children[1].rotation.x -= 0.92 * chamber
      rig.arms[0].rotation.set(-0.74 * gather, 0, 0.46 * gather)
      break
    case 'tserriednich':
      rig.figure.rotation.y += 0.32 * gather - 0.58 * extension
      rig.head.rotation.y -= 0.28 * gather
      rig.arms[0].rotation.set(-0.28 * gather, 0, 0.84 * gather)
      rig.arms[1].rotation.set(-0.44 * gather - 0.88 * extension, 0, -0.64 * gather)
      rig.arms[1].children[1].rotation.x -= 0.7 * chamber
      break
    case 'feitan':
      rig.figure.rotation.y -= 0.5 * extension
      rig.arms[1].rotation.x -= 0.65 * gather + 1.15 * extension
      rig.arms[0].rotation.z += 0.7 * gather
      break
    case 'saiyu':
      rig.figure.rotation.y += 0.55 * gather - 0.8 * extension
      rig.arms[0].rotation.z += 0.95 * gather
      rig.arms[1].rotation.x -= 0.55 * gather + 0.9 * extension
      break
  }
}

/** A character-specific committed strike: kicks, sweeps, elbows or raw force. */
export function heavyFightMove(rig: AnimatedHuman, fighter: FighterId, progress: number): void {
  const beat = strikeBeat(progress, 12 / 34)
  const { gather, extension, chamber } = beat
  if (extendedHeavyMove({ rig, fighter, beat })) return
  switch (fighter) {
    case 'kurapika':
      rig.figure.rotation.y -= 0.55 * gather - 0.94 * extension
      rig.figure.rotation.z += 0.08 * gather - 0.2 * extension
      rig.legs[1].rotation.x -= 0.68 * chamber + 1.18 * extension
      rig.knees[1].rotation.x += 1.08 * chamber - 0.62 * extension
      rig.arms[0].rotation.z += 0.58 * gather
      rig.arms[1].rotation.z -= 0.7 * gather
      break
    case 'hisoka':
      rig.figure.rotation.y += 0.72 * gather - 1.08 * extension
      rig.figure.rotation.z -= 0.28 * gather + 0.16 * extension
      rig.legs[0].rotation.x -= 0.92 * chamber + 1.42 * extension
      rig.legs[0].rotation.z += 0.28 * extension
      rig.knees[0].rotation.x += 1.22 * chamber - 0.48 * extension
      rig.arms[1].rotation.z -= 1.02 * gather
      break
    case 'chrollo':
      rig.figure.rotation.y -= 0.38 * gather - 0.64 * extension
      rig.figure.rotation.x -= 0.14 * extension
      rig.arms[0].rotation.set(-0.82 * gather, 0, 0.5 * gather)
      rig.arms[1].rotation.set(-0.92 * gather - 0.86 * extension, 0, -0.2 * gather)
      rig.arms[1].children[1].rotation.x -= 1.2 * chamber - 0.3 * extension
      rig.knees[1].rotation.x += 0.24 * gather
      break
    case 'morena':
      rig.figure.rotation.y += 0.88 * gather - 1.22 * extension
      rig.figure.rotation.z += 0.22 * gather
      rig.legs[1].rotation.x -= 0.46 * chamber + 0.72 * extension
      rig.legs[1].rotation.z -= 0.74 * extension
      rig.knees[1].rotation.x += 1.18 * chamber - 0.82 * extension
      rig.arms[0].rotation.z += 1.08 * gather
      rig.arms[1].rotation.z -= 0.52 * gather
      break
    case 'benjamin':
      rig.figure.rotation.x += 0.22 * gather - 0.58 * extension
      rig.knees.forEach((knee) => (knee.rotation.x += 0.38 * gather))
      rig.arms[0].rotation.set(-1.82 * gather - 0.76 * extension, 0, 0.24 * gather)
      rig.arms[1].rotation.set(-1.82 * gather - 0.76 * extension, 0, -0.24 * gather)
      rig.arms.forEach((arm) => (arm.children[1].rotation.x -= 0.7 * chamber))
      break
    case 'tserriednich':
      rig.figure.rotation.y += 0.52 * gather - 0.82 * extension
      rig.figure.rotation.x -= 0.2 * extension
      rig.legs[1].rotation.x -= 0.84 * chamber + 0.95 * extension
      rig.knees[1].rotation.x += 1.28 * chamber - 0.38 * extension
      rig.arms[0].rotation.z += 0.8 * gather
      rig.arms[1].rotation.set(-0.62 * gather, 0, -0.72 * gather)
      rig.head.rotation.y -= 0.32 * gather
      break
    case 'feitan':
      rig.figure.rotation.y -= 0.8 * gather - 1.2 * extension
      rig.legs[1].rotation.x -= 0.8 * chamber + 1.35 * extension
      rig.knees[1].rotation.x += 1.1 * chamber
      break
    case 'saiyu':
      rig.figure.rotation.y += 0.9 * gather - 1.35 * extension
      rig.arms[0].rotation.set(-1.1 * gather, 0, 0.8 * gather)
      rig.arms[1].rotation.set(-1.1 * gather - 0.8 * extension, 0, -0.8 * gather)
      break
  }
}
