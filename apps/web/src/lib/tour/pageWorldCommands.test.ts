import { describe, expect, it } from 'vitest'
import { EMPTY_WORLD } from './hatsu'
import { releaseTourWorld } from './pageWorldCommands'

describe('releasing persistent tour memory', () => {
  it('drops Luini’s live route but remembers visited and permanently burnt rooms', () => {
    const released = releaseTourWorld({
      ...EMPTY_WORLD,
      trail: ['visited'],
      spatial: {
        anchorId: 'anchor',
        destinationId: 'visited',
        visited: ['anchor', 'visited'],
        burned: ['old-anchor'],
        transiting: { from: 'anchor', to: 'visited' },
      },
    }).world

    expect(released.spatial).toEqual({
      anchorId: null,
      destinationId: null,
      visited: ['anchor', 'visited'],
      burned: ['old-anchor'],
      transiting: null,
    })
    expect(released.trail).toEqual(['visited'])
  })
})
