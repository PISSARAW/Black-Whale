import { attackPhase } from './frameData'
import { sweetHomeAvailable, SWEET_HOME_HAND_REACH } from './sweetHomeContacts'
import { liveEntity, updateEntity } from './preparationWorld'
import type { FightSide, FightState } from './types'

/** Transfer the same wound to a real object actually touching the left hand. */
export function transferWoundToObject(
  before: FightState,
  after: FightState,
  source: FightSide,
): FightState | null {
  const fighter = before[source]
  if (
    !sweetHomeAvailable(before, source) ||
    attackPhase(fighter) !== 'active' ||
    fighter.attack?.hatsuSource !== 'terebellum'
  )
    return null
  const object = before.battlefield?.entities.find(
    (entry) =>
      entry.kind === 'crate' &&
      entry.material === 'real' &&
      liveEntity(entry) &&
      (entry.x - fighter.x) * fighter.facing >= 0 &&
      Math.abs(entry.x - fighter.x) <= SWEET_HOME_HAND_REACH &&
      fighter.y <= 4,
  )
  const impact = after.impact
  if (!object || !impact) return null
  const transferred = updateEntity(after, object.id, {
    health: Math.max(0, object.health - impact.damage),
  })
  return {
    ...transferred,
    [source]: { ...before[source], textureSurprise: after[source].textureSurprise },
    score: before.score,
    knockdowns: before.knockdowns,
    impact: {
      ...impact,
      damage: 0,
      points: 0,
      knockdown: false,
      objectTransfer: { objectId: object.id, owner: source, damage: impact.damage },
    },
  }
}
