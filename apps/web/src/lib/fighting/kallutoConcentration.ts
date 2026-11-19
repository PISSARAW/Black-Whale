import { ownedPaperScatters } from './kallutoScatter'
import { activePaperOwner } from './kallutoSurveillance'
import { historicalPartExists } from './historicalCopyLifetime'
import { createPaperShot } from './kallutoPaperShot'
import { commitPaperScatter } from './kallutoScatterFlight'
import { commitProjectileNen } from './nenProjectiles'
import { unpackStoredPaper } from './kallutoStoredPaper'
import type { FightSide, FightState } from './types'

/** Concentrate the available physical clouds together, sharing one attack's damage budget. */
export function concentratePaperScatters(state: FightState, side: FightSide): FightState | null {
  state = unpackStoredPaper(state, side)
  const scatters = ownedPaperScatters(state, activePaperOwner(state, side)).filter(
    (entry) =>
      entry.present &&
      entry.health > 0 &&
      historicalPartExists(state, entry.paperScatter!.materialCopyId),
  )
  if (!scatters.length) return null
  let next = state
  for (const scatter of scatters) {
    const paper = scatter.paperScatter!
    const release = {
      state: next,
      scatter,
      reuse: true,
      part: { id: paper.paperId, materialCopyId: paper.materialCopyId },
    }
    const shot = commitProjectileNen(
      {
        ...createPaperShot(release, side, 'serpent'),
        damage: 18 / scatters.length,
      },
      next[side],
    )
    next = {
      ...commitPaperScatter(release, shot),
      nextProjectileId: shot.id + 1,
      projectiles: [...next.projectiles, shot],
    }
  }
  return next
}
