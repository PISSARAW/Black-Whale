import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'

export const VOCONTE_TRANSITS = [90, 156, 246] as const
export const VOCONTE_FALL = 186
export const VOCONTE_LANDING = 342

export function voconteLayout(context: VictoryContext) {
  const width = Math.max(1, Math.min(1.4, context.victim.width + 0.45))
  return {
    a: context.centre - 1.8,
    b: context.centre + 0.8,
    width,
    height: Math.max(context.hero.height, context.victim.height) + 0.35,
    elevation: Math.max(context.hero.height, context.victim.height) * 2.6,
    handleY: context.hero.height * 0.62,
  }
}
export type VoconteLayout = ReturnType<typeof voconteLayout>

export function voconteVictimTrack(age: number, layout: VoconteLayout) {
  if (age < 156)
    return {
      x: layout.a - 1.1 + ease((age - 60) / 96) * 1.1,
      y: 0,
      hidden: false,
      facing: 1.15,
      passage: 0,
    }
  return {
    x: layout.b + 0.14 + ease((age - 162) / 24) * 0.11,
    y: layout.elevation,
    hidden: age < 162,
    facing: 1.15,
    passage: 1,
  }
}
export function voconteHeroTrack(age: number, layout: VoconteLayout) {
  if (age < 90)
    return {
      x: layout.a - 0.1 * (1 - ease((age - 48) / 42)),
      y: 0,
      z: -layout.width * 0.35 * (1 - ease((age - 48) / 18)),
      hidden: false,
      passage: 0,
    }
  if (age < 96) return { x: layout.b + 0.14, y: layout.elevation, z: 0, hidden: true, passage: 1 }
  if (age < 246)
    return {
      x: layout.b + 0.14 * (1 - ease((age - 222) / 24)),
      y: layout.elevation,
      z: ease((age - 96) / 36) * layout.width * 0.85 * (1 - ease((age - 210) / 24)),
      hidden: false,
      passage: 1,
    }
  return {
    x: layout.a + 0.25 + ease((age - 252) / 48) * 0.3,
    y: 0,
    z: -ease((age - 252) / 48) * layout.width * 0.6,
    hidden: age < 252,
    passage: 2,
  }
}
export function voconteDoorAngle(age: number) {
  return 1.4 * ease(age / 42) * (1 - ease((age - 420) / 48))
}
export function voconteHandle(layout: VoconteLayout, angle: number) {
  return new Vector3(0.065, layout.handleY, layout.width * 0.3)
    .applyAxisAngle(new Vector3(0, 1, 0), angle)
    .add(new Vector3(layout.a, 0, -layout.width / 2))
}

export function voconteHeroFacing(age: number) {
  if (age < 48) return 0.8
  if (age < 96) return 1.15
  if (age < 210) return 1.15 + ease((age - 96) / 36) * 1.65
  if (age < 246) return 2.8 + ease((age - 210) / 24) * 1.4
  return 1.15 * (1 - ease((age - 300) / 48))
}

export function voconteHeroMoving(age: number) {
  return (age >= 48 && age < 96) || (age >= 210 && age < 300)
}
