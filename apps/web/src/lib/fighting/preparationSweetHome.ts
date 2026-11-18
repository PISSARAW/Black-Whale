import { attackPhase } from './frameData'
import { sweetHomeAvailable, sweetHomeContacts } from './sweetHomeContacts'
import { updateEntity } from './preparationWorld'
import { sweetHomeObjects } from './sweetHomeArsenal'
import { otherSide } from './frameData'
import type { FightSide, FightState } from './types'

/** Transfer the same wound to a real object actually touching the left hand. */
interface ObjectTransfer {
  before: FightState
  after: FightState
  source: FightSide
  explicitOnly?: boolean
}
export function transferWoundToObject(options: ObjectTransfer): FightState | null {
  const { source } = options
  for (const owner of [source, otherSide(source)]) {
    const result = transferAtHands({ ...options, owner })
    if (result) return result
  }
  return null
}

function transferAtHands(options: ObjectTransfer & { owner: FightSide }): FightState | null {
  const { before, after, source, owner } = options
  const fighter = before[owner]
  if (!objectTransferReady(options)) return null
  const object = sweetHomeObjects(before, owner).find(
    (entry) => !fighter.sweetHomeObject || entry.id === fighter.sweetHomeObject,
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
      objectTransfer: { objectId: object.id, owner, damage: impact.damage },
    },
  }
}

function objectTransferReady({
  before,
  source,
  owner,
  explicitOnly,
}: ObjectTransfer & { owner: FightSide }): boolean {
  const fighter = before[owner]
  if (
    !sweetHomeAvailable(before, owner) ||
    attackPhase(fighter) !== 'active' ||
    fighter.attack?.hatsuSource !== 'terebellum'
  )
    return false
  if (explicitOnly && !fighter.sweetHomeObject) return false
  return (
    owner === source ||
    Boolean(fighter.sweetHomeObject && sweetHomeContacts(before, owner)?.right === source)
  )
}
