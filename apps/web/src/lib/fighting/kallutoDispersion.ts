import { commitProjectileNen } from './nenProjectiles'
import { createPaperShot } from './kallutoPaperShot'
import { commitPaperScatter, type PaperRelease } from './kallutoScatterFlight'
import { newPaperScatter } from './kallutoScatter'
import { paperAbilityAvailable } from './kallutoAccess'
import { physicalBodyAt } from './fightBodyIdentity'
import { activePaperOwner } from './kallutoSurveillance'
import { selectedPaperZone } from './kallutoPaper'
import { airbornePaperFragments } from './kallutoAirborne'
import type { FightProjectile, FightSide, FightState } from './types'

declare module './types' {
  interface FightProjectile {
    /** Three paths divide one finite packet; trajectory count is duel tuning. */
    paperFanLane?: number
  }
}

export function dispersePaper(released: PaperRelease, side: FightSide): FightState {
  let next = released.state
  for (const [index, lane] of [-1, 0, 1].entries()) {
    const part = {
      ...released.part,
      id: index ? `${released.part.id}:path:${index}` : released.part.id,
    }
    const scatter = newPaperScatter(released.state, side, part)
    const release = {
      ...released,
      state: next,
      part,
      scatter: { ...scatter, health: scatter.health / 3 },
    }
    const shot = commitProjectileNen(
      {
        ...createPaperShot(release, side, 'plant'),
        id: next.nextProjectileId,
        paperFanLane: lane,
        damage: 4 / 3,
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

/** Actual airborne paper can be redirected; no fresh stock or paper is introduced. */
export function regatherFlyingPaper(state: FightState, side: FightSide): FightState | null {
  const own = airbornePaperFragments(state, side)
  if (!own.length) return null
  const ids = new Set(own.map((shot) => shot.id))
  return {
    ...state,
    projectiles: state.projectiles.map((shot) =>
      ids.has(shot.id)
        ? {
            ...shot,
            kallutoPaper: 'serpent',
            paperFanLane: undefined,
            damage: 18 / own.length,
            targetZone: selectedPaperZone(state[side]),
            paperTarget: activePaperOwner(state, side === 'player' ? 'opponent' : 'player'),
            age: 0,
          }
        : shot,
    ),
  }
}

export function dispersePaperFlight(
  state: FightState,
  shot: FightProjectile,
  step: number,
): FightProjectile {
  if (shot.kallutoPaper !== 'plant' || !shot.paperFanLane) return shot
  const owner = shot.paperOwner ?? activePaperOwner(state, shot.owner)
  const actor = physicalBodyAt(state, owner.owner, owner.member)
  if (!actor || !paperAbilityAvailable(actor, 'plant')) return shot
  return { ...shot, y: shot.y + shot.paperFanLane * 12 * step }
}
