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

/** Pain Packer records real injury without a Body Memory multiplier. */
export function feitanBodyMemoryChargeFactor(fighter: ArcadeFighter): number {
  void fighter
  return 1
}

/** Rising Sun damage is resolved by feitanSun; this layer adds no generic thermal DOT. */
function stepRisingSunThermal(state: FightState): FightState {
  return state
}

/** Sweet Home is resolved at impact through real right/left-hand contacts, never abstract storage. */
export function absorbSweetHomeRightHand(fighter: ArcadeFighter, damage: number): ArcadeFighter {
  void damage
  return fighter
}

/** Legacy direct transfer disabled; sweetHomeImpact owns the canonical simultaneous-contact route. */
export function transferSweetHomeLeftHand(state: FightState, side: FightSide): FightState {
  void side
  return state
}

export function advanceFeitanTerebellumUpgrades(state: FightState): FightState {
  if (state.phase !== 'fighting') return state
  return stepRisingSunThermal(state)
}
