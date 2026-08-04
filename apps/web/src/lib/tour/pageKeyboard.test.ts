import { describe, expect, it } from 'vitest'
import { tourShortcut } from './pageKeyboard'

const state = {
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
    expect(tourShortcut(key('l'), state)).toBe('toggle-reveal')
    expect(tourShortcut(key('m'), state)).toBe('toggle-plan')
    expect(tourShortcut(key('v'), state)).toBe('toggle-fullscreen')
  })

  it('leaves the whole Nen alphabet to the walk', () => {
    // Both listeners sit on `window`, so a letter shared with the walk is not
    // a choice between two meanings — it is both of them, on the one press.
    expect(tourShortcut(key('g'), state)).toBeNull()
    expect(tourShortcut(key('r'), state)).toBeNull()
    expect(tourShortcut(key('c'), state)).toBeNull()
    expect(tourShortcut(key('t'), state)).toBeNull()
    expect(tourShortcut(key('h'), state)).toBeNull()
    expect(tourShortcut(key('f'), state)).toBeNull()
  })

  it('lets escape leave only an unclaimed immersive view', () => {
    expect(tourShortcut(key('Escape'), state)).toBeNull()
    expect(tourShortcut(key('Escape'), { ...state, immersive: true })).toBe('toggle-fullscreen')
    expect(tourShortcut(key('Escape'), { ...state, immersive: true, engaged: true })).toBeNull()
  })

  it('asks for the evidence on P, and never on the key that takes a door', () => {
    // P for proof. Being handed a card when you meant to walk through the
    // bulkhead in front of you is the one collision this must not have.
    expect(tourShortcut(key('p'), state)).toBe('examine')
    expect(tourShortcut(key('e'), state)).toBeNull()
  })

  it('ignores modified shortcuts', () => {
    expect(tourShortcut(key('l', true), state)).toBeNull()
  })
})
