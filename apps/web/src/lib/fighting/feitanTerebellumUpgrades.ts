import { BODY_MEMORY_HIT_THRESHOLD, bodyMemoryWeak } from './bodyMemory'
import { FIGHT_FPS } from './fightClock'
import type { ArcadeFighter, FightSide, FightState } from './types'

export const RISING_SUN_THERMAL_DPS = 6
export const RISING_SUN_ZETSU_THERMAL_DPS = 16
export const TEREBELLUM_HOLD_FRAMES = 240 // 4 s

export interface SweetHomeStored {
  damage: number
  remainingFrames: number
}

declare module './types' {
  interface ArcadeFighter {
    sweetHomeStored?: SweetHomeStored
  }
}

/** Each limb weakened by Body Memory doubles Feitan's Pain Packer charge speed. */
export function feitanBodyMemoryChargeFactor(fighter: ArcadeFighter): number {
  let factor = 1
  if (bodyMemoryWeak(fighter, 'hands')) factor *= 2
  if (bodyMemoryWeak(fighter, 'feet')) factor *= 2
  return factor
}

/** Rising Sun forces Ken (-8 aura/s) in its zone; without Ken it burns, and in Zetsu it is lethal. */
function stepRisingSunThermal(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const sun = next[side].hatsuEffects.painPacker?.sun
    if (!sun) continue
    const foeSide: FightSide = side === 'player' ? 'opponent' : 'player'
    const foe = next[foeSide]
    if (foe.health <= 0 || foe.nen.ken) continue
    const dist = Math.hypot(foe.x - sun.x, foe.y - sun.y)
    if (dist > sun.radius) continue
    const dps = foe.nen.mode === 'zetsu' ? RISING_SUN_ZETSU_THERMAL_DPS : RISING_SUN_THERMAL_DPS
    const floor = next.mode === 'training' || next.formatId === 'heavens-arena' ? 1 : 0
    next = {
      ...next,
      [foeSide]: { ...foe, health: Math.max(floor, foe.health - dps / FIGHT_FPS) },
    }
  }
  return next
}

/** Terebellum 2S (Right hand): absorbs damage and holds it for 4s before self-detonating. */
export function absorbSweetHomeRightHand(fighter: ArcadeFighter, damage: number): ArcadeFighter {
  if (damage <= 0) return fighter
  const total = (fighter.sweetHomeStored?.damage ?? 0) + damage
  return {
    ...fighter,
    sweetHomeStored: { damage: total, remainingFrames: TEREBELLUM_HOLD_FRAMES },
  }
}

/** Terebellum 5S/6S (Left hand): transfers stored damage, a Body Memory zone, and systemic statuses. */
export function transferSweetHomeLeftHand(state: FightState, side: FightSide): FightState {
  const foeSide: FightSide = side === 'player' ? 'opponent' : 'player'
  const self = state[side]
  const foe = state[foeSide]

  const weakZone = bodyMemoryWeak(self, 'hands')
    ? 'hands'
    : bodyMemoryWeak(self, 'feet')
      ? 'feet'
      : null

  const selfBody =
    weakZone && self.bodyMemory
      ? { hits: { ...self.bodyMemory.hits, [weakZone]: 0 } }
      : self.bodyMemory
  const foeBody = weakZone
    ? { hits: { ...foe.bodyMemory?.hits, [weakZone]: BODY_MEMORY_HIT_THRESHOLD } }
    : foe.bodyMemory

  const stored = self.sweetHomeStored?.damage ?? 0
  const transferredWounds = self.openWounds ?? 0

  return {
    ...state,
    [side]: {
      ...self,
      sweetHomeStored: undefined,
      bodyMemory: selfBody,
      haikuBurn: undefined,
      openWounds: 0,
      tskPoisoned: false,
    },
    [foeSide]: {
      ...foe,
      health: Math.max(0, foe.health - stored),
      bodyMemory: foeBody,
      haikuBurn: foe.haikuBurn || self.haikuBurn,
      openWounds: (foe.openWounds ?? 0) + transferredWounds,
      tskPoisoned: foe.tskPoisoned || self.tskPoisoned,
    },
  }
}

function stepSweetHomeTimer(state: FightState): FightState {
  let next = state
  for (const side of ['player', 'opponent'] as const) {
    const f = next[side]
    if (!f.sweetHomeStored) continue
    const remaining = f.sweetHomeStored.remainingFrames - 1
    next = {
      ...next,
      [side]:
        remaining > 0
          ? { ...f, sweetHomeStored: { ...f.sweetHomeStored, remainingFrames: remaining } }
          : {
              ...f,
              health: Math.max(0, f.health - f.sweetHomeStored.damage),
              sweetHomeStored: undefined,
            },
    }
  }
  return next
}

export function advanceFeitanTerebellumUpgrades(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  return stepSweetHomeTimer(stepRisingSunThermal(state))
}
