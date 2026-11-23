import { getContext } from 'svelte'
import { readable, type Readable } from 'svelte/store'
import { defaultBindings, type KeyboardBindings } from './fightInputBindings'
import type { FightSide } from './types'

export const FIGHT_CONTROLS_CONTEXT = 'black-whale:fighting-controls'
export function useFightBindings(): Readable<KeyboardBindings> {
  return (
    getContext<Readable<KeyboardBindings>>(FIGHT_CONTROLS_CONTEXT) ?? readable(defaultBindings())
  )
}

export function throwHint(bindings: KeyboardBindings, side: FightSide = 'player'): string {
  return side === 'player'
    ? `${bindings.playerLight}+${bindings.playerHeavy}`
    : `${bindings.opponentLight}+${bindings.opponentHeavy}`
}

export function finisherHint(bindings: KeyboardBindings, side: FightSide = 'player'): string {
  return side === 'player'
    ? `${bindings.playerHeavy}+${bindings.playerSpecial}`
    : `${bindings.opponentHeavy}+${bindings.opponentSpecial}`
}

export function moveInputHint(
  text: string,
  bindings: KeyboardBindings,
  side: FightSide = 'player',
): string {
  const light = side === 'player' ? bindings.playerLight : bindings.opponentLight
  const heavy = side === 'player' ? bindings.playerHeavy : bindings.opponentHeavy
  const special = side === 'player' ? bindings.playerSpecial : bindings.opponentSpecial
  const map: Record<string, string> = {
    J: light,
    K: heavy,
    L: special,
    U: special,
    O: `${light}+${heavy}`,
    H: `${heavy}+${special}`,
  }
  return text.replace(/\b[JKLUHO]\b/g, (key) => map[key] ?? key)
}
