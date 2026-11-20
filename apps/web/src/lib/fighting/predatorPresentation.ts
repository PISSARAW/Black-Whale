import { PREDATOR_ANALYSIS_FRAMES, predatorNenAvailable, predatorReady } from './predator'
import { predatorPrey } from './predatorPrey'
import { facetsFilled, PREDATOR_FACETS, type PredatorFacet } from './predatorSheet'
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
        ? 'Fiche complète'
        : 'Sheet complete'
      : fr
        ? 'Analyser'
        : 'Study',
    ready: predatorNenAvailable(fighter) && !fighter.predator?.hunt,
    hint: fr
      ? 'L : observer · →/← + L : changer d’enquête · ↓ + L : abandonner · fiche complète : Predator part seul (40 aura)'
      : 'L: observe · →/← + L: switch investigation · ↓ + L: abandon · complete sheet: Predator leaves on its own (40 aura)',
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
    progress: sheetProgress(analysis),
    facets: facetLines(analysis, language),
    remaining: predatorSealLabel(predator?.sealFrames ?? 0),
    ready: predatorReady(state, side),
  }
}

const FACET_LABELS: Record<PredatorFacet, readonly [string, string]> = {
  trigger: ['Déclencheur', 'Trigger'],
  target: ['Cible', 'Target'],
  range: ['Portée', 'Range'],
  conditions: ['Conditions', 'Conditions'],
  behaviour: ['Comportement', 'Behaviour'],
}

type Analysis = NonNullable<NonNullable<FightState['player']['predator']>['analysis']>

function facetLines(analysis: Analysis | null | undefined, language: 'fr' | 'en') {
  const filled = analysis ? facetsFilled(analysis) : []
  return PREDATOR_FACETS.map((id) => ({
    id,
    label: FACET_LABELS[id][language === 'fr' ? 0 : 1],
    filled: filled.includes(id),
  }))
}

/** Four observed lines plus the behaviour study, which fills gradually. */
function sheetProgress(analysis: Analysis | null | undefined): number {
  if (!analysis) return 0
  const lines = facetsFilled(analysis).filter((facet) => facet !== 'behaviour').length
  const behaviour = Math.min(1, analysis.observedFrames / PREDATOR_ANALYSIS_FRAMES)
  return Math.round(((lines + behaviour) / PREDATOR_FACETS.length) * 100)
}
