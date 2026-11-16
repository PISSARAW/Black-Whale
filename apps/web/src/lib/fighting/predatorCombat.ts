import { activeHitbox, boxesOverlap, type FightBox } from './frameData'
import { FIXED_STEP } from './fightClock'
import type { FightSide, FightState, FightProjectile } from './types'

/** Predator has no immunity: in the duel, one connecting blow dispels the hunter. */
export function resolvePredatorThreats(state: FightState): FightState {
  return threaten(threaten(state, 'player'), 'opponent')
}

function threaten(state: FightState, owner: FightSide): FightState {
  const hunt = state[owner].predator?.hunt
  if (!hunt) return state
  const enemy = owner === 'player' ? 'opponent' : 'player'
  const box: FightBox = {
    left: hunt.x - 2,
    right: hunt.x + 2,
    bottom: hunt.y - 2.5,
    top: hunt.y + 2.5,
  }
  const strike = activeHitbox(state[enemy])
  if (strike && !state[enemy].attack?.impacted && boxesOverlap(strike, box)) {
    const attacker = state[enemy]
    return {
      ...dispel(state, owner),
      [enemy]: {
        ...attacker,
        attack: { ...attacker.attack!, impacted: true, confirmedHit: false },
      },
    }
  }
  const shot = state.projectiles.find(
    (projectile) => projectile.owner === enemy && crossesHunter(projectile, box),
  )
  return shot
    ? {
        ...dispel(state, owner),
        projectiles: state.projectiles.filter((projectile) => projectile.id !== shot.id),
      }
    : state
}

function crossesHunter(projectile: FightProjectile, box: FightBox): boolean {
  if (projectile.remotePunch) return false
  const nextX = projectile.x + projectile.velocityX * FIXED_STEP
  return boxesOverlap(box, {
    left: Math.min(projectile.x, nextX) - projectile.width / 2,
    right: Math.max(projectile.x, nextX) + projectile.width / 2,
    bottom: projectile.y - projectile.height / 2,
    top: projectile.y + projectile.height / 2,
  })
}

function dispel(state: FightState, owner: FightSide): FightState {
  const fighter = state[owner]
  return {
    ...state,
    [owner]: { ...fighter, predator: { ...fighter.predator!, hunt: null, watching: false } },
  }
}
