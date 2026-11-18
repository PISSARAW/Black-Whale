import { defaultBindings, type KeyboardBindings } from './fightInputBindings'

/** The move list uses the names actually printed on the touch controller. */
export function fightTouchBindings(language: 'fr' | 'en'): KeyboardBindings {
  const fr = language === 'fr'
  return {
    ...defaultBindings(),
    playerLight: fr ? 'Léger' : 'Light',
    playerHeavy: fr ? 'Lourd' : 'Heavy',
    playerSpecial: 'Hatsu',
    playerRanged: fr ? 'Tir' : 'Shot',
    playerFinisher: fr ? 'Ultime' : 'Super',
    playerThrow: fr ? 'Proj.' : 'Throw',
    playerArena: fr ? 'Nen › Arène' : 'Nen › Arena',
  }
}
