import { camillaRounds, spendCamillaRound } from './camillaWeapon'
import { projectileProfile } from './projectiles'
import { hasBodyguardFirearm } from './bodyguardFirearms'
import { commitProjectileNen } from './nenProjectiles'
import type { BiohazardDevice } from './legacyBiohazardDevices'
import type { ArcadeFighter, FightProjectile, FightSide, FightState } from './types'

declare module './types' {
  interface ArcadeFighter {
    /** A transformed real gun keeps the same magazine after reverting. */
    biohazardGunRounds?: number
    biohazardRecovery?: number
  }
}

export function hasBiohazardGun(fighter: ArcadeFighter): boolean {
  return hasBodyguardFirearm(fighter.id) || ['camilla', 'benjamin'].includes(fighter.id)
}
export function biohazardGunRounds(fighter: ArcadeFighter): number {
  return (fighter.nenOwner ?? fighter.id) === 'camilla'
    ? camillaRounds(fighter)
    : (fighter.biohazardGunRounds ?? 6)
}
export function spendBiohazardGunRound(fighter: ArcadeFighter): ArcadeFighter {
  if ((fighter.nenOwner ?? fighter.id) === 'camilla') return spendCamillaRound(fighter)
  return fighter.biohazardGunRounds === undefined
    ? fighter
    : { ...fighter, biohazardGunRounds: Math.max(0, fighter.biohazardGunRounds - 1) }
}

export function touchedBiohazardGun(state: FightState, side: FightSide): BiohazardDevice {
  const body = state[side]
  return {
    id: `weapon:${side}`,
    kind: 'gun',
    phase: 'carried',
    x: body.x,
    y: body.y + 6,
    frames: 0,
    life: 0,
    ammo: biohazardGunRounds(body),
    weaponSide: side,
    weaponId: body.id,
    gunProfile: projectileProfile(body.id),
  }
}

/** Only the barrel becomes a snake: its ammunition and ballistics remain physical. */
export function snakeBullet(
  state: FightState,
  side: FightSide,
  item: BiohazardDevice,
): FightProjectile {
  const profile = item.gunProfile ?? projectileProfile(item.weaponId ?? 'camilla')
  const direction = item.x <= state[side === 'player' ? 'opponent' : 'player'].x ? 1 : -1
  return commitProjectileNen(
    {
      id: state.nextProjectileId,
      owner: side,
      fighterId: item.weaponId ?? 'camilla',
      x: item.x,
      y: item.y,
      velocityX: direction * profile.speed,
      width: profile.width,
      height: profile.height,
      damage: profile.damage,
      hitstun: profile.hitstun,
      blockstun: profile.blockstun,
      hitstop: profile.hitstop,
      knockback: profile.knockback,
      targetZone: 'torso',
      guard: 'mid',
      shape: profile.shape,
      colour: profile.colour,
      matter: profile.matter,
      age: 0,
      lifetime: 120,
    },
    state[side],
  )
}
