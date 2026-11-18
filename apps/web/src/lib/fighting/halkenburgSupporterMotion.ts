import { arenaObjects } from './arenaActions'
import { liveEntity } from './preparationWorld'
import type { PreparedEntity } from './preparationTypes'
import type { FightState } from './types'

/** Ordinary movement in the support row, never a transfer of the victim's Hatsu. */
export function advanceHalkenburgSupporter(
  state: FightState,
  entry: PreparedEntity,
): PreparedEntity {
  const passenger = entry.halkenburgPassenger
  if (!passenger || entry.sleepingFrames || entry.controller || !liveEntity(entry)) return entry
  const direction = passenger.motion === 'right' ? 1 : passenger.motion === 'left' ? -1 : 0
  if (!direction) return entry
  const x = Math.max(0, Math.min(100, entry.x + direction * 0.3))
  return supporterObstacle(state, entry, x) ? entry : { ...entry, x }
}
function supporterObstacle(state: FightState, entry: PreparedEntity, x: number): boolean {
  return arenaObjects(state).some(
    (other) =>
      other.id !== entry.id &&
      Math.abs(other.x - x) < other.arena!.width + 1 &&
      entry.y < other.y + other.arena!.height &&
      entry.y + 12 > other.y,
  )
}
