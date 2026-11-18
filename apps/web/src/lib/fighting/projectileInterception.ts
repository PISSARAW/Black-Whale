import { interceptSmallAnimalProjectile } from './littleEyeImpact'
import { interceptDeviceProjectile } from './deviceImpact'
import { interceptArenaProjectile } from './arenaSimulation'
import { interceptBiohazardProjectile } from './biohazardImpact'
import { gumProjectileCanHit } from './bungeeProjectiles'
import type { FightState, FightProjectile } from './types'

export function interceptProjectileWorld(
  state: FightState,
  c: { projectile: FightProjectile; previousX: number },
) {
  const terrain = gumProjectileCanHit(c.projectile)
    ? interceptArenaProjectile(state, c.projectile, c.previousX)
    : { state, intercepted: false }
  if (terrain.intercepted) return { ...terrain, terrain: true }
  const body = interceptBiohazardProjectile(terrain.state, c)
  if (body.intercepted) return { ...body, terrain: false }
  const device = interceptDeviceProjectile(body.state, c)
  if (device.intercepted) return { ...device, terrain: false }
  return { ...interceptSmallAnimalProjectile(device.state, c), terrain: false }
}
