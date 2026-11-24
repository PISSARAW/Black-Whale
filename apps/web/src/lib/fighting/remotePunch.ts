import { commitProjectileNen } from './nenProjectiles'
import { attackData, attackPhase, otherSide } from './frameData'
import { remotePunchGrounded, remotePunchTargetX, usesRemotePunch } from './leorioAttack'
import type { FightProjectile, FightSide, FightState } from './types'
import {
  REMOTE_PUNCH_HEIGHT,
  REMOTE_PUNCH_RISE_FRAMES,
  REMOTE_PUNCH_VISIBLE_FRAMES,
} from './remotePunchTiming'

/** Aim once when the knuckles hit the floor. Travel timing is an arcade abstraction. */
export function spawnRemotePunch(state: FightState, side: FightSide): FightState {
  const fighter = state[side]
  const attack = fighter.attack
  if (!attack || attack.projectileSpawned || attackPhase(fighter) !== 'active') return state
  if (!usesRemotePunch(fighter) || !remotePunchGrounded(fighter)) return state
  const data = attackData(attack.kind, fighter)
  const originX = fighter.x + fighter.facing * 3
  const targetXPosition = remotePunchTargetX(state[otherSide(side)])
  const distance = Math.max(
    0,
    Math.min(data.box.right, (targetXPosition - originX) * fighter.facing),
  )
  const targetX = Math.max(2, Math.min(98, originX + fighter.facing * distance))
  const travelFrames = Math.max(12, Math.ceil(distance / 2))
  const projectile: FightProjectile = {
    id: state.nextProjectileId,
    owner: side,
    fighterId: 'leorio',
    x: originX,
    y: -3,
    velocityX: 0,
    width: 1.6,
    height: 1.5,
    damage: data.damage,
    hitstun: data.hitstun,
    blockstun: data.blockstun,
    hitstop: data.hitstop,
    knockback: data.knockback,
    targetZone: 'head',
    shape: 'remote-fist',
    colour: '#bcecff',
    matter: 'nen',
    canHitDowned: Boolean(attack.accel),
    age: 0,
    lifetime: travelFrames + REMOTE_PUNCH_VISIBLE_FRAMES,
    remotePunch: { originX, targetX, travelFrames, struck: false },
  }
  return {
    ...state,
    [side]: { ...fighter, attack: { ...attack, impacted: true, projectileSpawned: true } },
    projectiles: [...state.projectiles, commitProjectileNen(projectile, fighter)],
    nextProjectileId: state.nextProjectileId + 1,
  }
}

export function advanceRemotePunch(projectile: FightProjectile): FightProjectile {
  const remote = projectile.remotePunch!
  const age = projectile.age + 1
  const progress = Math.min(1, age / remote.travelFrames)
  const emerging = age - remote.travelFrames
  return {
    ...projectile,
    age,
    x: remote.originX + (remote.targetX - remote.originX) * progress,
    y: emerging < 0 ? -3 : Math.min(REMOTE_PUNCH_HEIGHT, emerging * 2),
  }
}

export function remotePunchCanHit(projectile: FightProjectile): boolean {
  const remote = projectile.remotePunch
  if (!remote) return true
  const emerging = projectile.age - remote.travelFrames
  const rise = projectile.canHitDowned ? 1 : REMOTE_PUNCH_RISE_FRAMES
  return !remote.struck && emerging >= rise && emerging < 8
}
