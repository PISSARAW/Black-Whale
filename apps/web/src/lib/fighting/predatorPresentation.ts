import { PREDATOR_ANALYSIS_FRAMES, predatorNenAvailable, predatorReady } from './predator'
import { predatorPrey } from './predatorPrey'
import { predatorNenLocked } from './predatorSeal'
import type { FightSide, FightState } from './types'

export function predatorSealLabel(frames: number): string {
  const seconds = Math.ceil(frames / 60)
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':')
}

export function predatorSpecialPresentation(state: FightState, language: 'fr' | 'en') {
  const fighter = state.player
  const fr = language === 'fr'
  if (predatorNenLocked(fighter))
    return {
      label: 'Predator',
      ready: false,
      hint: `${fr ? 'Nen de Rihan scellé' : 'Rihan’s Nen sealed'} · ${predatorSealLabel(fighter.predator!.sealFrames)}`,
    }
  return {
    label: predatorReady(state, 'player')
      ? fr
        ? 'Lâcher Predator'
        : 'Release Predator'
      : fr
        ? 'Analyser'
        : 'Study',
    ready: predatorNenAvailable(fighter) && !fighter.predator?.hunt,
    hint: fr
      ? 'L : observer / lancer après analyse · →/← + L : Hatsu étudié · ↓ + L : abandonner · H : prédation (40 aura)'
      : 'L: observe / release after study · →/← + L: studied Hatsu · ↓ + L: abandon · H: predation (40 aura)',
  }
}

export function predatorStatus(state: FightState, side: FightSide, language: 'fr' | 'en') {
  const predator = state[side].predator
  const analysis = predator?.analysis
  const prey = analysis ? predatorPrey(analysis.preyId) : null
  return {
    name: prey
      ? language === 'fr'
        ? prey.nameFr
        : prey.nameEn
      : language === 'fr'
        ? 'Aucune proie observée'
        : 'No observed prey',
    progress: Math.round(((analysis?.observedFrames ?? 0) / PREDATOR_ANALYSIS_FRAMES) * 100),
    remaining: predatorSealLabel(predator?.sealFrames ?? 0),
    ready: predatorReady(state, side),
  }
}
