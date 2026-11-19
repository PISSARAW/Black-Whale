import type { ControlScheme, ControlSchemes } from './controlScheme'
import type { FightMode } from './types'

const STORAGE_KEY = 'black-whale:fighting-control-scheme:v1'

export function readControlScheme(storage?: Pick<Storage, 'getItem'>): ControlScheme {
  try {
    return storage?.getItem(STORAGE_KEY) === 'classic' ? 'classic' : 'simplified'
  } catch {
    return 'simplified'
  }
}

export function saveControlScheme(scheme: ControlScheme, storage?: Pick<Storage, 'setItem'>): void {
  try {
    storage?.setItem(STORAGE_KEY, scheme)
  } catch {
    // Private windows may refuse storage; the choice still applies to this session.
  }
}

/**
 * Schemes for a new fight. Touch controls are always simplified; the AI keeps the default
 * simplified commands; two local humans share the keyboard/gamepad preference.
 */
export function fightControlSchemes(options: {
  mode: FightMode
  preference: ControlScheme
  touch: boolean
}): ControlSchemes {
  const human = options.touch ? 'simplified' : options.preference
  return options.mode === 'versus-local' ? { player: human, opponent: human } : { player: human }
}

/**
 * Touch-first device at fight creation. Approximates FightBattle's touch controls, which
 * also follow the manual "touch controls" setting; a coarse pointer forces simplified.
 */
export function coarsePointer(): boolean {
  try {
    return window.matchMedia('(any-pointer: coarse)').matches
  } catch {
    return false
  }
}
