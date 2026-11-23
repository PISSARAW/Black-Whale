import type { ArcadeFighter, FightSide, FightState } from './types'

export const PREDATOR_EARLY_FRAMES = 90 // 1.5 s -> weak Predator (weakens Hatsu)
export const PREDATOR_FULL_FRAMES = 180 // 3.0 s -> lethal Predator (destroys & seals Hatsu for round)
export const PREDATOR_WEAK_FACTOR = 0.75

export type PredatorManifestationKind =
  | 'rising-sun'
  | 'musse-owl'
  | 'machi-threads'
  | 'bungee-gum'
  | 'conjured-weapon'

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
  if (target.hatsuEffects.painPacker?.sun) return 'rising-sun'
  if (state.musseOwl?.active && state.musseOwl.owner === targetSide) return 'musse-owl'
  if (state.bungeeGum?.owner === targetSide || state.gumNetwork?.owner === targetSide)
    return 'bungee-gum'
  const otherSide: FightSide = targetSide === 'player' ? 'opponent' : 'player'
  if (state[otherSide].machiThread?.owner === targetSide) return 'machi-threads'
  if (target.chrolloBook?.open || target.kurapika) return 'conjured-weapon'
  return null
}

export function predatorCertaintyTier(fighter: ArcadeFighter): 'none' | 'weak' | 'lethal' {
  const frames = fighter.predatorStudyFrames ?? 0
  if (frames >= PREDATOR_FULL_FRAMES) return 'lethal'
  if (frames >= PREDATOR_EARLY_FRAMES) return 'weak'
  return 'none'
}

/** Releases Predator based on certainty gauge: 1.5s weakens Hatsu; 3s destroys construct & seals Hatsu all round. */
export function releaseCertaintyPredator(state: FightState, rihanSide: FightSide): FightState {
  const rihan = state[rihanSide]
  const tier = predatorCertaintyTier(rihan)
  if (tier === 'none') return state
  const targetSide: FightSide = rihanSide === 'player' ? 'opponent' : 'player'
  const target = state[targetSide]
  if (tier === 'weak') {
    return {
      ...state,
      [rihanSide]: { ...rihan, predatorStudyFrames: 0 },
      [targetSide]: { ...target, predatorWeakenedHatsu: true },
    }
  }
  const clearedOwl = state.musseOwl?.owner === targetSide ? undefined : state.musseOwl
  const clearedGum = state.bungeeGum?.owner === targetSide ? null : state.bungeeGum
  return {
    ...state,
    musseOwl: clearedOwl,
    bungeeGum: clearedGum,
    [rihanSide]: { ...rihan, predatorStudyFrames: 0 },
    [targetSide]: {
      ...target,
      predatorRoundSealed: true,
      hatsuEffects: {
        ...target.hatsuEffects,
        painPacker: target.hatsuEffects.painPacker
          ? { ...target.hatsuEffects.painPacker, sun: null }
          : target.hatsuEffects.painPacker,
      },
    },
  }
}

export function predatorHatsuFactor(fighter: ArcadeFighter): number {
  if (fighter.predatorRoundSealed) return 0
  return fighter.predatorWeakenedHatsu ? PREDATOR_WEAK_FACTOR : 1
}
