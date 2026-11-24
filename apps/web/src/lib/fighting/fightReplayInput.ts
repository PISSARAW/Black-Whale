import { EMPTY_INPUT, type FightInput } from './types'

export const REPLAY_INPUT_KEYS = [
  'left',
  'right',
  'jump',
  'down',
  'guard',
  'aura',
  'hatsu',
  'arena',
  'interact',
  'plugWounds',
  'coverEars',
  'en',
  'shu',
  'conceal',
  'gyo',
  'focusHead',
  'focusTorso',
  'focusHands',
  'focusFeet',
  'call',
  // Appended last: existing replays keep the meaning of every earlier bit.
  'kameo',
  'burst',
  'context',
  'directControls',
  'zetsuIntent',
  'onIntent',
  'seiyakuIntent',
  'lowGyoIntent',
  'directionalZetsu',
] as const satisfies readonly (keyof FightInput)[]
export const REPLAY_INPUT_MASK = 2 ** REPLAY_INPUT_KEYS.length - 1
const DIRECT_CONTROL_START = REPLAY_INPUT_KEYS.indexOf('directControls')
export function packReplayInput(input: FightInput): number {
  return REPLAY_INPUT_KEYS.reduce(
    (bits, key, index) => bits | (Number(Boolean(input[key])) << index),
    0,
  )
}
export function unpackReplayInput(bits: number): FightInput {
  const input = { ...EMPTY_INPUT }
  REPLAY_INPUT_KEYS.forEach((key, index) => {
    const held = Boolean(bits & (1 << index))
    if (held || index < DIRECT_CONTROL_START) input[key] = held
  })
  return input
}
