import { canUseMovesetMove, moveForSlot } from './movesets'
import type { FightState } from './types'

/** L retains the physical charge; the actual curse is explained separately by OutsideDuelStatus. */
export function beyondPhysicalPresentation(state: FightState, language: 'fr' | 'en') {
  const move = moveForSlot('beyond', 'neutralSpecial')
  return {
    label: language === 'fr' ? 'Charge physique' : 'Physical charge',
    ready: Boolean(move && canUseMovesetMove(state, 'player', move)),
    hint:
      language === 'fr'
        ? `L : charge physique renforcée au Ren · ${move?.auraCost ?? 40} aura. Malédiction indisponible sans préparation.`
        : `L: Ren-powered physical charge · ${move?.auraCost ?? 40} aura. Curse unavailable without preparation.`,
  }
}
