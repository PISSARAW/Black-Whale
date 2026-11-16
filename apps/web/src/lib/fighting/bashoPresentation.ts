import { bashoCanWrite, bashoWriting } from './bashoPoem'
import type { FightState } from './types'

export function bashoPresentation(state: FightState, language: 'fr' | 'en') {
  return {
    label: language === 'fr' ? 'Écrire le haïku' : 'Write the haiku',
    ready: bashoCanWrite(state, 'player'),
    hint: bashoWriting(state.player)
      ? language === 'fr'
        ? 'Écriture en cours · rester immobile et exposé'
        : 'Writing · stay still and exposed'
      : language === 'fr'
        ? 'L : recopier le poème attesté · 25 aura · seuls les poings qui touchent enflamment'
        : 'L: copy the attested poem · 25 aura · only connecting fists ignite',
  }
}
