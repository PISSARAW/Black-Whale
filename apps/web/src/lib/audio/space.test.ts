import { describe, expect, it } from 'vitest'

import {
  emissionColour,
  emissionDetune,
  emissionLevel,
  emissionTarget,
  listenerNow,
  setListener,
  soundedFrom,
} from './space'

/**
 * A context that records what was built, which is all these tests read.
 *
 * jsdom has no Web Audio, and the point of the module under test is the shape
 * of the graph it assembles rather than the sound coming out of it: whether a
 * panner appears at all, whether a wall is put in front of it, and where the
 * source ends up relative to the ear.
 */
function fakeContext() {
  const built: string[] = []
  const connect = () => undefined
  const param = () => ({ value: 0 })
  const context = {
    createGain: () => {
      built.push('gain')
      return { connect, gain: { value: 1 } }
    },
    createBiquadFilter: () => {
      built.push('filter')
      return { connect, type: '', frequency: { value: 0 }, Q: { value: 0 } }
    },
    createPanner: () => {
      built.push('panner')
      return {
        connect,
        panningModel: '',
        distanceModel: '',
        refDistance: 0,
        rolloffFactor: 0,
        maxDistance: 0,
        positionX: param(),
        positionY: param(),
        positionZ: param(),
      }
    },
  }
  return { built, sink: { context, muffle: { id: 'muffle' } } as never }
}

describe('the emission', () => {
  it('varies nothing outside a cast', () => {
    expect(emissionDetune()).toBe(0)
    expect(emissionColour()).toBe(1)
    expect(emissionLevel()).toBe(1)
  })

  it('varies pitch, colour and level inside one, and puts them back after', () => {
    soundedFrom(null, () => {
      expect(Math.abs(emissionDetune())).toBeLessThanOrEqual(14)
      expect(emissionColour()).toBeGreaterThan(0.9)
      expect(emissionColour()).toBeLessThan(1.1)
      expect(emissionLevel()).toBeGreaterThan(0.85)
    })
    expect(emissionDetune()).toBe(0)
  })

  it('detunes every voice of one cast by the same amount', () => {
    soundedFrom(null, () => {
      expect(emissionDetune()).toBe(emissionDetune())
    })
  })

  it('gives every voice of one cast the same target, and builds it once', () => {
    const { built, sink } = fakeContext()
    soundedFrom({ at: [10, 0], spaceId: 'a' }, () => {
      const first = emissionTarget(sink)
      expect(emissionTarget(sink)).toBe(first)
    })
    expect(built.filter((node) => node === 'panner')).toHaveLength(1)
  })
})

describe('what the ear is given', () => {
  it('places a sound made in the room the visitor is in, without a wall', () => {
    setListener({ at: [0, 0], heading: 0, spaceId: 'hold' })
    const { built, sink } = fakeContext()
    soundedFrom({ at: [4, 4], spaceId: 'hold' }, () => emissionTarget(sink))
    expect(built).toContain('panner')
    expect(built).not.toContain('filter')
  })

  it('puts a wall in front of a sound made in another room', () => {
    setListener({ at: [0, 0], heading: 0, spaceId: 'hold' })
    const { built, sink } = fakeContext()
    soundedFrom({ at: [4, 4], spaceId: 'cabin' }, () => emissionTarget(sink))
    expect(built).toContain('filter')
  })

  it('places nothing at all for a cast that happened at the visitor', () => {
    const { built, sink } = fakeContext()
    soundedFrom(null, () => emissionTarget(sink))
    expect(built).not.toContain('panner')
  })

  it('remembers where the visitor is standing and which way they face', () => {
    setListener({ at: [3, -7], heading: 1.2, spaceId: 'promenade' })
    expect(listenerNow()).toEqual({ at: [3, -7], heading: 1.2, spaceId: 'promenade' })
  })
})
