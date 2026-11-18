import { commitProjectileNen } from './nenProjectiles'
import { travelFightProjectile } from './projectileFlight'
import { paperAvailable, paperZonePoint, hasPlantedPaper, selectedPaperZone } from './kallutoPaper'
import type { FightProjectile, FightSide, FightState } from './types'
import type { PaperCommand } from './kallutoPaper'

declare module './types' {
  interface FightProjectile {
    kallutoScatter?: { y: number; arc: number }
  }
}

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
  const scattered = scattersPaper(state, side, command)
  const shots = scattered
    ? [-3, 0, 3].map((arc, index) => ({
        ...shot,
        id: shot.id + index,
        damage: 2,
        kallutoScatter: { y: shot.y, arc },
      }))
    : regroupPaper(state, shot)
  const gathered =
    command === 'serpent'
      ? state.projectiles.filter((held) => held.owner !== side || !held.kallutoPaper)
      : state.projectiles
  return {
    ...state,
    nextProjectileId: state.nextProjectileId + shots.length,
    projectiles: [...gathered, ...shots.map((held) => commitProjectileNen(held, fighter))],
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

function scattersPaper(state: FightState, side: FightSide, command: PaperCommand): boolean {
  const fighter = state[side]
  return command === 'plant' && fighter.id === 'kalluto' && fighter.attack?.kind === 'special'
}

/** Regather already flying confetti at its real positions, without affecting another user's paper. */
function regroupPaper(state: FightState, shot: FightProjectile): FightProjectile[] {
  if (shot.kallutoPaper !== 'serpent') return [shot]
  const loose = state.projectiles.filter((held) => held.owner === shot.owner && held.kallutoPaper)
  if (!loose.length) return [shot]
  return loose.map((held, index) => ({
    ...shot,
    id: shot.id + index,
    x: held.x,
    y: held.y,
    damage: shot.damage / loose.length,
  }))
}

/** A stream converges on its own embedded paper, not on arbitrary unmarked body parts. */
export function travelKallutoPaper(
  state: FightState,
  held: FightProjectile,
  step: number,
): FightProjectile {
  let shot = travelFightProjectile(held, step)
  if (held.kallutoScatter && paperAvailable(state[held.owner])) {
    const { y, arc } = held.kallutoScatter
    shot = { ...shot, y: y + arc * Math.sin(Math.PI * Math.min(1, shot.age / 12)) }
  }
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
