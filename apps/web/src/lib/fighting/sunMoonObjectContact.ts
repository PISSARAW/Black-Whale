import { objectMarkPoint, MARK_CONTACT_TOLERANCE } from './sunMoonMarkPoint'
import { hurtboxes } from './frameData'
import type { PreparedEntity } from './preparationTypes'
import type { ArcadeFighter } from './types'

/** The signs themselves must touch; overlapping unmarked faces do not detonate. */
export function markedObjectsTouch(first: PreparedEntity, second: PreparedEntity): boolean {
  const sun = objectMarkPoint(first, 'sun'),
    moon = objectMarkPoint(second, 'moon')
  return Boolean(
    sun && moon && Math.hypot(sun.x - moon.x, sun.y - moon.y) <= MARK_CONTACT_TOLERANCE,
  )
}
export function objectMarkContact(
  first: PreparedEntity,
  second: PreparedEntity,
): { x: number; y: number } {
  const sun = objectMarkPoint(first, 'sun')!,
    moon = objectMarkPoint(second, 'moon')!
  return { x: (sun.x + moon.x) / 2, y: (sun.y + moon.y) / 2 }
}
export function markedBlastTouches(
  body: ArcadeFighter,
  centre: { x: number; y: number },
  radius = 12,
): boolean {
  return hurtboxes(body).some((box) => {
    const x = Math.max(box.left, Math.min(box.right, centre.x))
    const y = Math.max(box.bottom, Math.min(box.top, centre.y))
    return Math.hypot(x - centre.x, y - centre.y) <= radius
  })
}
