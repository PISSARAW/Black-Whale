import { describe, expect, it, vi } from 'vitest'
import { dispatchDirectFightKey } from '../../routes/fighting/directFightKeyboard'
import { createKeyboardMapper, defaultBindings } from './fightInputBindings'
import { createGamepadReader, type FightPad } from './fightGamepad'
import { createFightState } from './fightState'
import { applyAuraContext } from './nen'
import { performMove, tickFight } from './engine'
import { performTrainingAction } from './trainingAction'
import { packReplayInput, unpackReplayInput } from './fightReplayInput'
import { EMPTY_INPUT } from './types'

const direct = { ...EMPTY_INPUT, directControls: true }

function pad(buttons: number[] = [], axes = [0, 0, 0, 0]): FightPad {
  return {
    index: 0,
    id: 'Pad',
    connected: true,
    mapping: 'standard',
    axes,
    buttons: Array.from({ length: 16 }, (_, index) => ({
      pressed: buttons.includes(index),
      value: Number(buttons.includes(index)),
    })),
  }
}

describe('direct Clash controls', () => {
  it('matches physical movement on AZERTY and QWERTY and keeps P out of the Nen layer', () => {
    const bindings = defaultBindings()
    for (const label of ['q', 'a']) {
      const keyboard = createKeyboardMapper()
      expect(keyboard.key({ key: label, code: 'KeyA' }, true, bindings)).toBe('direct:playerLeft')
    }
    for (const code of ['KeyM', 'Semicolon']) {
      const keyboard = createKeyboardMapper()
      expect(keyboard.key({ key: 'm', code }, true, bindings)).toBe('direct:playerThrow')
    }
    expect(createKeyboardMapper().key({ key: ',', code: 'KeyM' }, true, bindings)).toBeNull()
    const keyboard = createKeyboardMapper()
    keyboard.key({ key: 'v', code: 'KeyV' }, true, bindings)
    expect(keyboard.key({ key: 'p', code: 'KeyP' }, true, bindings)).toBe('p')
    const action = { key: 'l', code: 'KeyL' }
    expect(keyboard.key(action, true, bindings)).toBe('direct:nen:playerSpecial')
    keyboard.key({ key: 'v', code: 'KeyV' }, false, bindings)
    expect(keyboard.key(action, false, bindings)).toBe('direct:nen:playerSpecial')
  })

  it('sends independent projectile, Hatsu and Nen inputs', () => {
    const attack = vi.fn(),
      control = vi.fn()
    const press = (key: string) =>
      dispatchDirectFightKey({ key, preventDefault: vi.fn() } as unknown as KeyboardEvent, true, {
        attack,
        control,
      })
    press('direct:playerProjectile')
    expect(attack).toHaveBeenLastCalledWith('ranged')
    expect(control).not.toHaveBeenCalledWith('hatsu', true)
    press('direct:playerSpecial')
    expect(attack).toHaveBeenLastCalledWith('special')
    expect(control).toHaveBeenCalledWith('hatsu', true)
    press('direct:nen:playerLight')
    expect(attack).toHaveBeenCalledTimes(2)
    expect(control).toHaveBeenLastCalledWith('en', true)
  })

  it('keeps guard, Aura and Kaméo independent and requires stick neutral before a second command', () => {
    const reader = createGamepadReader(true)
    reader.poll([pad()], true, { local: true })
    const pressed = reader.poll([pad([2, 4, 5, 7], [0, 0, -1, 0])], true, { local: true })
    expect(pressed.actions.map(({ action }) => action)).toEqual(['special', 'ranged'])
    expect(pressed.names).toEqual(['', 'Pad'])
    expect(reader.inputs.opponent).toMatchObject({
      guard: true,
      aura: true,
      kameo: true,
      hatsu: true,
    })
    expect(reader.poll([pad([], [0, 0, 1, 0])], true).actions).toEqual([])
    expect(reader.inputs.opponent.hatsu).toBe(false)
    reader.poll([pad()], true)
    expect(reader.poll([pad([], [0, 0, 1, 0])], true).actions[0]?.action).toBe('throw')
  })

  it('keeps downward movement and explicit Zetsu distinct while preserving the compatibility shortcut', () => {
    const state = createFightState('kurapika', 'hisoka')
    const down = { ...direct, aura: true, down: true }
    expect(applyAuraContext(state.player, down).nen.mode).toBe('ren')
    expect(applyAuraContext(state.player, { ...down, directionalZetsu: true }).nen.mode).toBe(
      'zetsu',
    )
    const input = unpackReplayInput(packReplayInput({ ...direct, zetsuIntent: true, en: true }))
    expect(applyAuraContext(state.player, input).nen).toMatchObject({ mode: 'zetsu', en: null })
  })

  it('keeps the On oath separate from an Aura-held special', () => {
    let state = { ...createFightState('kurapika', 'hisoka'), phase: 'fighting' as const }
    state = { ...state, player: { ...state.player, on: { grudge: 80, sealFrames: 0 } } }
    const special = performMove({
      state,
      side: 'player',
      action: 'special',
      input: { ...direct, aura: true, hatsu: true },
    })
    expect(special.player.nen.on).toBe(false)
    expect(applyAuraContext(state.player, { ...direct, onIntent: true }).nen.on).toBe(true)
  })

  it('flushes a direct move once after hitstop', () => {
    const state = {
      ...createFightState('kurapika', 'hisoka'),
      phase: 'fighting' as const,
      hitstop: 2,
    }
    const queued = performTrainingAction({ state, side: 'player', action: 'light', input: direct })
    expect(queued.player.attack).toBeNull()
    const frozen = tickFight(queued, direct, 2 / 60)
    expect(frozen.player.attack).toBeNull()
    const released = tickFight(frozen, direct, 1 / 60)
    expect(released.player.attack?.kind).toBe('light')
    expect(released.directMoveBuffer).toBeUndefined()
  })
})
