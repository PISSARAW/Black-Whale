import { describe, expect, it, vi } from 'vitest'
import {
  defaultBindings,
  assignControlKey,
  bindingError,
  createKeyboardMapper,
  readBindings,
  saveBindings,
} from './fightInputBindings'
import { createGamepadReader, mergeFightInput, sampleGamepad, type FightPad } from './fightGamepad'
import { EMPTY_INPUT } from './types'
import { moveInputHint } from './fightControlHints'
import { dispatchFightKey } from '../../routes/fighting/fightingControls'
import { createFightState } from './fightState'

function pad(buttons: number[] = [], axes = [0, 0], index = 0): FightPad {
  return {
    index,
    id: `Pad ${index}`,
    connected: true,
    mapping: 'standard',
    axes,
    buttons: Array.from({ length: 17 }, (_, button) => ({
      pressed: buttons.includes(button),
      value: Number(buttons.includes(button)),
    })),
  }
}
const key = (value: string, code = value) => ({ key: value, code })

describe('fight keyboard configuration', () => {
  it('keeps the 8-button layout and pause distinct for both players', () => {
    const keys = defaultBindings()
    expect(bindingError(keys)).toBeNull()
    expect(keys.playerKameo).toBe('u')
    expect(keys.playerBurst).toBe('o')
    expect(keys.playerContext).toBe('h')
    expect(keys.opponentKameo).toBe('.')
    expect(keys.opponentBurst).toBe('/')
    expect(keys.opponentContext).toBe('b')
    expect(keys.pause).toBe('p')
  })
  it('rejects duplicate keys, browser shortcuts and Easter Egg keys', () => {
    for (const value of ['k', 'F2', 'F4', 'F5', 'Tab', 'Escape'])
      expect(assignControlKey(defaultBindings(), 'playerLight', value)).toBeNull()
  })
  it('remaps the physical key and disables its former primary shortcut', () => {
    const duplicate = assignControlKey(defaultBindings(), 'playerLight', 'M')
    expect(duplicate).toBeNull() // P2 heavy already owns M.
    const custom = assignControlKey(defaultBindings(), 'playerLight', 'é')!
    const mapper = createKeyboardMapper()
    expect(mapper.key(key('é', 'KeyE'), true, custom)).toBe('j')
    expect(mapper.key(key('j', 'KeyJ'), true, custom)).toBeNull()
  })
  it('releases the original command when remapping takes place during a held key', () => {
    const mapper = createKeyboardMapper()
    const original = assignControlKey(defaultBindings(), 'playerLight', 'é')!
    mapper.key(key('é', 'KeyE'), true, original)
    expect(mapper.key(key('é', 'KeyE'), true, defaultBindings())).toBe('j')
    expect(mapper.key(key('é', 'KeyE'), false, defaultBindings())).toBe('j')
  })
  it('loads only complete valid bindings and tolerates damaged or inaccessible storage', () => {
    const original = assignControlKey(defaultBindings(), 'playerLight', 'é')!
    const setItem = vi.fn()
    saveBindings(original, { setItem })
    expect(readBindings({ getItem: () => setItem.mock.calls[0][1] })).toEqual(original)
    for (const saved of ['{', 'null', '{}', JSON.stringify({ ...original, playerLight: 'k' })])
      expect(readBindings({ getItem: () => saved })).toEqual(defaultBindings())
    expect(
      readBindings({
        getItem: () => {
          throw Error('denied')
        },
      }),
    ).toEqual(defaultBindings())
    expect(() =>
      saveBindings(original, {
        setItem: () => {
          throw Error('quota')
        },
      }),
    ).not.toThrow()
  })
})

describe('standard fighting gamepads', () => {
  it('applies stick hysteresis so drift does not cause a dash', () => {
    expect(sampleGamepad(pad([], [0.45, 0]), null).input.right).toBe(false)
    const held = sampleGamepad(pad([], [0.6, 0]), null)
    expect(held.input.right).toBe(true)
    expect(sampleGamepad(pad([], [0.4, 0]), null, held.input).input.right).toBe(true)
    expect(sampleGamepad(pad([], [0.25, 0]), null, held.input).input.right).toBe(false)
  })
  it('triggers attacks and Hatsu once on press (no negative edge)', () => {
    expect(sampleGamepad(pad([0]), pad()).actions).toEqual(['light'])
    expect(sampleGamepad(pad([0]), pad([0])).actions).toEqual([])
    const hatsuPress = sampleGamepad(pad([2]), pad())
    expect(hatsuPress.input.hatsu).toBe(true)
    expect(hatsuPress.actions).toEqual(['special'])
    expect(sampleGamepad(pad(), pad([2])).actions).toEqual([])
    expect(sampleGamepad(pad(), pad()).actions).toEqual([])
  })
  it('requires neutral after connection and does not fire a held attack on startup', () => {
    const reader = createGamepadReader()
    expect(reader.poll([pad([0])], true).actions).toEqual([])
    reader.poll([pad()], true)
    expect(reader.poll([pad([0])], true).actions).toEqual([{ side: 'player', action: 'light' }])
  })
  it('keeps P2 assigned when P1 disconnects and releases movement without firing Hatsu', () => {
    const reader = createGamepadReader()
    reader.poll([pad(), pad([], [0, 0], 1)], true)
    reader.poll([pad([2], [-1, 0]), pad([1], [1, 0], 1)], true)
    const frame = reader.poll([null, pad([], [1, 0], 1)], true)
    expect(frame.names).toEqual(['', 'Pad 1'])
    expect(frame.actions).toEqual([])
    expect(reader.inputs.player.left).toBe(false)
    expect(reader.inputs.opponent.right).toBe(true)
  })
  it('does not overwrite the keyboard when the gamepad releases a direction', () => {
    expect(mergeFightInput({ ...EMPTY_INPUT, left: true }, EMPTY_INPUT).left).toBe(true)
    expect(mergeFightInput(EMPTY_INPUT, { ...EMPTY_INPUT, aura: true }).aura).toBe(true)
  })
  it('allows Start to resume paused play but requires neutral before fighting again', () => {
    const reader = createGamepadReader()
    reader.poll([pad()], true)
    reader.poll([pad()], false)
    expect(reader.poll([pad([9])], false).actions).toEqual([{ side: 'player', action: 'pause' }])
    expect(reader.poll([pad([0])], true).actions).toEqual([])
    reader.poll([pad()], true)
    expect(reader.poll([pad([0])], true).actions).toHaveLength(1)
  })
  it('snapshots mutable browser button objects and clears held inputs on blur', () => {
    const reader = createGamepadReader()
    const mutable = pad()
    reader.poll([mutable], true)
    mutable.buttons[0].pressed = true
    expect(reader.poll([mutable], true).actions).toHaveLength(1)
    reader.poll([pad([], [-1, 0])], true)
    reader.release()
    expect(reader.inputs.player.left).toBe(false)
    expect(reader.poll([pad([], [-1, 0])], true).actions).toEqual([])
    expect(reader.inputs.player.left).toBe(false)
  })
  it('reports nonstandard controllers without guessing their button layout', () => {
    const reader = createGamepadReader()
    const frame = reader.poll([{ ...pad([0]), mapping: '' }], true)
    expect(frame.unsupported).toBe(true)
    expect(frame.actions).toEqual([])
    expect(frame.names).toEqual(['', ''])
  })
})

describe('configured fight input dispatch', () => {
  it('does not emit key-up commands that were consumed by an editor or cleared on blur', () => {
    const mapper = createKeyboardMapper()
    expect(mapper.key(key('l'), false, defaultBindings())).toBeNull()
    mapper.key(key('l'), true, defaultBindings())
    mapper.clear()
    expect(mapper.key(key('l'), false, defaultBindings())).toBeNull()
  })
  it('keeps burst, context and pause reachable in local mode', () => {
    const action = vi.fn(),
      control = vi.fn(),
      opponentControl = vi.fn()
    const options = {
      state: createFightState('kurapika', 'hisoka', { mode: 'versus-local' }),
      keys: { player: 'F2', opponent: 'F4' },
      input: EMPTY_INPUT,
      opponentInput: EMPTY_INPUT,
      easter: vi.fn(),
      control,
      opponentControl,
      opponentAttack: vi.fn(),
      attack: vi.fn(),
      action,
    }
    for (const key of ['o', 'h', 'p', 'b', '/']) {
      dispatchFightKey(
        { key, repeat: false, preventDefault: vi.fn() } as unknown as KeyboardEvent,
        true,
        options,
      )
    }
    expect(action.mock.calls.map(([key]) => key)).toEqual(['p'])
    expect(control).toHaveBeenCalledWith('burst', true)
    expect(control).toHaveBeenCalledWith('context', true)
    expect(opponentControl).toHaveBeenCalledWith('context', true)
    expect(opponentControl).toHaveBeenCalledWith('burst', true)
  })
  it('renders configured move commands without replacing technique names', () => {
    const bindings = { ...defaultBindings(), playerSpecial: 'é', playerHeavy: '`' }
    expect(moveInputHint('← + L / H', bindings)).toBe('← + é / `+é')
    expect(moveInputHint('HISOKA · HATSU · KO', bindings)).toBe('HISOKA · HATSU · KO')
    expect(moveInputHint('L / H', bindings, 'opponent')).toBe(', / m+,')
  })
})

it('does not trigger Hatsu accidentally when focus returns after blur', () => {
  const reader = createGamepadReader()
  reader.poll([pad()], true)
  reader.poll([pad([2])], true)
  reader.release()
  expect(reader.poll([pad()], true).actions).toEqual([])
  expect(reader.poll([pad([2])], true).actions).toEqual([{ side: 'player', action: 'special' }])
  expect(reader.poll([pad()], true).actions).toEqual([])
})
