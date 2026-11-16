import { padailleMoveAvailable, padailleNenActive } from './padailleWeapon'
import type { ArcadeFighter, FightState } from './types'

const TOOL_NAMES = {
  hammer: ['Marteau', 'Hammer'],
  drill: ['Foret', 'Drill'],
  axe: ['Hache', 'Axe'],
} as const

export function padailleToolLabel(fighter: ArcadeFighter, language: 'fr' | 'en'): string {
  const tool = padailleNenActive(fighter) ? fighter.padailleTool : undefined
  if (!tool) return language === 'fr' ? 'Main droite normale' : 'Normal right hand'
  return `${TOOL_NAMES[tool][language === 'fr' ? 0 : 1]} · ${language === 'fr' ? 'main droite' : 'right hand'}`
}

export function padaillePresentation(state: FightState, language: 'fr' | 'en') {
  return {
    label: 'I’m Coming to Get You',
    ready: state.player.aura >= 20 && padailleMoveAvailable(state.player),
    hint:
      language === 'fr'
        ? 'L marteau · → L foret · ↓ L hache · ← L main normale. Choix direct, sans bonus général.'
        : 'L hammer · → L drill · ↓ L axe · ← L normal hand. Direct selection, no global buff.',
  }
}
