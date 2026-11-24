import type { FightSide, FightState } from './types'

/** Presentation-only suspension caused by the convection column around Rising Sun. */
export function feitanHeatVictimLift(state: FightState, side: FightSide): number {
  const other = side === 'player' ? 'opponent' : 'player'
  const sun = state[other].hatsuEffects.painPacker?.sun
  if (!sun?.scored.includes(side) || sun.age < 18) return 0
  const rise = Math.min(1, (sun.age - 18) / 42)
  const fall = Math.min(1, Math.max(0, (sun.duration - sun.age) / 24))
  return rise * fall * 0.72
}
