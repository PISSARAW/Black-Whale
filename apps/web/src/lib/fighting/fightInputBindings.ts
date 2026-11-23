import { EASTER_EGG_KEYS } from './easterEggPreferences'

const LEGACY_KEYS = {
  playerLeft: 'q',
  playerRight: 'd',
  playerJump: 'z',
  playerDown: 's',
  playerGuard: 'Shift',
  playerAura: ' ',
  playerLight: 'j',
  playerHeavy: 'k',
  playerSpecial: 'l',
  playerKameo: 'u',
  playerBurst: 'o',
  playerContext: 'h',
  opponentLeft: 'ArrowLeft',
  opponentRight: 'ArrowRight',
  opponentJump: 'ArrowUp',
  opponentDown: 'ArrowDown',
  opponentGuard: 'Enter',
  opponentAura: 'v',
  opponentLight: 'n',
  opponentHeavy: 'm',
  opponentSpecial: ',',
  opponentKameo: '.',
  opponentBurst: '/',
  opponentContext: 'b',
  pause: 'p',
} as const
export const CONTROL_KEYS = {
  ...LEGACY_KEYS,
  playerGuard: ' ',
  playerAura: 'c',
  playerBurst: 'n',
  playerThrow: 'm',
  playerFinisher: 'i',
  playerProjectile: 'o',
  playerOn: 'g',
  playerNen: 'v',
  opponentAura: 'r',
  opponentLight: 'f',
  opponentHeavy: 't',
  opponentSpecial: 'y',
  opponentKameo: 'e',
  opponentBurst: 'x',
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
  playerKameo: ['P1 · Kaméo', 'P1 · Kameo'],
  playerBurst: ['P1 · Burst', 'P1 · Burst'],
  playerContext: ['P1 · Contexte', 'P1 · Context'],
  playerThrow: ['P1 · Projection', 'P1 · Throw'],
  playerFinisher: ['P1 · Ultime', 'P1 · Finisher'],
  playerProjectile: ['P1 · Projectile', 'P1 · Projectile'],
  playerOn: ['P1 · On', 'P1 · On'],
  playerNen: ['P1 · Techniques Nen', 'P1 · Nen techniques'],
  opponentLeft: ['P2 · Gauche', 'P2 · Left'],
  opponentRight: ['P2 · Droite', 'P2 · Right'],
  opponentJump: ['P2 · Saut', 'P2 · Jump'],
  opponentDown: ['P2 · Accroupi', 'P2 · Crouch'],
  opponentGuard: ['P2 · Garde', 'P2 · Guard'],
  opponentAura: ['P2 · Aura', 'P2 · Aura'],
  opponentLight: ['P2 · Coup léger', 'P2 · Light'],
  opponentHeavy: ['P2 · Coup lourd', 'P2 · Heavy'],
  opponentSpecial: ['P2 · Hatsu', 'P2 · Hatsu'],
  opponentKameo: ['P2 · Kaméo', 'P2 · Kameo'],
  opponentBurst: ['P2 · Burst', 'P2 · Burst'],
  opponentContext: ['P2 · Contexte', 'P2 · Context'],
  pause: ['Pause / Reprendre', 'Pause / Resume'],
}
const STORAGE_KEY = 'black-whale:fighting-controls:v3'
const LEGACY_STORAGE_KEY = 'black-whale:fighting-controls:v2'
const RESERVED = new Set<string>([
  ...EASTER_EGG_KEYS,
  'Escape',
  'Tab',
  'Meta',
  'Control',
  'Alt',
  'AltGraph',
  'F1',
  'F5',
  'F11',
  'F12',
])
export const defaultBindings = (): KeyboardBindings => ({ ...CONTROL_KEYS })
export const normalizeControlKey = (key: string) => (key.length === 1 ? key.toLowerCase() : key)
export function bindingError(bindings: KeyboardBindings): 'reserved' | 'duplicate' | null {
  const values = Object.values(bindings)
  if (Object.entries(bindings).some(([command, key]) => command !== 'pause' && key === 'p'))
    return 'reserved'
  if (values.some((key) => !key || key.length > 24 || RESERVED.has(key))) return 'reserved'
  return new Set(values).size === values.length ? null : 'duplicate'
}
export function assignControlKey(bindings: KeyboardBindings, command: ControlCommand, key: string) {
  const next = { ...bindings, [command]: normalizeControlKey(key) }
  return bindingError(next) ? null : next
}
export function readBindings(storage?: Pick<Storage, 'getItem'>): KeyboardBindings {
  try {
    const current = storage?.getItem(STORAGE_KEY)
    if (!current) return migrateBindings(JSON.parse(storage?.getItem(LEGACY_STORAGE_KEY) ?? 'null'))
    return decodeBindings(JSON.parse(current))
  } catch {
    return defaultBindings()
  }
}
function decodeBindings(saved: unknown): KeyboardBindings {
  if (!saved || typeof saved !== 'object') return defaultBindings()
  const values = saved as Record<string, unknown>
  const result = defaultBindings()
  for (const command of Object.keys(result) as ControlCommand[]) {
    const value = values[command]
    if (typeof value !== 'string') return defaultBindings()
    result[command] = normalizeControlKey(value)
  }
  return bindingError(result) ? defaultBindings() : result
}
function migrateBindings(saved: unknown): KeyboardBindings {
  let result = defaultBindings()
  if (!saved || typeof saved !== 'object') return result
  const previous = saved as Record<string, unknown>
  for (const command of Object.keys(LEGACY_KEYS) as (keyof typeof LEGACY_KEYS)[]) {
    const key = previous[command]
    if (typeof key === 'string' && key !== LEGACY_KEYS[command])
      result = assignControlKey(result, command, key) ?? result
  }
  return result
}
export function saveBindings(bindings: KeyboardBindings, storage?: Pick<Storage, 'setItem'>): void {
  try {
    storage?.setItem(STORAGE_KEY, JSON.stringify(bindings))
  } catch {
    /* Session-only fallback. */
  }
}
const CODE_KEYS: Readonly<Record<string, string>> = {
  Comma: ',',
  Period: '.',
  Slash: '/',
  Space: ' ',
}

export function physicalControlKey(event: Pick<KeyboardEvent, 'code' | 'key'>): string {
  const label = normalizeControlKey(event.key)
  // M shifts rows between AZERTY and QWERTY. Both layouts use the printed M.
  if (label === 'm' || event.code === 'KeyM') return label
  if (event.code === 'KeyA') return 'q'
  if (event.code === 'KeyQ') return 'a'
  if (event.code === 'KeyW') return 'z'
  if (event.code === 'KeyZ') return 'w'
  if (/^Key[A-Z]$/.test(event.code)) return event.code.slice(3).toLowerCase()
  return CODE_KEYS[event.code] ?? label
}

function mappedKey(key: string, bindings: KeyboardBindings, layer: boolean): string | null {
  if (key === 'p') return 'p'
  const command = (Object.keys(bindings) as ControlCommand[]).find((id) => bindings[id] === key)
  if (!command) return key.startsWith('F') ? key : null
  if (command === 'pause') return 'p'
  if (command.startsWith('player')) {
    const modified = layer && command !== 'playerNen' && command !== 'playerGuard'
    return `direct:${modified ? 'nen:' : ''}${command}`
  }
  return LEGACY_KEYS[command as keyof typeof LEGACY_KEYS]
}
export function controlKeyLabel(key: string, language: 'fr' | 'en'): string {
  if (key === ' ') return language === 'fr' ? 'Espace' : 'Space'
  if (key === 'q') return 'Q / A'
  if (key === 'z') return 'Z / W'
  if (key === 'a') return 'A / Q'
  if (key === 'w') return 'W / Z'
  return key.length === 1 ? key.toUpperCase() : key
}

/** Key-up uses the original command even if the binding or focus changed while held. */
export function createKeyboardMapper() {
  const held = new Map<string, string | null>()
  return {
    clear: () => held.clear(),
    key(
      event: Pick<KeyboardEvent, 'key' | 'code'> & { altKey?: boolean },
      active: boolean,
      bindings: KeyboardBindings,
    ) {
      const physical = event.code || event.key
      if (held.has(physical)) {
        const logical = held.get(physical) ?? null
        if (!active) held.delete(physical)
        return logical
      }
      if (!active) return null
      const layer = [...held.values()].includes('direct:playerNen')
      const logical = mappedKey(physicalControlKey(event), bindings, layer)
      held.set(physical, logical)
      return logical
    },
  }
}
