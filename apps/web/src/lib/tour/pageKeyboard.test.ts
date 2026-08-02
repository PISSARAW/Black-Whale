import { describe, expect, it } from 'vitest'
import { tourShortcut } from './pageKeyboard'

const state = {
  takesOrders: false,
  immersive: false,
  nativeFullscreen: false,
  engaged: false,
  planOpen: false,
  finderOpen: false,
}

const key = (value: string, modified = false) =>
  ({ key: value, target: null, metaKey: modified, ctrlKey: false, altKey: false }) as KeyboardEvent

describe('tour shortcuts', () => {
  it('maps unmodified navigation keys', () => {
    expect(tourShortcut(key('g'), state)).toBe('toggle-reveal')
    expect(tourShortcut(key('m'), state)).toBe('toggle-plan')
    expect(tourShortcut(key('v'), state)).toBe('toggle-fullscreen')
  })

  it('reserves R for techniques that take orders', () => {
    expect(tourShortcut(key('r'), state)).toBeNull()
    expect(tourShortcut(key('r'), { ...state, takesOrders: true })).toBe('turn-technique')
  })

  it('lets escape leave only an unclaimed immersive view', () => {
    expect(tourShortcut(key('Escape'), state)).toBeNull()
    expect(tourShortcut(key('Escape'), { ...state, immersive: true })).toBe('toggle-fullscreen')
    expect(tourShortcut(key('Escape'), { ...state, immersive: true, engaged: true })).toBeNull()
  })

  it('ignores modified shortcuts', () => {
    expect(tourShortcut(key('g', true), state)).toBeNull()
  })
})
