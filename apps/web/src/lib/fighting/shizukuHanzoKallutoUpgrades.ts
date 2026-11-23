import { FIGHT_FPS } from './fightClock'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const BLINKY_VACUUM_RANGE = 16
export const BLINKY_HEMORRHAGE_HP_DPS = 7
export const BLINKY_HEMORRHAGE_AURA_DPS = 9
export const KALLUTO_CONFETTI_RADIUS = 10
export const KALLUTO_CONFETTI_CUT_THRESHOLD = 3

export interface KallutoConfettiZone {
  owner: FightSide
  x: number
  radius: number
}

export interface KallutoListeningDoll {
  owner: FightSide
  x: number
  active: boolean
}

declare module './types' {
  interface ArcadeFighter {
    shizukuSwallowed?: string
    confettiCuts?: number
  }
  interface FightState {
    kallutoConfetti?: KallutoConfettiZone
    kallutoDoll?: KallutoListeningDoll
  }
}

/** Shizuku 5S: Blinky swallows non-living, non-Nen physical projectiles and confetti (rejects Shu/Nen & living Biohazard). */
export function blinkySwallowNonNen(state: FightState, side: FightSide): FightState {
  const shizuku = state[side]
  let swallowed = shizuku.shizukuSwallowed
  const kept = state.projectiles.filter((p) => {
    const inRange = Math.abs(p.x - shizuku.x) <= BLINKY_VACUUM_RANGE
    const nenCharged = Boolean(p.shuCharged || p.nenInvestment)
    const nonNen = !nenCharged && Boolean(p.physical || p.id.includes('confetti') || p.id.includes('item'))
    if (p.owner !== side && inRange && nonNen) {
      swallowed = p.id
      return false
    }
    return true
  })
  const confettiCleared =
    state.kallutoConfetti &&
    state.kallutoConfetti.owner !== side &&
    Math.abs(state.kallutoConfetti.x - shizuku.x) <= BLINKY_VACUUM_RANGE
  if (confettiCleared) swallowed = 'kalluto-confetti'
  return {
    ...state,
    projectiles: kept,
    kallutoConfetti: confettiCleared ? undefined : state.kallutoConfetti,
    [side]: { ...shizuku, shizukuSwallowed: swallowed },
  }
}

/** Shizuku 6S: spits out the last swallowed object as a fast physical projectile. */
export function blinkySpitLastSwallowed(state: FightState, side: FightSide): FightState {
  const shizuku = state[side]
  if (!shizuku.shizukuSwallowed) return state
  const shot = {
    id: `blinky-spit:${shizuku.shizukuSwallowed}:${state.frame}`,
    owner: side,
    x: shizuku.x + shizuku.facing * 4,
    y: Math.max(4, shizuku.y + 4),
    vx: shizuku.facing * 2.2,
    vy: 0,
    radius: 2.2,
    damage: 11,
    knockback: 4,
    hitstun: 14,
    blockstun: 10,
    age: 0,
    lifetime: 70,
    physical: true,
    zone: 'torso' as const,
  }
  return {
    ...state,
    projectiles: [...state.projectiles, shot],
    [side]: { ...shizuku, shizukuSwallowed: undefined },
  }
}

/** Shizuku 2S: drains both HP and aura remotely if the opponent has an unplugged open wound. */
export function applyBlinkyForcedHemorrhage(state: FightState, side: FightSide): FightState {
  const foeSide: FightSide = side === 'player' ? 'opponent' : 'player'
  const foe = state[foeSide]
  if ((foe.openWounds ?? 0) <= 0 || foe.health <= 0) return state
  return {
    ...state,
    [foeSide]: {
      ...foe,
      health: Math.max(0, foe.health - BLINKY_HEMORRHAGE_HP_DPS / FIGHT_FPS),
      aura: Math.max(0, foe.aura - BLINKY_HEMORRHAGE_AURA_DPS / FIGHT_FPS),
    },
  }
}

/** Hanzo Skill 4: astral double ignores ordinary physical blows in Ten (requires Hatsu, Ko, or Ren). */
export function hanzoDoubleIgnoresTenPhysical(
  attacker: ArcadeFighter,
  defender: ArcadeFighter,
): boolean {
  if (!defender.hanzoProjection) return false
  const isNormalPhysical = attacker.attack?.kind === 'light' || attacker.attack?.kind === 'heavy'
  if (!isNormalPhysical || attacker.attack?.hatsuSource) return false
  return attacker.nen.mode !== 'ren' && !attacker.nen.ko
}

/** Hanzo's astral double can cross through standard guard to strike from behind. */
export function hanzoDoubleCrossUp(attacker: ArcadeFighter): boolean {
  return Boolean(attacker.hanzoProjection)
}

/** Kalluto 2S: scatters razor confetti on the arena floor. */
export function scatterKallutoConfetti(state: FightState, side: FightSide): FightState {
  const kalluto = state[side]
  const x = Math.max(10, Math.min(90, kalluto.x + kalluto.facing * 8))
  return { ...state, kallutoConfetti: { owner: side, x, radius: KALLUTO_CONFETTI_RADIUS } }
}

/** Kalluto 4S: deploys a listening paper doll that reveals Seiyaku and negates In aura hiding. */
export function deployKallutoListeningDoll(state: FightState, side: FightSide): FightState {
  const kalluto = state[side]
  return { ...state, kallutoDoll: { owner: side, x: kalluto.x, active: true } }
}

export function kallutoDollRevealsOpponent(state: FightState, kallutoSide: FightSide): boolean {
  const canonicalDoll = Boolean(state[kallutoSide].kallutoPaper?.doll?.active)
  return Boolean(
    canonicalDoll || (state.kallutoDoll?.active && state.kallutoDoll.owner === kallutoSide),
  )
}

export function advanceShizukuHanzoKallutoUpgrades(state: FightState): FightState {
  if (state.phase !== 'fighting' || !state.kallutoConfetti) return state
  const zone = state.kallutoConfetti
  const foeSide: FightSide = zone.owner === 'player' ? 'opponent' : 'player'
  const foe = state[foeSide]
  const inConfetti = Math.abs(foe.x - zone.x) <= zone.radius && foe.y === 0
  if (!inConfetti || !foe.motion) return state
  const cuts = (foe.confettiCuts ?? 0) + 1
  if (cuts >= KALLUTO_CONFETTI_CUT_THRESHOLD) {
    return {
      ...state,
      [foeSide]: { ...foe, confettiCuts: 0, openWounds: (foe.openWounds ?? 0) + 1 },
    }
  }
  return { ...state, [foeSide]: { ...foe, confettiCuts: cuts } }
}
