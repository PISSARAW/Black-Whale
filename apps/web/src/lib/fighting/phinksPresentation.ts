import { cyclotronCanAct, CYCLOTRON_ROTATION_AURA } from './phinksCyclotron'
import type { FightState } from './types'

export function cyclotronPresentation(state: FightState, language: 'fr' | 'en') {
  const fighter = state.player
  const winding = Boolean(fighter.cyclotronWindup)
  return {
    ready: cyclotronCanAct(fighter) && (winding || fighter.aura >= CYCLOTRON_ROTATION_AURA),
    label:
      language === 'fr'
        ? winding
          ? 'Arrêter le moulinet'
          : 'Mouliner le bras droit'
        : winding
          ? 'Pause winding'
          : 'Wind the right arm',
    hint:
      language === 'fr'
        ? 'L : lancer / arrêter le moulinet · H : libérer les tours complets dans le poing droit · 2 aura / tour (réglage du duel)'
        : 'L: start / pause winding · H: release completed turns in the right punch · 2 aura / turn (duel tuning)',
  }
}
