import { liveEntity, updateEntity } from './preparationWorld'
import type { FightProjectile, FightState } from './types'

/** A real shot may kill a small creature without generating a hit on a fighter. */
export function interceptSmallAnimalProjectile(
  state: FightState,
  path: { projectile: FightProjectile; previousX: number },
): { state: FightState; intercepted: boolean } {
  const shot = path.projectile
  if (shot.damage <= 0) return { state, intercepted: false }
  const animal = (state.battlefield?.entities ?? [])
    .filter((entry) => entry.kind === 'animal' && entry.material === 'real' && liveEntity(entry))
    .filter(
      (entry) =>
        entry.x >= Math.min(path.previousX, shot.x) - shot.width - 0.3 &&
        entry.x <= Math.max(path.previousX, shot.x) + shot.width + 0.3 &&
        Math.abs(entry.y + 0.2 - shot.y) <= shot.height + 0.3,
    )
    .sort((a, b) => Math.abs(a.x - path.previousX) - Math.abs(b.x - path.previousX))[0]
  if (!animal) return { state, intercepted: false }
  return {
    state: updateEntity(state, animal.id, { health: Math.max(0, animal.health - shot.damage) }),
    intercepted: true,
  }
}
