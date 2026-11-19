import { activePaperOwner } from './kallutoSurveillance'
import { historicalPartExists } from './historicalCopyLifetime'
import type { FightProjectile, FightSide, FightState } from './types'

export function airbornePaperFragments(state: FightState, side: FightSide): FightProjectile[] {
  const body = activePaperOwner(state, side)
  return state.projectiles.filter((shot) => {
    if (shot.owner !== side || shot.kallutoPaper !== 'plant') return false
    const origin = shot.paperOwner ?? body
    return (
      origin.owner === body.owner &&
      origin.member === body.member &&
      historicalPartExists(state, shot.materialCopyId)
    )
  })
}
