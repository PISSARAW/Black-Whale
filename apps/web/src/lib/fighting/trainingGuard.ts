import type { FightState } from './types'

declare module './trainingTypes' {
  interface TrainingState {
    firstHitTaken?: boolean
    guardChoice?: boolean
    guardSawStartup?: boolean
  }
}
/** Deterministic trial choices are replayable and never consume combat RNG. */
export function prepareTrainingGuard(state: FightState): FightState {
  const lab = state.training
  if (!lab || !['guard-after-hit', 'random-guard'].includes(lab.settings.dummy.behavior))
    return state
  const startup = state.player.attack?.frame === 0
  const firstHitTaken = lab.firstHitTaken || state.opponent.comboHits > 0
  const choice =
    startup && !lab.guardSawStartup
      ? ((Math.imul(state.frame ^ state.rng, 1597334677) >>> 0) & 0x40000000) !== 0
      : (lab.guardChoice ?? false)
  return {
    ...state,
    training: { ...lab, firstHitTaken, guardChoice: choice, guardSawStartup: startup },
  }
}
export function trainingGuardInput(state: FightState): boolean {
  const lab = state.training!
  if (lab.settings.dummy.behavior === 'guard-after-hit') return Boolean(lab.firstHitTaken)
  return lab.settings.dummy.behavior === 'random-guard' && Boolean(lab.guardChoice)
}
