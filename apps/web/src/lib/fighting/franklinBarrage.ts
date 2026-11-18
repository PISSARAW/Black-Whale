import { witnessedHatsuState } from './nenWitness'
import { commitProjectileNen } from './nenProjectiles'
import { attackPhase, boxesOverlap, hurtboxes, otherSide } from './frameData'
import { franklinNenAvailable, franklinSalvo, franklinShotAt } from './franklinAttack'
import type { ArcadeFighter, FightProjectile, FightSide, FightState } from './types'

/** Emit one travelling bullet at a time, alternating hands and cycling all ten fingers. */
export function spawnFranklinBarrage(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const shot = franklinShotAt(fighter)
  if (shot === null || !canKeepFiring(fighter)) return state
  const attack = fighter.attack!
  if (shot !== (attack.projectilesSpawned ?? 0)) return state
  const projectile = checkMuzzlePath(
    state,
    makeBullet({ fighter, shot, side, id: state.nextProjectileId }),
  )
  const witnessSide = otherSide(side)
  const witness = state[witnessSide]
  return {
    ...state,
    [witnessSide]: {
      ...witness,
      hatsuEffects: {
        ...witness.hatsuEffects,
        ...witnessedHatsuState(state, { side, source: 'franklin' }),
      },
    },
    [side]: {
      ...fighter,
      attack: {
        ...attack,
        impacted: true,
        projectileSpawned: true,
        projectilesSpawned: shot + 1,
      },
    },
    projectiles: [...state.projectiles, commitProjectileNen(projectile, fighter)],
    nextProjectileId: state.nextProjectileId + 1,
  }
}

function canKeepFiring(fighter: ArcadeFighter): boolean {
  return (
    franklinNenAvailable(fighter) &&
    fighter.hitStun === 0 &&
    fighter.blockStun === 0 &&
    !fighter.hanzoProjection &&
    attackPhase(fighter) === 'active'
  )
}

function makeBullet(options: {
  fighter: ArcadeFighter
  shot: number
  side: FightSide
  id: number
}): FightProjectile {
  const { fighter, shot, side, id } = options
  const salvo = franklinSalvo(fighter)
  const hand = shot % 2
  const finger = Math.floor(shot / 2) % 5
  const low = salvo.height < 4
  const direction = fighter.franklinAim === 'split' && hand === 0 ? -fighter.facing : fighter.facing
  const sweep = fighter.franklinAim === 'sweep' ? [2.5, 6, 10.1, 6][shot % 4] : salvo.height
  return {
    id,
    owner: side,
    fighterId: 'franklin',
    x: fighter.x + direction * (hand === 0 ? 5.3 : 9.5),
    y: fighter.y + sweep + (hand === 0 ? -0.05 : 0.05) + (finger - 2) * 0.025,
    velocityX: direction * 82,
    width: 0.45,
    height: 0.18,
    damage: salvo.damage,
    hitstun: 12,
    blockstun: 8,
    hitstop: 1,
    knockback: 0.35,
    targetZone: low || sweep < 4 ? 'feet' : 'torso',
    shape: 'bullet',
    colour: '#ef4444',
    matter: 'nen',
    age: 0,
    lifetime: 90,
  }
}

/** An opponent inside the outstretched arms is hit along the muzzle path, never skipped. */
function checkMuzzlePath(state: FightState, bullet: FightProjectile): FightProjectile {
  const fighter = state[bullet.owner]
  const ray = {
    left: Math.min(fighter.x, bullet.x),
    right: Math.max(fighter.x, bullet.x),
    bottom: bullet.y - bullet.height,
    top: bullet.y + bullet.height,
  }
  const contact = hurtboxes(state[otherSide(bullet.owner)]).find((box) => boxesOverlap(ray, box))
  if (!contact) return bullet
  const edge = bullet.velocityX > 0 ? contact.left : contact.right
  return { ...bullet, x: Math.max(ray.left, Math.min(ray.right, edge)) }
}
