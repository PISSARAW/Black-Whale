import { EASTER_EGGS, type EasterEggFighter, type EasterEggSlot } from './easterEggCatalogue'
import type { FightInput, FightSide, FightState } from './types'

const STORAGE_KEY = 'black-whale.clash.easter-eggs.v1'
const KEYBOARD_DEFAULTS_VERSION = 2
export const EASTER_EGG_NUMBER_KEYS = ['1', '8'] as const
export const EASTER_EGG_KEYS = [
  ...EASTER_EGG_NUMBER_KEYS,
  'F2',
  'F4',
  'F6',
  'F7',
  'F8',
  'F9',
] as const
const LEGACY_DEFAULT_KEYS = { player: 'F2', opponent: 'F4' }
export interface EasterEggPreferences {
  keys: Record<FightSide, string>
  discoveries: Partial<Record<EasterEggFighter, number>>
}
export const defaultEasterEggPreferences = (): EasterEggPreferences => ({
  keys: { player: EASTER_EGG_NUMBER_KEYS[0], opponent: EASTER_EGG_NUMBER_KEYS[1] },
  discoveries: {},
})

function browserStorage(): Storage | undefined {
  try {
    return typeof window === 'undefined' ? undefined : window.localStorage
  } catch {
    return undefined
  }
}

export function readEasterEggPreferences(
  storage: Pick<Storage, 'getItem'> | undefined = browserStorage(),
): EasterEggPreferences {
  const result = defaultEasterEggPreferences()
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
    if (!saved || typeof saved !== 'object') return result
    if (validKeys(saved.keys))
      result.keys = restoreKeys(saved.keys, saved.keyboardDefaults, result.keys)
    result.discoveries = validDiscoveries(saved.discoveries)
  } catch {
    /* Private browsing and damaged saves must not prevent playing. */
  }
  return result
}

function restoreKeys(
  saved: EasterEggPreferences['keys'],
  version: unknown,
  defaults: EasterEggPreferences['keys'],
): EasterEggPreferences['keys'] {
  const keys = { player: saved.player, opponent: saved.opponent }
  if (version === KEYBOARD_DEFAULTS_VERSION) return keys
  for (const side of ['player', 'opponent'] as const)
    if (keys[side] === LEGACY_DEFAULT_KEYS[side]) keys[side] = defaults[side]
  return validKeys(keys) ? keys : saved
}

function validDiscoveries(saved: EasterEggPreferences['discoveries'] | undefined) {
  const discoveries: EasterEggPreferences['discoveries'] = {}
  for (const id of Object.keys(EASTER_EGGS) as EasterEggFighter[]) {
    const mask = saved?.[id]
    if (typeof mask === 'number' && validMask(mask)) discoveries[id] = mask
  }
  return discoveries
}

function validKeys(keys: EasterEggPreferences['keys'] | undefined): boolean {
  if (!keys) return false
  return (
    [keys.player, keys.opponent].every((key) =>
      EASTER_EGG_KEYS.some((candidate) => candidate === key),
    ) && keys.player !== keys.opponent
  )
}

function validMask(mask: number): boolean {
  return Number.isInteger(mask) && mask >= 0 && mask <= 15
}

export function saveEasterEggPreferences(
  preferences: EasterEggPreferences,
  storage: Pick<Storage, 'setItem'> | undefined = browserStorage(),
): void {
  try {
    storage?.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...preferences, keyboardDefaults: KEYBOARD_DEFAULTS_VERSION }),
    )
  } catch {
    /* Memory-only fallback. */
  }
}

export function rememberEasterEggs(
  preferences: EasterEggPreferences,
  state: FightState,
): EasterEggPreferences {
  if (state.forecastSimulation) return preferences
  let next = preferences
  for (const side of ['player', 'opponent'] as const) {
    const fighter = state[side]
    if (!Object.hasOwn(EASTER_EGGS, fighter.id)) continue
    const id = fighter.id as EasterEggFighter
    const previous = next.discoveries[id] ?? 0
    const mask = previous | (fighter.easterEggDiscoveries ?? 0)
    if (mask !== previous) next = { ...next, discoveries: { ...next.discoveries, [id]: mask } }
  }
  return next
}

export function easterEggKeyCommand(
  key: string,
  options: {
    state: FightState
    keys: EasterEggPreferences['keys']
    input: FightInput
    opponentInput: FightInput
  },
): { side: FightSide; slot: EasterEggSlot } | null {
  const { state, keys } = options
  const side =
    key === keys.player
      ? 'player'
      : key === keys.opponent && state.mode !== 'versus-ai'
        ? 'opponent'
        : null
  if (!side) return null
  const input = side === 'player' ? options.input : options.opponentInput
  const direction = Number(input.right) - Number(input.left)
  const slot = input.down ? 4 : direction === 0 ? 1 : direction === state[side].facing ? 2 : 3
  return { side, slot }
}
