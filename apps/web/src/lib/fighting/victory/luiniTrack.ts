import { Vector3 } from 'three'
import type { VictoryContext } from './types'
import { ease } from './resources'

export const LUINI_TIMING = {
  anchor: 54,
  depart: 108,
  emerge: 120,
  return: 234,
  reappear: 246,
  open: 342,
  strike: 396,
  fall: 408,
  portrait: 486,
}
export function luiniLayout(context: VictoryContext) {
  const height = Math.max(context.hero.height, context.victim.height) + 0.3
  return {
    a: context.centre - 1.3,
    b: context.centre + 2.3,
    width: Math.max(1.15, Math.min(2, context.victim.width * 1.6 + 0.4)),
    height,
    handleY: Math.min(height * 0.5, context.victim.height * 0.67),
  }
}
export type LuiniLayout = ReturnType<typeof luiniLayout>
export function luiniTrack(age: number, layout: LuiniLayout) {
  const { a, b } = layout
  let x = a - 0.9 + ease((age - 72) / 36) * 0.5
  if (age >= 120 && age < 234) x = b + 0.3 - ease((age - 120) / 66) * 0.7
  if (age >= 234) x = a - 0.65 + ease((age - 366) / 30) * 0.12 + ease((age - 426) / 36) * 1.2
  const hidden = (age >= 108 && age < 120) || (age >= 234 && age < 246)
  const victimX = a + 1.5 - ease((age - 270) / 60) * 1.18
  const angle = 1.3 * ease((age - LUINI_TIMING.open) / 24)
  const turn = (Math.PI / 2) * (1 - 2 * ease((age - 270) / 42))
  return {
    x,
    hidden,
    victimX,
    victimFacing: turn,
    angle,
    portalsAllowed: age < 342,
    anchorLost: age > 342,
  }
}
export function luiniHandle(layout: LuiniLayout, angle: number) {
  return new Vector3(0.07, layout.handleY, layout.width * 0.75)
    .applyAxisAngle(new Vector3(0, 1, 0), angle)
    .add(new Vector3(layout.a, 0, -layout.width / 2))
}
