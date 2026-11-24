import type { ArcadeFighter, FightSide, FightState } from './types'

// Legacy timings kept for save/replay compatibility. Canonical Predator readiness is
// determined by the five-part observation sheet in predator.ts.
export const PREDATOR_EARLY_FRAMES = 90
export const PREDATOR_FULL_FRAMES = 180
export const PREDATOR_WEAK_FACTOR = 1

export type PredatorManifestationKind =
  'rising-sun' | 'musse-owl' | 'machi-threads' | 'bungee-gum' | 'conjured-weapon'

declare module './types' {
  interface ArcadeFighter {
    predatorStudyFrames?: number
    predatorWeakenedHatsu?: boolean
    predatorRoundSealed?: boolean
  }
}

/** Detects persistent aura manifestations (Emission/Transmutation + Conjuration) Predator can devour. */
export function observableAuraManifestation(
  state: FightState,
  targetSide: FightSide,
): PredatorManifestationKind | null {
  const target = state[targetSide]
  const otherSide: FightSide = targetSide === 'player' ? 'opponent' : 'player'
  const candidates: readonly [boolean, PredatorManifestationKind][] = [
    [hasRisingSun(target), 'rising-sun'],
    [hasMusseOwl(state, targetSide), 'musse-owl'],
    [hasBungeeGum(state, targetSide), 'bungee-gum'],
    [hasMachiThread(state, otherSide, targetSide), 'machi-threads'],
    [hasConjuredWeapon(target), 'conjured-weapon'],
  ]
  return candidates.find(([present]) => present)?.[1] ?? null
}

const hasRisingSun = (target: ArcadeFighter) => Boolean(target.hatsuEffects.painPacker?.sun)
const hasMusseOwl = (state: FightState, side: FightSide) =>
  Boolean(state.musseOwl?.active && state.musseOwl.owner === side)
const hasBungeeGum = (state: FightState, side: FightSide) =>
  Boolean(
    state.bungeeGum?.owner === side || state.gumNetwork?.links.some((link) => link.owner === side),
  )
const hasMachiThread = (state: FightState, other: FightSide, side: FightSide) =>
  state[other].machiThread?.owner === side
const hasConjuredWeapon = (target: ArcadeFighter) =>
  Boolean(target.chrolloBook?.open || target.kurapika)

export function predatorCertaintyTier(fighter: ArcadeFighter): 'none' | 'weak' | 'lethal' {
  void fighter
  return 'none'
}

/** Legacy entry point. Predator launches only through the canonical observation sheet. */
export function releaseCertaintyPredator(state: FightState, rihanSide: FightSide): FightState {
  void rihanSide
  return state
}

export function predatorHatsuFactor(fighter: ArcadeFighter): number {
  void fighter
  return 1
}
