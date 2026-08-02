import { spend, type AuraPool } from '../aura'

export type WoundedLimb = 'left-arm' | 'right-arm' | 'left-leg' | 'right-leg'
export type HuntVow = 'silent-hunt' | 'no-retreat'

export interface AdvancedNenState {
  ren: boolean
  shuItem: string | null
  vow: HuntVow | null
  wounds: WoundedLimb[]
}

export interface NenCapabilities {
  movementMultiplier: number
  canUseTwoHands: boolean
  canSweepEn: boolean
  canBreakAway: boolean
  placedAuraEfficiency: number
}

export const REN_DRAIN_PER_SECOND = 4
export const SHU_COST = 10

export function initialAdvancedNen(): AdvancedNenState {
  return { ren: false, shuItem: null, vow: null, wounds: [] }
}

export function tickRen(
  state: AdvancedNenState,
  pool: AuraPool,
  dt: number,
): { state: AdvancedNenState; pool: AuraPool } {
  if (!state.ren) return { state, pool }
  const next = spend(pool, REN_DRAIN_PER_SECOND * dt)
  return {
    state: next.available > 0 ? state : { ...state, ren: false },
    pool: next,
  }
}

export function toggleRen(state: AdvancedNenState): AdvancedNenState {
  return { ...state, ren: !state.ren }
}

export function applyShu(
  state: AdvancedNenState,
  pool: AuraPool,
  itemId: string,
): { state: AdvancedNenState; pool: AuraPool } {
  if (!itemId || pool.available < SHU_COST) return { state, pool }
  return { state: { ...state, shuItem: itemId }, pool: spend(pool, SHU_COST) }
}

export function acceptVow(
  state: AdvancedNenState,
  vow: HuntVow,
  clock: number,
): AdvancedNenState {
  return clock === 0 && state.vow === null ? { ...state, vow } : state
}

export function wound(state: AdvancedNenState, limb: WoundedLimb): AdvancedNenState {
  return state.wounds.includes(limb) ? state : { ...state, wounds: [...state.wounds, limb] }
}

export function capabilitiesOf(state: AdvancedNenState): NenCapabilities {
  const legs = state.wounds.filter((limb) => limb.endsWith('leg')).length
  const arms = state.wounds.filter((limb) => limb.endsWith('arm')).length
  return {
    movementMultiplier: legs === 0 ? 1 : legs === 1 ? 0.65 : 0.35,
    canUseTwoHands: arms === 0,
    canSweepEn: state.vow !== 'silent-hunt',
    canBreakAway: state.vow !== 'no-retreat',
    placedAuraEfficiency: state.vow === 'silent-hunt' ? 1.35 : 1,
  }
}
