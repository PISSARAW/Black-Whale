import { expect, it, vi } from 'vitest'
import { dispatchOpponentKey } from '../../routes/fighting/fightingKeyboard'
it('holds the P2 Hatsu for Nen charging and releases once like P1', () => {
  const control = vi.fn(),
    attack = vi.fn()
  const options = { mode: 'versus-local' as const, control, attack }
  const event = { key: ',', repeat: false, preventDefault: vi.fn() } as unknown as KeyboardEvent
  expect(dispatchOpponentKey(event, true, options)).toBe(true)
  expect(control).toHaveBeenLastCalledWith('hatsu', true)
  expect(attack).not.toHaveBeenCalled()
  dispatchOpponentKey(event, false, options)
  expect(attack).toHaveBeenCalledTimes(1)
  expect(attack).toHaveBeenCalledWith('special')
  expect(control).toHaveBeenLastCalledWith('hatsu', false)
  expect(dispatchOpponentKey(event, true, { ...options, mode: 'versus-ai' })).toBe(false)
})
