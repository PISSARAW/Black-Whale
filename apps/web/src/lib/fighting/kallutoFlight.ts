import { commitProjectileNen } from './nenProjectiles'
import { travelFightProjectile } from './projectileFlight'
import { paperAvailable, paperZonePoint, hasPlantedPaper, selectedPaperZone } from './kallutoPaper'
import type { FightProjectile, FightSide, FightState } from './types'
import type { PaperCommand } from './kallutoPaper'

/** Paper is physical matter. Damage/speed/lifetime are duel tuning, never an explosive charge. */
export function launchKallutoPaper(
  state: FightState,
  side: FightSide,
  command: PaperCommand,
): FightState {
  const fighter = state[side]
  const zone = selectedPaperZone(fighter)
  const point = paperZonePoint(fighter, zone)
  const shot: FightProjectile = {
    id: state.nextProjectileId,
    owner: side,
    fighterId: 'kalluto',
    x: fighter.x + fighter.facing * 3.4,
    y: point.y,
    velocityX: fighter.facing * 66,
    width: command === 'serpent' ? 1 : 0.35,
    height: 0.3,
    damage: command === 'serpent' ? 18 : 4,
    hitstun: 16,
    blockstun: 8,
    hitstop: 4,
    knockback: 1.5,
    targetZone: zone,
    shape: 'card',
    colour: '#f4e9e5',
    matter: 'object',
    age: 0,
    lifetime: 120,
    concealed: fighter.attack?.concealed,
    kallutoPaper: command === 'serpent' ? 'serpent' : 'plant',
  }
  return {
    ...state,
    nextProjectileId: state.nextProjectileId + 1,
    projectiles: [...state.projectiles, commitProjectileNen(shot, fighter)],
    [side]: {
      ...fighter,
      attack: fighter.attack
        ? {
            ...fighter.attack,
            projectileSpawned: true,
            impacted: true,
          }
        : null,
    },
  }
}

/** A stream converges on its own embedded paper, not on arbitrary unmarked body parts. */
export function travelKallutoPaper(
  state: FightState,
  held: FightProjectile,
  step: number,
): FightProjectile {
  const shot = travelFightProjectile(held, step)
  if (
    held.kallutoPaper !== 'serpent' ||
    !paperAvailable(state[held.owner]) ||
    !hasPlantedPaper(state, held.owner, held.targetZone)
  )
    return shot
  const target = held.owner === 'player' ? 'opponent' : 'player'
  const point = paperZonePoint(state[target], held.targetZone)
  const dx = point.x - held.x
  const dy = point.y - held.y
  const distance = Math.hypot(dx, dy)
  const travel = Math.min(distance, 66 * step)
  return {
    ...shot,
    x: held.x + (dx / (distance || 1)) * travel,
    y: held.y + (dy / (distance || 1)) * travel,
    velocityX: Math.sign(dx || held.velocityX) * 66,
  }
}

/** Only a landed physical fragment embeds paper. Guard, avoidance and ordinary punches never do. */
export function plantPaperAfterHit(state: FightState, shot: FightProjectile): FightState {
  const impact = state.impact
  if (
    shot.kallutoPaper !== 'plant' ||
    !impact ||
    impact.blocked ||
    impact.avoided ||
    impact.projectileId !== shot.id ||
    impact.transfer
  )
    return state
  const target = shot.owner === 'player' ? 'opponent' : 'player'
  if (hasPlantedPaper(state, shot.owner, shot.targetZone)) return state
  return {
    ...state,
    [target]: {
      ...state[target],
      plantedPaper: [
        ...(state[target].plantedPaper ?? []),
        { owner: shot.owner, zone: shot.targetZone },
      ],
    },
  }
}
