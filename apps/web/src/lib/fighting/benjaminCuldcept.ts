import { benjaminMoveAvailable, benjaminNenActive } from './benjaminBaton'
import { attackPhase } from './frameData'
import type { ProjectileHit } from './projectiles'
import type { ArcadeFighter, FightSide, FightState } from './types'

/**
 * Duel abstraction: the charged rectangle stores one incoming Nen projectile as
 * a playable card, not its owner's entire Hatsu. Canon leaves capture conditions
 * unknown; ordinary bullets and Halkenburg's piercing arrow are never acquired.
 */
export function captureCuldceptProjectile(
  state: FightState,
  hit: ProjectileHit,
): FightState | null {
  const fighter = state[hit.defenderSide]
  const baton = fighter.hatsuEffects.baton
  if (!baton || baton.card || !benjaminMoveAvailable(fighter, 'benjamin:downSpecial')) return null
  if (fighter.attack?.moveId !== 'benjamin:downSpecial' || attackPhase(fighter) !== 'active')
    return null
  if (fighter.attack.hatsuSource !== 'benjamin' || !capturable(fighter, hit)) return null
  return {
    ...state,
    [hit.defenderSide]: {
      ...fighter,
      hatsuEffects: { ...fighter.hatsuEffects, baton: { ...baton, card: { ...hit.projectile } } },
    },
  }
}

function capturable(fighter: ArcadeFighter, hit: ProjectileHit): boolean {
  const projectile = hit.projectile
  return (
    projectile.matter === 'nen' &&
    projectile.fighterId !== 'halkenburg' &&
    !projectile.remotePunch &&
    projectile.velocityX * fighter.facing < 0 &&
    (projectile.x - fighter.x) * fighter.facing >= -projectile.width
  )
}

export function releaseCuldceptCard(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const baton = fighter.hatsuEffects.baton
  if (!baton?.card || !fighter.attack || fighter.attack.projectileSpawned) return state
  if (!benjaminNenActive(fighter)) return state
  const projectile = {
    ...baton.card,
    id: state.nextProjectileId,
    owner: side,
    x: fighter.x + fighter.facing * 3.4,
    y: fighter.y + 6.1,
    velocityX: Math.abs(baton.card.velocityX) * fighter.facing,
    age: 0,
  }
  return {
    ...state,
    [side]: {
      ...fighter,
      attack: { ...fighter.attack, impacted: true, projectileSpawned: true },
      hatsuEffects: { ...fighter.hatsuEffects, baton: { ...baton, card: null } },
    },
    projectiles: [...state.projectiles, projectile],
    nextProjectileId: state.nextProjectileId + 1,
  }
}
