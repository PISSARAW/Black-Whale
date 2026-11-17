import { activeHitbox, attackData, attackPhase, boxesOverlap } from './frameData'
import { devicePosition } from './physicalDevices'
import { liveEntity, updateEntity } from './preparationWorld'
import type { PreparedEntity } from './preparationTypes'
import type { FightProjectile, FightSide, FightState } from './types'

function deviceBox(state: FightState, entry: PreparedEntity) {
  const point = devicePosition(state, entry)
  const height = entry.device?.form?.kind === 'cat' ? 4 : 2
  return { left: point.x - 1, right: point.x + 1, bottom: point.y, top: point.y + height }
}
function exposedDevice(entry: PreparedEntity, attacker: FightSide): boolean {
  return Boolean(
    entry.kind === 'device' &&
    entry.device &&
    liveEntity(entry) &&
    !entry.device.swallowed &&
    entry.device.carrier !== attacker,
  )
}
export function strikePhysicalDevices(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) next = strikeDevice(next, side)
  return next
}
function strikeDevice(state: FightState, side: FightSide): FightState {
  const fighter = state[side],
    attack = fighter.attack
  if (!attack || attack.impacted || attackPhase(fighter) !== 'active') return state
  const hitbox = activeHitbox(fighter)
  if (!hitbox) return state
  const target = state.battlefield?.entities.find(
    (entry) => exposedDevice(entry, side) && boxesOverlap(hitbox, deviceBox(state, entry)),
  )
  if (!target) return state
  const damaged = damageDevice(state, target, attackData(attack.kind, fighter).damage)
  return { ...damaged, [side]: { ...fighter, attack: { ...attack, impacted: true } } }
}
export function interceptDeviceProjectile(
  state: FightState,
  flight: { projectile: FightProjectile; previousX: number },
): { state: FightState; intercepted: boolean } {
  const { projectile, previousX } = flight
  const box = {
    left: Math.min(previousX, projectile.x) - projectile.width,
    right: Math.max(previousX, projectile.x) + projectile.width,
    bottom: projectile.y - projectile.height,
    top: projectile.y + projectile.height,
  }
  const target = state.battlefield?.entities.find(
    (entry) =>
      projectileCanStrikeDevice(entry, projectile) && boxesOverlap(box, deviceBox(state, entry)),
  )
  return target
    ? {
        state: damageDevice(state, target, projectile.damage * (projectile.nenPower ?? 1)),
        intercepted: true,
      }
    : { state, intercepted: false }
}
function damageDevice(state: FightState, entry: PreparedEntity, damage: number): FightState {
  const health = Math.max(0, entry.health - Math.max(0, damage))
  return updateEntity(state, entry.id, {
    health,
    device:
      health > 0
        ? entry.device
        : { ...entry.device!, form: undefined, transforming: undefined, recording: false },
  })
}

function projectileCanStrikeDevice(entry: PreparedEntity, projectile: FightProjectile): boolean {
  const origin = projectile.deviceOrigin
  if (origin && entry.id === origin.id && projectile.owner === origin.owner && projectile.age <= 2)
    return false
  return exposedDevice(entry, projectile.owner)
}
