import { moonlightCanOffer } from './moonlightContract'
import type { FightState } from './types'

export function moonlightPresentation(state: FightState, language: 'fr' | 'en') {
  return {
    label: language === 'fr' ? 'Proposer un pacte' : 'Offer a pact',
    ready: moonlightCanOffer(state, 'player'),
    hint:
      language === 'fr'
        ? 'L : proposer les clauses · signature libre à portée des mains · aucun effet sur touche'
        : 'L: offer disclosed terms · voluntary signature within hand reach · no on-hit effect',
  }
}
