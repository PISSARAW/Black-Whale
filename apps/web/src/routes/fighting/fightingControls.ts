import { writable, get } from 'svelte/store'
import { createGamepadReader, mergeFightInput, type PadAction } from '$lib/fighting/fightGamepad'
import {
  createKeyboardMapper,
  defaultBindings,
  readBindings,
  saveBindings,
  type KeyboardBindings,
} from '$lib/fighting/fightInputBindings'
import {
  ignoresFightKey,
  dispatchOpponentKey,
  dispatchPlayerAttackKey,
  resetKeyboardChords,
} from './fightingKeyboard'
import {
  fightControlSchemes,
  readControlScheme,
  saveControlScheme,
} from '$lib/fighting/controlSchemePreference'
import type { ControlScheme } from '$lib/fighting/controlScheme'
import { handleEasterKey, isDisplayInput } from './fightingPageHelpers'
import { playerMovementKey } from './fightingKeys'
import { dispatchDirectFightKey } from './directFightKeyboard'
import { RIGHT_STICK_ACTIONS, type RightStickLayout } from '$lib/fighting/directFightGamepad'
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
  if (document.querySelector('.clash-pause-menu[open]'))
    return Boolean(document.activeElement?.closest('.capturing'))
  if (document.querySelector('.input-settings[open], .display-settings[open]')) return true
  return isDisplayInput(document.activeElement) && document.activeElement?.tagName !== 'SUMMARY'
}
export function createFightControls(onAction: (side: FightSide, action: PadAction) => void) {
  const bindings = writable<KeyboardBindings>(defaultBindings())
  const scheme = writable<ControlScheme>('simplified')
  const devices = writable<{ names: string[]; unsupported: boolean }>({
    names: ['', ''],
    unsupported: false,
  })
  const keyboard = createKeyboardMapper()
  const gamepads = createGamepadReader(true)
  const rightStickLayout = writable<RightStickLayout>([...RIGHT_STICK_ACTIONS])
  const directionalZetsu = writable(false)
  let localSeats: boolean | undefined
  let status = ''
  return {
    bindings,
    devices,
    scheme,
    rightStickLayout,
    directionalZetsu,
    load() {
      bindings.set(readBindings(storage()))
      scheme.set(readControlScheme(storage()))
      rightStickLayout.set(readStickLayout(storage()))
      directionalZetsu.set(readDirectionalZetsu())
    },
    saveDirectionalZetsu(value: boolean) {
      directionalZetsu.set(value)
      writeControlSetting(DIRECTIONAL_ZETSU_STORAGE, value ? '1' : '0')
    },
    swapStickAction(direction: number, action: RightStickLayout[number]) {
      const layout = [...get(rightStickLayout)]
      const other = layout.indexOf(action)
      if (other < 0 || !layout[direction]) return
      ;[layout[direction], layout[other]] = [layout[other], layout[direction]]
      rightStickLayout.set(layout)
      writeControlSetting(STICK_LAYOUT_STORAGE, JSON.stringify(layout))
    },
    saveScheme(value: ControlScheme) {
      scheme.set(value)
      saveControlScheme(value, storage())
    },
    schemesFor(mode: FightMode, touch: boolean) {
      return fightControlSchemes({ mode, preference: get(scheme), touch })
    },
    save(value: KeyboardBindings) {
      bindings.set(value)
      saveBindings(value, storage())
    },
    release() {
      keyboard.clear()
      resetKeyboardChords()
      gamepads.release()
    },
    combine(side: FightSide, input: FightInput) {
      const combined = mergeFightInput(input, gamepads.inputs[side])
      if (combined.directControls && get(directionalZetsu)) combined.directionalZetsu = true
      return combined
    },
    key(
      event: KeyboardEvent,
      active: boolean,
      handle: (event: KeyboardEvent, active: boolean) => void,
    ) {
      if (ignoresFightKey(event, active)) return
      if (active && (event.metaKey || event.ctrlKey || event.altKey)) return
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
      if (mode && localSeats !== (mode === 'versus-local')) {
        localSeats = mode === 'versus-local'
        gamepads.resetSeats()
      }
      const frame = gamepads.poll(browserPads(), enabled && !editing, {
        local: localSeats,
        layout: get(rightStickLayout),
      })
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
const STICK_LAYOUT_STORAGE = 'black-whale:fighting-stick:v1'
const DIRECTIONAL_ZETSU_STORAGE = 'black-whale:fighting-directional-zetsu:v1'
function writeControlSetting(key: string, value: string): void {
  try {
    storage()?.setItem(key, value)
  } catch {
    // The setting is still available in this session.
  }
}
function readDirectionalZetsu(): boolean {
  try {
    return storage()?.getItem(DIRECTIONAL_ZETSU_STORAGE) === '1'
  } catch {
    return false
  }
}
function readStickLayout(storage?: Storage): RightStickLayout {
  try {
    const layout = JSON.parse(storage?.getItem(STICK_LAYOUT_STORAGE) ?? 'null')
    if (
      Array.isArray(layout) &&
      layout.length === RIGHT_STICK_ACTIONS.length &&
      RIGHT_STICK_ACTIONS.every((action) => layout.includes(action))
    )
      return layout
  } catch {
    // Use defaults if the stored layout is unavailable.
  }
  return [...RIGHT_STICK_ACTIONS]
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
  attack: (kind: MoveAction | AttackKind | 'ranged') => void
  action: (key: string) => void
}
export function dispatchFightKey(event: KeyboardEvent, active: boolean, options: KeyDispatch) {
  if (event.key.startsWith('direct:')) return dispatchDirectFightKey(event, active, options)
  if (handleEasterKey(event, { ...options, active }, options.easter)) return
  if (
    dispatchOpponentKey(event, active, {
      mode: options.state.mode,
      input: options.opponentInput,
      control: options.opponentControl,
      attack: options.opponentAttack,
    })
  )
    return
  if (
    dispatchPlayerAttackKey(event, active, {
      input: options.input,
      control: options.control,
      onMove: options.attack,
    })
  )
    return
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  const movement = playerMovementKey(key, options.state.mode === 'versus-ai')
  if (movement) {
    event.preventDefault()
    options.control(movement, active)
    return
  }
  if (!active || event.repeat) return
  if (['p', 'Enter'].includes(key)) event.preventDefault()
  options.action(key)
}
