import type { AnimatedHuman } from '$lib/tour/humanAnimation'
import type { FighterId } from './types'

interface MoveBeat {
  fighter: FighterId
  gather: number
  extension: number
  chamber?: number
}

export function completionSpecial(rig: AnimatedHuman, beat: MoveBeat): void {
  const { fighter, gather, extension } = beat
  switch (fighter) {
    case 'gidal':
      rig.figure.rotation.x += 0.38 * gather
      rig.arms[1].rotation.x -= 1.5 * extension
      break
    case 'longhi':
      rig.arms[0].rotation.z += 1.15 * gather
      rig.arms[1].rotation.x -= 1.05 * extension
      break
    case 'musse':
      rig.head.rotation.y += 0.42 * gather
      rig.arms[0].rotation.x -= 0.55 * gather
      break
    case 'padaille':
      rig.figure.rotation.y -= 0.9 * gather - 1.35 * extension
      break
    case 'tubeppa':
      rig.arms.forEach((arm) => (arm.rotation.z += 0.58 * gather))
      break
    case 'tyson':
      rig.figure.rotation.z += 0.28 * gather
      rig.arms[1].rotation.z -= 0.9 * extension
      break
    default:
      completionSpecialTail(rig, beat)
  }
}

export function completionLight(rig: AnimatedHuman, beat: MoveBeat): boolean {
  const { fighter, gather, extension } = beat
  switch (fighter) {
    case 'gidal':
      rig.figure.rotation.x += 0.16 * gather - 0.5 * extension
      break
    case 'longhi':
      rig.figure.rotation.z += 0.13 * gather
      rig.arms[1].rotation.x -= 0.72 * extension
      break
    case 'musse':
      rig.figure.rotation.y -= 0.62 * extension
      rig.arms[0].rotation.x -= 0.25 * gather
      break
    case 'padaille':
      rig.arms[1].rotation.x -= 1.05 * gather + 1.25 * extension
      break
    case 'tubeppa':
      rig.arms[0].rotation.z += 0.48 * gather
      rig.figure.rotation.x -= 0.22 * extension
      break
    case 'tyson':
      rig.figure.rotation.z -= 0.17 * extension
      rig.arms[1].rotation.x -= 0.34 * gather
      break
    default:
      return completionLightTail(rig, beat)
  }
  return true
}

export function completionHeavy(rig: AnimatedHuman, beat: MoveBeat): boolean {
  const { fighter, gather, extension, chamber = 0 } = beat
  switch (fighter) {
    case 'gidal':
      rig.figure.rotation.y -= 0.76 * gather - 1.12 * extension
      rig.figure.rotation.x += 0.12 * gather
      break
    case 'longhi':
      rig.arms[1].rotation.x -= 1.32 * gather + 0.9 * extension
      rig.figure.rotation.z += 0.15 * gather
      break
    case 'musse':
      rig.legs[1].rotation.x -= 0.65 * chamber + 0.92 * extension
      rig.arms[0].rotation.x -= 0.3 * gather
      break
    case 'padaille':
      rig.figure.rotation.x += 0.3 * gather - 0.68 * extension
      rig.arms[1].rotation.x -= 1.1 * extension
      break
    case 'tubeppa':
      rig.figure.rotation.y += 0.52 * gather - 0.88 * extension
      rig.figure.rotation.z -= 0.12 * extension
      break
    case 'tyson':
      rig.arms[0].rotation.x -= 0.95 * gather
      rig.arms[1].rotation.x -= 0.72 * extension
      break
    default:
      return completionHeavyTail(rig, beat)
  }
  return true
}

function completionSpecialTail(rig: AnimatedHuman, beat: MoveBeat): void {
  const { fighter, gather, extension } = beat
  switch (fighter) {
    case 'sayird':
      rig.figure.rotation.y += 1.25 * gather - 1.6 * extension
      break
    case 'silentmajority':
      rig.figure.rotation.x -= 0.55 * extension
      rig.arms[0].rotation.z += 1.3 * gather
      break
    case 'terebellum':
      rig.arms[0].rotation.x -= 1.25 * gather
      rig.arms[1].rotation.x -= 1.1 * extension
      break
    case 'voconte':
      rig.figure.rotation.y += 1.6 * gather - 2 * extension
      rig.arms[0].rotation.x -= 0.32 * gather
      break
    case 'yokotani':
      rig.figure.rotation.x += 0.2 * gather
      rig.arms.forEach((arm) => (arm.rotation.x -= 0.8 * gather))
      break
  }
}

function completionLightTail(rig: AnimatedHuman, beat: MoveBeat): boolean {
  const { fighter, gather, extension } = beat
  switch (fighter) {
    case 'sayird':
      rig.figure.rotation.y += 0.92 * gather - 1.18 * extension
      break
    case 'silentmajority':
      rig.arms[0].rotation.x -= 0.46 * gather
      rig.arms[1].rotation.x -= 0.86 * extension
      break
    case 'terebellum':
      rig.figure.rotation.x -= 0.44 * extension
      rig.figure.rotation.z += 0.1 * gather
      break
    case 'voconte':
      rig.figure.rotation.y += 1.35 * gather - 1.55 * extension
      rig.arms[0].rotation.x -= 0.2 * gather
      break
    case 'yokotani':
      rig.figure.rotation.x += 0.1 * gather
      rig.arms[1].rotation.x -= 0.58 * extension
      break
    default:
      return false
  }
  return true
}

function completionHeavyTail(rig: AnimatedHuman, beat: MoveBeat): boolean {
  const { fighter, gather, extension } = beat
  switch (fighter) {
    case 'sayird':
      rig.figure.rotation.z += 0.26 * gather
      rig.legs[0].rotation.x -= 0.82 * extension
      break
    case 'silentmajority':
      rig.figure.rotation.y += 0.98 * gather - 1.42 * extension
      rig.arms[0].rotation.x -= 0.4 * gather
      break
    case 'terebellum':
      rig.arms[0].rotation.x -= 1.4 * gather
      rig.figure.rotation.x -= 0.35 * extension
      break
    case 'voconte':
      rig.figure.rotation.y += 1.48 * gather - 1.86 * extension
      rig.figure.rotation.z += 0.18 * gather
      break
    case 'yokotani':
      rig.figure.rotation.x += 0.24 * gather - 0.52 * extension
      rig.arms[1].rotation.x -= 0.65 * extension
      break
    default:
      return false
  }
  return true
}
