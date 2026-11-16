import { writable, get } from 'svelte/store'
import { createGamepadReader, mergeFightInput, type PadAction } from '$lib/fighting/fightGamepad'
import {
  createKeyboardMapper,
  defaultBindings,
  readBindings,
  saveBindings,
  type KeyboardBindings,
} from '$lib/fighting/fightInputBindings'
import { ignoresFightKey, dispatchOpponentKey, dispatchHatsuKey } from './fightingKeyboard'
import { handleEasterKey, isDisplayInput } from './fightingPageHelpers'
import { movementKeys } from './fightingKeys'
import type {
  FightInput,
  FightMode,
  FightSide,
  FightState,
  AttackKind,
  MoveAction,
} from '$lib/fighting/types'
import type { EasterEggPreferences } from '$lib/fighting/easterEggPreferences'
import type { EasterEggSlot } from '$lib/fighting/easterEggCatalogue'

function storage(): Storage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}
function browserPads(): readonly (Gamepad | null)[] {
  try {
    return navigator.getGamepads?.() ?? []
  } catch {
    return []
  }
}
function editingControls(): boolean {
  if (document.querySelector('.gamepad-inspector[data-inspecting="true"]')) return true
  if (document.querySelector('.input-settings[open], .display-settings[open]')) return true
  return isDisplayInput(document.activeElement) && document.activeElement?.tagName !== 'SUMMARY'
}
export function createFightControls(onAction: (side: FightSide, action: PadAction) => void) {
  const bindings = writable<KeyboardBindings>(defaultBindings())
  const devices = writable<{ names: string[]; unsupported: boolean }>({
    names: ['', ''],
    unsupported: false,
  })
  const keyboard = createKeyboardMapper()
  const gamepads = createGamepadReader()
  let status = ''
  return {
    bindings,
    devices,
    load() {
      bindings.set(readBindings(storage()))
    },
    save(value: KeyboardBindings) {
      bindings.set(value)
      saveBindings(value, storage())
    },
    release() {
      keyboard.clear()
      gamepads.release()
    },
    combine(side: FightSide, input: FightInput) {
      return mergeFightInput(input, gamepads.inputs[side])
    },
    key(
      event: KeyboardEvent,
      active: boolean,
      handle: (event: KeyboardEvent, active: boolean) => void,
    ) {
      if (ignoresFightKey(event, active)) return
      if (active && (event.metaKey || event.ctrlKey)) return
      const key = keyboard.key(event, active, get(bindings))
      if (key === null) return
      // Preserve the original target and preventDefault while exposing the logical binding.
      const mapped = new Proxy(event, {
        get(target, property) {
          if (property === 'key') return key
          const value = Reflect.get(target, property, target)
          return typeof value === 'function' ? value.bind(target) : value
        },
      })
      handle(mapped, active)
    },
    poll(mode: FightMode | undefined, enabled: boolean) {
      const editing = editingControls()
      const frame = gamepads.poll(browserPads(), enabled && !editing)
      const signature = JSON.stringify([frame.names, frame.unsupported])
      if (signature !== status) {
        status = signature
        devices.set({ names: frame.names, unsupported: frame.unsupported })
      }
      if (editing || !mode) return
      for (const event of frame.actions) {
        if (event.side === 'opponent' && mode === 'versus-ai') continue
        onAction(event.side, event.action)
      }
    },
  }
}
export type FightControls = ReturnType<typeof createFightControls>

interface KeyDispatch {
  state: FightState
  keys: EasterEggPreferences['keys']
  input: FightInput
  opponentInput: FightInput
  easter: (side: FightSide, slot: EasterEggSlot) => void
  control: (key: keyof FightInput, active: boolean) => void
  opponentControl: (key: keyof FightInput, active: boolean) => void
  opponentAttack: (action: MoveAction | 'ranged') => void
  attack: (kind: AttackKind) => void
  action: (key: string) => void
}
export function dispatchFightKey(event: KeyboardEvent, active: boolean, options: KeyDispatch) {
  if (handleEasterKey(event, { ...options, active }, options.easter)) return
  if (
    dispatchOpponentKey(event, active, {
      mode: options.state.mode,
      control: options.opponentControl,
      attack: options.opponentAttack,
    })
  )
    return
  if (dispatchHatsuKey(event, active, options)) return
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const movement = movementKeys[key]
  if (movement) {
    event.preventDefault()
    options.control(movement, active)
    return
  }
  if (!active || event.repeat) return
  if (['o', 'h', 'j', 'k', 'u', 'p', 'Enter'].includes(key)) event.preventDefault()
  options.action(key)
}
