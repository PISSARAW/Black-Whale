import { defaultBindings, type KeyboardBindings } from './fightInputBindings'

/** The move list uses the names actually printed on the touch controller. */
export function fightTouchBindings(language: 'fr' | 'en'): KeyboardBindings {
  const fr = language === 'fr'
  return {
    ...defaultBindings(),
    playerLight: fr ? 'Léger' : 'Light',
    playerHeavy: fr ? 'Lourd' : 'Heavy',
    playerSpecial: 'Hatsu',
    playerKameo: fr ? 'Kaméo' : 'Kameo',
    playerBurst: 'Burst',
    playerContext: fr ? 'Contexte' : 'Context',
    playerThrow: fr ? 'Proj.' : 'Throw',
    playerFinisher: fr ? 'Ultime' : 'Super',
    playerProjectile: fr ? 'Tir' : 'Shot',
  }
}
