import { EASTER_EGG_KEYS } from './easterEggPreferences'

export const CONTROL_KEYS = {
  playerLeft: 'q',
  playerRight: 'd',
  playerJump: 'z',
  playerDown: 's',
  playerGuard: 'Shift',
  playerAura: ' ',
  playerLight: 'j',
  playerHeavy: 'k',
  playerSpecial: 'l',
  playerRanged: 'u',
  playerThrow: 'o',
  playerFinisher: 'h',
  playerCall: 't',
  playerArena: 'F3',
  playerKameo: '<',
  opponentLeft: 'ArrowLeft',
  opponentRight: 'ArrowRight',
  opponentJump: 'ArrowUp',
  opponentDown: 'ArrowDown',
  opponentGuard: 'Enter',
  opponentAura: 'Alt',
  opponentLight: 'n',
  opponentHeavy: 'm',
  opponentSpecial: ',',
  opponentRanged: '.',
  opponentThrow: '/',
  opponentFinisher: 'b',
  opponentCall: 'v',
  opponentArena: 'F10',
  opponentKameo: 'Backspace',
  pause: 'p',
} as const
export type ControlCommand = keyof typeof CONTROL_KEYS
export type KeyboardBindings = Record<ControlCommand, string>
export const CONTROL_LABELS: Record<ControlCommand, [string, string]> = {
  playerLeft: ['P1 · Gauche', 'P1 · Left'],
  playerRight: ['P1 · Droite', 'P1 · Right'],
  playerJump: ['P1 · Saut', 'P1 · Jump'],
  playerDown: ['P1 · Accroupi', 'P1 · Crouch'],
  playerGuard: ['P1 · Garde', 'P1 · Guard'],
  playerAura: ['P1 · Aura', 'P1 · Aura'],
  playerLight: ['P1 · Coup léger', 'P1 · Light'],
  playerHeavy: ['P1 · Coup lourd', 'P1 · Heavy'],
  playerSpecial: ['P1 · Hatsu', 'P1 · Hatsu'],
  playerRanged: ['P1 · Tir', 'P1 · Ranged'],
  playerThrow: ['P1 · Projection', 'P1 · Throw'],
  playerFinisher: ['P1 · Ultime', 'P1 · Finisher'],
  playerCall: ['P1 · Parler', 'P1 · Speak'],
  playerArena: ['P1 · Arène', 'P1 · Arena'],
  playerKameo: ['P1 · Kaméo', 'P1 · Kameo'],
  opponentLeft: ['P2 · Gauche', 'P2 · Left'],
  opponentRight: ['P2 · Droite', 'P2 · Right'],
  opponentJump: ['P2 · Saut', 'P2 · Jump'],
  opponentDown: ['P2 · Accroupi', 'P2 · Crouch'],
  opponentGuard: ['P2 · Garde', 'P2 · Guard'],
  opponentAura: ['P2 · Aura', 'P2 · Aura'],
  opponentLight: ['P2 · Coup léger', 'P2 · Light'],
  opponentHeavy: ['P2 · Coup lourd', 'P2 · Heavy'],
  opponentSpecial: ['P2 · Hatsu', 'P2 · Hatsu'],
  opponentRanged: ['P2 · Tir', 'P2 · Ranged'],
  opponentThrow: ['P2 · Projection', 'P2 · Throw'],
  opponentFinisher: ['P2 · Ultime', 'P2 · Finisher'],
  opponentCall: ['P2 · Parler', 'P2 · Speak'],
  opponentArena: ['P2 · Arène', 'P2 · Arena'],
  opponentKameo: ['P2 · Kaméo', 'P2 · Kameo'],
  pause: ['Pause / Reprendre', 'Pause / Resume'],
}
const STORAGE_KEY = 'black-whale:fighting-controls:v1'
const RESERVED = new Set<string>([
  ...EASTER_EGG_KEYS,
  'Escape',
  'Tab',
  'Meta',
  'Control',
  'F1',
  'F5',
  'F11',
  'F12',
  'r',
  'f',
  'x',
  'g',
  '1',
  '2',
  '3',
  '4',
  '6',
  'y',
  'e',
  '[',
  ']',
  '\\',
  ';',
  '7',
  '8',
  '9',
  '0',
  '5',
  'c',
])
export const defaultBindings = (): KeyboardBindings => ({ ...CONTROL_KEYS })
export const normalizeControlKey = (key: string) => (key.length === 1 ? key.toLowerCase() : key)
export function bindingError(bindings: KeyboardBindings): 'reserved' | 'duplicate' | null {
  const values = Object.values(bindings)
  if (values.some((key) => !key || key.length > 24 || RESERVED.has(key))) return 'reserved'
  return new Set(values).size === values.length ? null : 'duplicate'
}
export function assignControlKey(bindings: KeyboardBindings, command: ControlCommand, key: string) {
  const next = { ...bindings, [command]: normalizeControlKey(key) }
  return bindingError(next) ? null : next
}
export function readBindings(storage?: Pick<Storage, 'getItem'>): KeyboardBindings {
  try {
    const saved = JSON.parse(storage?.getItem(STORAGE_KEY) ?? 'null')
    if (!saved || typeof saved !== 'object') return defaultBindings()
    const result = defaultBindings()
    for (const command of Object.keys(result) as ControlCommand[]) {
      if (typeof saved[command] !== 'string') return defaultBindings()
      result[command] = normalizeControlKey(saved[command])
    }
    return bindingError(result) ? defaultBindings() : result
  } catch {
    return defaultBindings()
  }
}
export function saveBindings(bindings: KeyboardBindings, storage?: Pick<Storage, 'setItem'>): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(bindings))
  } catch {
    /* Session-only fallback. */
  }
}
/** Key-up uses the original command even if the binding or focus changed while held. */
export function createKeyboardMapper() {
  const held = new Map<string, string | null>()
  return {
    clear: () => held.clear(),
    key(event: Pick<KeyboardEvent, 'key' | 'code'>, active: boolean, bindings: KeyboardBindings) {
      const physical = event.code || event.key
      if (active && held.has(physical)) return held.get(physical)!
      if (!active && held.has(physical)) {
        const logical = held.get(physical)!
        held.delete(physical)
        return logical
      }
      if (!active) return null
      const key = normalizeControlKey(event.key)
      const command = (Object.keys(bindings) as ControlCommand[]).find((id) => bindings[id] === key)
      const logical = command
        ? CONTROL_KEYS[command]
        : Object.values(CONTROL_KEYS).some((value) => value === key)
          ? null
          : key
      if (active) held.set(physical, logical)
      return logical
    },
  }
}
