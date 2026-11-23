import { describe, expect, it } from 'vitest'
import { createKeyboardMapper, defaultBindings } from '../fighting/fightInputBindings'
import { ARENA_MOVE_KEYS } from './fighting'

describe('Arena Clash controls', () => {
  it('uses the same default offensive buttons as Clash', () => {
    expect(ARENA_MOVE_KEYS).toEqual({
      light: { code: 'KeyJ', label: 'J' },
      heavy: { code: 'KeyK', label: 'K' },
      special: { code: 'KeyL', label: 'L' },
      throw: { code: 'KeyM', label: 'M' },
      finisher: { code: 'KeyI', label: 'I' },
    })
  })

  it('inherits Clash remapping and its Nen layer', () => {
    const mapper = createKeyboardMapper()
    const bindings = { ...defaultBindings(), playerHeavy: '`' }

    expect(mapper.key({ key: '`', code: 'Backquote' }, true, bindings)).toBe('direct:playerHeavy')
    mapper.clear()
    expect(mapper.key({ key: 'v', code: 'KeyV' }, true, bindings)).toBe('direct:playerNen')
    expect(mapper.key({ key: '`', code: 'Backquote' }, true, bindings)).toBe(
      'direct:nen:playerHeavy',
    )
  })
})
