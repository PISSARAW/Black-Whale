import { collideArenaBodies } from '../arenaSimulation'
import type { FightState } from '../types'

/** Physical damage and placement persist in a team set. Ordinary round Nen resets still apply. */
export function carryTeamTerrain(before: FightState, after: FightState): FightState {
  if (!before.arena || !after.arena || !after.battlefield) return after
  const physical = new Map(
    (before.battlefield?.entities ?? [])
      .filter((entry) => entry.arena && entry.material === 'real' && entry.owner === 'neutral')
      .map((entry) => [entry.id, entry]),
  )
  const entities = after.battlefield.entities.map((entry) => {
    const previous = physical.get(entry.id)
    return previous
      ? {
          ...entry,
          x: previous.x,
          y: previous.y,
          health: previous.health,
          present: previous.present,
        }
      : entry
  })
  const carried = { ...after, battlefield: { ...after.battlefield, entities } }
  return collideArenaBodies(after, carried)
}
