import type { CombatState, PersistentNenEffect } from './types'

export function addPersistentNenEffect(
  state: CombatState,
  effect: PersistentNenEffect,
): CombatState {
  return {
    ...state,
    nenEffects: [...state.nenEffects.filter(({ id }) => id !== effect.id), effect],
  }
}

export function advancePersistentNenEffects(state: CombatState, dt: number): CombatState {
  const nenEffects = state.nenEffects.flatMap((effect) => {
    if (effect.remaining === null) return [effect]
    const remaining = effect.remaining - dt
    return remaining > 0 ? [{ ...effect, remaining }] : []
  })
  return nenEffects.length === state.nenEffects.length && nenEffects.every((effect, index) => effect === state.nenEffects[index])
    ? state
    : { ...state, nenEffects }
}
