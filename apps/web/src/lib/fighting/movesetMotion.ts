import type { AnimatedHuman, HumanMotion } from '$lib/tour/humanAnimation'
import { moveById } from './movesets'
import type { ArcadeFighter } from './types'

export function movesetMotion(
  fighter: Partial<Pick<ArcadeFighter, 'id' | 'attack'>>,
  progress: number,
): HumanMotion | undefined {
  const move = moveById(fighter.attack?.moveId)
  if (!move) return undefined
  const extension = Math.sin(Math.min(1, progress) * Math.PI)
  const flavour = fighter.id ? 0.9 + (hash(fighter.id) % 7) * 0.035 : 1
  return (rig) => {
    const amount = extension * flavour
    applyNormalMotion(rig, move.slot, amount)
    applyTechniqueMotion(rig, move.slot, amount)
  }
}

function applyNormalMotion(rig: AnimatedHuman, slot: string, amount: number): void {
  if (slot === 'standingLight') rig.arms[1].rotation.x -= 0.28 * amount
  if (slot === 'standingHeavy') {
    rig.figure.rotation.y -= 0.22 * amount
    rig.arms[0].rotation.z += 0.18 * amount
  }
  if (slot === 'lowLight') rig.arms[0].rotation.x -= 0.42 * amount
  if (slot === 'lowHeavy') rig.legs[1].rotation.z -= 0.34 * amount
  if (slot === 'airLight') {
    rig.figure.rotation.z += 0.16 * amount
    rig.arms[1].rotation.z -= 0.5 * amount
  }
  if (slot === 'airHeavy') {
    rig.figure.rotation.x += 0.24 * amount
    rig.legs[0].rotation.x += 0.55 * amount
  }
  applyCommandMotion(rig, slot, amount)
}

function applyCommandMotion(rig: AnimatedHuman, slot: string, amount: number): void {
  if (slot === 'forwardLight') {
    rig.figure.rotation.x += 0.22 * amount
    rig.arms[1].rotation.x -= 0.9 * amount
  }
  if (slot === 'forwardHeavy') {
    rig.figure.rotation.y -= 0.7 * amount
    rig.legs[1].rotation.x -= 0.85 * amount
  }
  if (slot === 'backHeavy') {
    rig.figure.rotation.y += 0.55 * amount
    rig.arms[0].rotation.x -= 1.05 * amount
  }
}

function applyTechniqueMotion(rig: AnimatedHuman, slot: string, amount: number): void {
  if (slot === 'neutralSpecial') {
    rig.arms.forEach((arm, index) => {
      arm.rotation.z += (index === 0 ? 1 : -1) * 0.46 * amount
    })
  }
  if (slot === 'forwardSpecial') {
    rig.figure.rotation.x += 0.3 * amount
    rig.arms[1].rotation.x -= 0.8 * amount
  }
  if (slot === 'downSpecial') {
    rig.figure.position.y -= 0.3 * amount
    rig.knees.forEach((knee) => (knee.rotation.x += 0.65 * amount))
  }
  if (slot === 'backSpecial') {
    rig.figure.rotation.y += 0.5 * amount
    rig.arms[0].rotation.z += 0.85 * amount
  }
  applyFinisherMotion(rig, slot, amount)
}

function applyFinisherMotion(rig: AnimatedHuman, slot: string, amount: number): void {
  if (slot === 'throw') {
    rig.figure.rotation.y += 0.35 * amount
    rig.arms.forEach((arm) => (arm.rotation.x -= 0.55 * amount))
  }
  if (slot !== 'finisher') return
  rig.figure.rotation.x -= 0.28 * amount
  rig.figure.rotation.y += 0.9 * amount
  rig.arms.forEach((arm, index) => {
    arm.rotation.x -= 0.75 * amount
    arm.rotation.z += (index === 0 ? 1 : -1) * 0.8 * amount
  })
}

function hash(value: string): number {
  let result = 0
  for (const character of value) result = (result * 31 + character.charCodeAt(0)) >>> 0
  return result
}
