import { getContext } from 'svelte'
import { readable, type Readable } from 'svelte/store'
import { defaultBindings, type KeyboardBindings, type ControlCommand } from './fightInputBindings'
import type { FightSide } from './types'

export const FIGHT_CONTROLS_CONTEXT = 'black-whale:fighting-controls'
export function useFightBindings(): Readable<KeyboardBindings> {
  return (
    getContext<Readable<KeyboardBindings>>(FIGHT_CONTROLS_CONTEXT) ?? readable(defaultBindings())
  )
}
const ACTION_KEYS: Record<string, string> = {
  J: 'Light',
  K: 'Heavy',
  L: 'Special',
  U: 'Ranged',
  H: 'Finisher',
  O: 'Throw',
}
export function moveInputHint(
  text: string,
  bindings: KeyboardBindings,
  side: FightSide = 'player',
): string {
  const prefix = side === 'player' ? 'player' : 'opponent'
  return text.replace(/\b[JKLUHO]\b/g, (key) => {
    const action = ACTION_KEYS[key]
    return action ? bindings[`${prefix}${action}` as ControlCommand] : key
  })
}
