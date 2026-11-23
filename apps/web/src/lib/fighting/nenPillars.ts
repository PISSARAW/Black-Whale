import { activeEnRadius, enContains } from './en/access'
import { hasBodyguardFirearm } from './bodyguardFirearms'
import { isBeyond } from './martialSpecialists'
import type { ArcadeFighter, FightState } from './types'

export const EN_STARTUP_BONUS = 2
export const REN_MALICE_RANGE = 2.5
export const REN_FEAR_STAGGER = 10
export const REN_FEAR_COOLDOWN = 180
export const REN_PRESSURE_BLOCKSTUN = 2
export const FIREARM_TEN_CHIP = 0.35
export const FIREARM_BODY_MEMORY_WEIGHT = 1.5
export const FIREARM_RELOAD_FRAMES = 24

declare module './types' {
  interface ArcadeFighter {
    enReflexActive?: boolean
    fearCooldownFrames?: number
    firearmAmmo?: number
    firearmReloadFrames?: number
  }
}

export function enTargetInside(state: FightState, side: 'player' | 'opponent'): boolean {
  const caster = state[side]
  const target = state[side === 'player' ? 'opponent' : 'player']
  return activeEnRadius(caster) > 0 && enContains(caster, target)
}

/** Updates En reflex state (1f transfer + -2f startup) and Ren Malice fear stagger. */
export function advanceNenPillars(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const f = next[side]
    const inside = enTargetInside(next, side)
    const cooldown = Math.max(0, (f.fearCooldownFrames ?? 0) - 1) || undefined
    const reload = advanceReload(f)
    if (Boolean(f.enReflexActive) !== inside || cooldown !== f.fearCooldownFrames || reload !== f) {
      next = {
        ...next,
        [side]: {
          ...reload,
          enReflexActive: inside || undefined,
          fearCooldownFrames: cooldown,
        },
      }
    }
  }
  next = applyRenMalice(next, 'player', 'opponent')
  return applyRenMalice(next, 'opponent', 'player')
}

function applyRenMalice(
  state: FightState,
  attackerSide: 'player' | 'opponent',
  targetSide: 'player' | 'opponent',
): FightState {
  const attacker = state[attackerSide]
  const target = state[targetSide]
  if (attacker.nen.mode !== 'ren' || attacker.nen.en || attacker.nen.ko) return state
  const maliceRange = isBeyond(attacker) ? REN_MALICE_RANGE * 2 : REN_MALICE_RANGE
  if (Math.abs(attacker.x - target.x) > maliceRange) return state
  if ((target.fearCooldownFrames ?? 0) > 0 || target.health <= 0) return state
  const vulnerable =
    target.nen.mode === 'zetsu' ||
    target.auraExhausted ||
    (target.nenPsychology?.apprehension ?? 0) >= 2000
  if (!vulnerable) return state
  return {
    ...state,
    [targetSide]: {
      ...target,
      hitStun: Math.max(target.hitStun, REN_FEAR_STAGGER),
      attack: null,
      bufferedAttack: null,
      fearCooldownFrames: REN_FEAR_COOLDOWN,
    },
  }
}

export function firearmCapacity(fighter: Pick<ArcadeFighter, 'id'>): number {
  if (fighter.id === 'benjamin') return 3
  if (fighter.id === 'theta' || fighter.id === 'camilla' || hasBodyguardFirearm(fighter.id)) return 6
  return 0
}

export function firearmCanShoot(fighter: ArcadeFighter): boolean {
  if ((fighter.firearmReloadFrames ?? 0) > 0) return false
  return fighter.firearmAmmo === undefined || fighter.firearmAmmo > 0
}

export function spendFirearmRound(fighter: ArcadeFighter): ArcadeFighter {
  if (fighter.firearmAmmo === undefined) return fighter
  return { ...fighter, firearmAmmo: Math.max(0, fighter.firearmAmmo - 1) }
}

export function startFirearmReload(fighter: ArcadeFighter): ArcadeFighter {
  const cap = firearmCapacity(fighter)
  if (cap === 0 || (fighter.firearmReloadFrames ?? 0) > 0) return fighter
  if ((fighter.firearmAmmo ?? cap) >= cap) return fighter
  return { ...fighter, firearmReloadFrames: FIREARM_RELOAD_FRAMES }
}

function advanceReload(fighter: ArcadeFighter): ArcadeFighter {
  const frames = fighter.firearmReloadFrames ?? 0
  if (frames <= 0) return fighter
  if (frames === 1) {
    return { ...fighter, firearmReloadFrames: undefined, firearmAmmo: firearmCapacity(fighter) }
  }
  return { ...fighter, firearmReloadFrames: frames - 1 }
}

/** Black Whale firearm rule: Ten takes 35% chip; Ken or Defensive Ko completely negates chip & Body Memory. */
export function firearmGuardFactor(defender: ArcadeFighter, blocked: boolean): number {
  if (!blocked) return 1
  if (defender.nen.ken || defender.nen.ko) return 0
  return FIREARM_TEN_CHIP
}
