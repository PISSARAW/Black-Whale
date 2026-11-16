import { THROW_TECH_RECOVERY_FRAMES } from './throwRules'
import type { AnimatedHuman, HumanMotion } from '$lib/tour/humanAnimation'
import type { FightNenZone, FightSide, FightState } from './types'

export function impactReaction(zone: FightNenZone, progress: number): HumanMotion {
  const snap = ease(Math.min(1, progress * 4))
  const release = ease(Math.max(0, (progress - 0.25) / 0.75))
  const amount = snap * (1 - release)
  return (rig) => reactByZone(rig, zone, amount)
}

export function knockdownMotion(progress: number): HumanMotion {
  const amount = ease(progress)
  return (rig) => {
    rig.figure.rotation.z += amount * 1.48
    rig.figure.position.y -= amount * 0.32
    rig.figure.position.x += amount * 0.25
    rig.head.rotation.x -= amount * 0.42
    rig.arms[0].rotation.z += amount * 0.85
    rig.arms[1].rotation.z -= amount * 0.7
    rig.knees[1].rotation.x += amount * 0.95
  }
}

export function wakeupMotion(progress: number): HumanMotion {
  const amount = 1 - ease(progress)
  return (rig) => {
    rig.figure.rotation.z += amount * 1.15
    rig.figure.position.y -= amount * 0.24
    rig.knees.forEach((knee) => (knee.rotation.x += amount * 0.7))
    rig.arms[0].rotation.z += amount * 0.55
  }
}

export function throwTechMotion(side: FightSide): HumanMotion {
  const direction = side === 'player' ? 1 : -1
  return (rig) => {
    rig.figure.rotation.y += direction * 0.42
    rig.figure.rotation.x -= 0.12
    rig.arms.forEach((arm, index) => {
      arm.rotation.x -= 0.8
      arm.rotation.z += (index === 0 ? 1 : -1) * 0.42
    })
    rig.legs[direction > 0 ? 0 : 1].rotation.x += 0.45
  }
}

export function isThrowTech(state: FightState): boolean {
  return Boolean(
    state.throwTech && state.frame - state.throwTech.frame < THROW_TECH_RECOVERY_FRAMES,
  )
}

function reactByZone(rig: AnimatedHuman, zone: FightNenZone, amount: number): void {
  if (zone === 'head') {
    rig.head.rotation.x -= 0.62 * amount
    rig.head.rotation.z += 0.38 * amount
    rig.figure.rotation.x += 0.16 * amount
    return
  }
  if (zone === 'feet') {
    rig.figure.rotation.z += 0.32 * amount
    rig.figure.position.y -= 0.16 * amount
    rig.knees[0].rotation.x += 0.92 * amount
    rig.legs[1].rotation.x -= 0.38 * amount
    return
  }
  rig.figure.rotation.x += (zone === 'torso' ? 0.42 : 0.25) * amount
  rig.figure.position.x += 0.15 * amount
  rig.arms[0].rotation.z += 0.48 * amount
  rig.arms[1].rotation.z -= 0.4 * amount
}

function ease(value: number): number {
  const x = Math.min(1, Math.max(0, value))
  return x * x * (3 - 2 * x)
}
