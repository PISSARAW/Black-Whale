import type { AnimatedHuman } from '$lib/tour/humanAnimation'
import type { FighterId } from './types'
import { completionHeavy, completionLight, completionSpecial } from './combatCompletionMoves'

interface MoveBeat {
  fighter: FighterId
  gather: number
  extension: number
  chamber?: number
}

export function fourthWaveSpecial(rig: AnimatedHuman, beat: MoveBeat): void {
  const { fighter, gather, extension } = beat
  switch (fighter) {
    case 'cluck':
      rig.arms.forEach((arm) => (arm.rotation.z += 0.85 * gather))
      break
    case 'beyond':
      rig.figure.rotation.x += 0.32 * gather - 0.7 * extension
      break
    case 'fugetsu':
      rig.figure.rotation.y += 1.5 * gather - 1.9 * extension
      rig.arms[0].rotation.x -= 0.45 * gather
      break
    case 'kacho':
      rig.arms[0].rotation.x -= 0.7 * gather
      rig.arms[1].rotation.x -= 1.1 * extension
      break
    case 'luzurus':
      rig.head.rotation.y += 0.3 * gather
      rig.arms[1].rotation.z -= 1.15 * gather
      break
    case 'momoze':
      rig.figure.rotation.y -= 0.55 * extension
      rig.arms[0].rotation.z += 1.2 * gather
      break
    case 'salesale':
      rig.figure.rotation.z += 0.22 * gather
      rig.arms.forEach((arm) => (arm.rotation.x -= 0.75 * gather))
      break
    case 'zhanglei':
      rig.figure.rotation.x -= 0.45 * extension
      rig.arms[1].rotation.x -= 1.3 * extension
      break
    default:
      completionSpecial(rig, beat)
  }
}

export function fourthWaveLight(rig: AnimatedHuman, beat: MoveBeat): boolean {
  const { fighter, gather, extension } = beat
  switch (fighter) {
    case 'cluck':
      rig.figure.rotation.z += 0.14 * gather
      rig.arms[0].rotation.x -= 0.4 * extension
      break
    case 'beyond':
      rig.figure.rotation.x -= 0.48 * extension
      break
    case 'fugetsu':
      rig.figure.rotation.y += 1.15 * gather - 1.4 * extension
      rig.figure.rotation.z += 0.11 * gather
      break
    case 'kacho':
      rig.arms[1].rotation.x -= 0.82 * extension
      break
    case 'luzurus':
      rig.figure.rotation.y -= 0.72 * extension
      break
    case 'momoze':
      rig.arms[0].rotation.x -= 0.38 * gather
      rig.arms[1].rotation.x -= 0.6 * extension
      break
    case 'salesale':
      rig.figure.rotation.z -= 0.2 * extension
      break
    case 'zhanglei':
      rig.figure.rotation.x += 0.12 * gather - 0.4 * extension
      break
    default:
      return completionLight(rig, beat)
  }
  return true
}

export function fourthWaveHeavy(rig: AnimatedHuman, beat: MoveBeat): boolean {
  const { fighter, gather, extension, chamber = 0 } = beat
  switch (fighter) {
    case 'cluck':
      rig.figure.rotation.y += 0.82 * gather - 1.18 * extension
      break
    case 'beyond':
      rig.arms[1].rotation.x -= 1.65 * gather + 1.1 * extension
      rig.figure.rotation.x -= 0.2 * extension
      break
    case 'fugetsu':
      rig.figure.rotation.z += 0.3 * gather
      rig.legs[1].rotation.x -= 0.7 * extension
      break
    case 'kacho':
      rig.figure.rotation.y -= 0.88 * gather - 1.22 * extension
      break
    case 'luzurus':
      rig.legs[0].rotation.x -= 0.8 * chamber + 1.05 * extension
      rig.arms[0].rotation.x -= 0.35 * gather
      break
    case 'momoze':
      rig.figure.rotation.x += 0.18 * gather - 0.56 * extension
      break
    case 'salesale':
      rig.arms[0].rotation.x -= 1.2 * gather
      rig.arms[1].rotation.x -= 0.65 * extension
      break
    case 'zhanglei':
      rig.figure.rotation.y += 0.58 * gather - 0.96 * extension
      rig.figure.rotation.z += 0.16 * gather
      break
    default:
      return completionHeavy(rig, beat)
  }
  return true
}
