import type { FightState } from './types'

/** Real cover occludes the segment between the lens/eyes and the observed body. */
export function priorityLineOfSight(
  state: FightState,
  ray: { x: number; y: number; targetX: number; targetY: number },
): boolean {
  const gap = ray.targetX - ray.x
  if (Math.abs(gap) < 0.001) return true
  return !(state.battlefield?.entities ?? []).some((entry) => {
    if (!entry.arena || !entry.present || entry.health <= 0) return false
    const fraction = (entry.x - ray.x) / gap
    if (fraction <= 0 || fraction >= 1) return false
    const y = ray.y + (ray.targetY - ray.y) * fraction
    return y >= entry.y && y <= entry.y + entry.arena.height
  })
}
