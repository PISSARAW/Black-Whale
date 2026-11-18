import { hurtboxes } from './frameData'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter } from './types'

/** Collision tolerance and blast radius are duel calibration, not manga measurements. */
const CONTACT_TOLERANCE = 0.15
export function markedObjectsTouch(first: PreparedEntity, second: PreparedEntity): boolean {
  const a = first.arena!,
    b = second.arena!
  return (
    Math.abs(first.x - second.x) <= a.width + b.width + CONTACT_TOLERANCE &&
    first.y <= second.y + b.height + CONTACT_TOLERANCE &&
    second.y <= first.y + a.height + CONTACT_TOLERANCE
  )
}
export function objectMarkContact(
  first: PreparedEntity,
  second: PreparedEntity,
): { x: number; y: number } {
  const a = first.arena!,
    b = second.arena!
  return {
    x:
      (Math.max(first.x - a.width, second.x - b.width) +
        Math.min(first.x + a.width, second.x + b.width)) /
      2,
    y: (Math.max(first.y, second.y) + Math.min(first.y + a.height, second.y + b.height)) / 2,
  }
}
export function markedBlastTouches(body: ArcadeFighter, centre: { x: number; y: number }): boolean {
  return hurtboxes(body).some((box) => {
    const x = Math.max(box.left, Math.min(box.right, centre.x))
    const y = Math.max(box.bottom, Math.min(box.top, centre.y))
    return Math.hypot(x - centre.x, y - centre.y) <= 12
  })
}
