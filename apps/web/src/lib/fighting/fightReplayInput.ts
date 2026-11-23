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
] as const satisfies readonly (keyof FightInput)[]
export const REPLAY_INPUT_MASK = 2 ** REPLAY_INPUT_KEYS.length - 1
export function packReplayInput(input: FightInput): number {
  return REPLAY_INPUT_KEYS.reduce(
    (bits, key, index) => bits | (Number(Boolean(input[key])) << index),
    0,
  )
}
export function unpackReplayInput(bits: number): FightInput {
  const input = { ...EMPTY_INPUT }
  REPLAY_INPUT_KEYS.forEach((key, index) => {
    input[key] = Boolean(bits & (1 << index))
  })
  return input
}
