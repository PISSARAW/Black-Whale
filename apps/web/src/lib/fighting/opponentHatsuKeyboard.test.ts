import { expect, it, vi } from 'vitest'
import { EMPTY_INPUT } from './types'
import { dispatchOpponentKey, resetKeyboardChords } from '../../routes/fighting/fightingKeyboard'

it('triggers P2 Hatsu on-press (no negative edge) while tracking held hatsu state', () => {
  resetKeyboardChords()
  const control = vi.fn(),
    attack = vi.fn()
  const options = { mode: 'versus-local' as const, input: EMPTY_INPUT, control, attack }
  const event = { key: ',', repeat: false, preventDefault: vi.fn() } as unknown as KeyboardEvent
  expect(dispatchOpponentKey(event, true, options)).toBe(true)
  expect(control).toHaveBeenLastCalledWith('hatsu', true)
  expect(attack).toHaveBeenCalledTimes(1)
  expect(attack).toHaveBeenCalledWith('special')
  dispatchOpponentKey(event, false, options)
  expect(attack).toHaveBeenCalledTimes(1)
  expect(control).toHaveBeenLastCalledWith('hatsu', false)
  expect(dispatchOpponentKey(event, true, { ...options, mode: 'versus-ai' })).toBe(false)
})
