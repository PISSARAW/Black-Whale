import { advanceProjectileNen } from './nenProjectiles'
import { advanceRemotePunch } from './remotePunch'
import type { FightProjectile } from './types'

/** Travel precedes interception, then body collisions. Keep each projectile's own lifecycle. */
export function travelFightProjectile(held: FightProjectile, step: number): FightProjectile {
  return advanceProjectileNen(
    held.remotePunch
      ? advanceRemotePunch(held)
      : { ...held, x: held.x + held.velocityX * step, age: held.age + 1 },
  )
}

export function keepFightProjectile(projectile: FightProjectile, collided: boolean): boolean {
  return (
    (!collided || Boolean(projectile.remotePunch) || Boolean(projectile.gumFlight)) &&
    projectile.age < projectile.lifetime &&
    projectile.x > 2 &&
    projectile.x < 98
  )
}
