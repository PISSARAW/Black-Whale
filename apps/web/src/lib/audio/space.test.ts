import { describe, expect, it } from 'vitest'

import {
  emissionColour,
  emissionDetune,
  emissionLevel,
  emissionTarget,
  listenerNow,
  setFacing,
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
  const panners: {
    positionX: { value: number }
    positionY: { value: number }
    positionZ: { value: number }
  }[] = []
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
      const panner = {
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
      panners.push(panner)
      return panner
    },
  }
  return { built, panners, sink: { context, muffle: { id: 'muffle' } } as never }
}

/** Where the one panner of a cast made at `at` ended up, seen from the ear. */
function heardAt(at: [number, number]) {
  const { panners, sink } = fakeContext()
  soundedFrom({ at, spaceId: 'hold' }, () => emissionTarget(sink))
  const panner = panners[0]
  return { x: panner.positionX.value, y: panner.positionY.value, z: panner.positionZ.value }
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
    setListener({ at: [0, 0], heading: 0, pitch: 0, spaceId: 'hold' })
    const { built, sink } = fakeContext()
    soundedFrom({ at: [4, 4], spaceId: 'hold' }, () => emissionTarget(sink))
    expect(built).toContain('panner')
    expect(built).not.toContain('filter')
  })

  it('puts a wall in front of a sound made in another room', () => {
    setListener({ at: [0, 0], heading: 0, pitch: 0, spaceId: 'hold' })
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
    setListener({ at: [3, -7], heading: 1.2, pitch: -0.3, spaceId: 'promenade' })
    expect(listenerNow()).toEqual({
      at: [3, -7],
      heading: 1.2,
      pitch: -0.3,
      spaceId: 'promenade',
    })
  })
})

/**
 * The half of the ear the walk never told: a visitor who stands still and looks
 * round used to hear a frozen room. Both of these failed before `setFacing` and
 * the pitch existed, which is the whole reason they are written down.
 */
describe('turning without moving', () => {
  it('swings a cast across the head when the visitor turns to face it', () => {
    setListener({ at: [0, 0], heading: 0, pitch: 0, spaceId: 'hold' })
    const before = heardAt([6, 0])
    expect(before.x).toBeGreaterThan(1)

    // A quarter turn brings what was on the right round to straight ahead.
    setFacing(-Math.PI / 2, 0)
    const after = heardAt([6, 0])
    expect(Math.abs(after.x)).toBeLessThan(1e-9)
    expect(after.z).toBeLessThan(-1)
  })

  it('tips the room the other way when the visitor looks up', () => {
    setListener({ at: [0, 0], heading: 0, pitch: 0, spaceId: 'hold' })
    // Straight ahead of a visitor facing along the walk's own forward.
    const level = heardAt([0, -6])
    expect(level.z).toBeLessThan(-1)
    expect(Math.abs(level.y)).toBeLessThan(1e-9)

    setFacing(0, 0.6)
    const raised = heardAt([0, -6])
    // Looking up drops what is in front of you below the line of sight, and
    // takes nothing off the distance while doing it.
    expect(raised.y).toBeLessThan(-1)
    expect(Math.hypot(raised.x, raised.y, raised.z)).toBeCloseTo(
      Math.hypot(level.x, level.y, level.z),
      9,
    )
  })

  it('leaves the room and the place alone when only the head turns', () => {
    setListener({ at: [3, -7], heading: 0, pitch: 0, spaceId: 'promenade' })
    setFacing(2.1, 0.4)
    expect(listenerNow().at).toEqual([3, -7])
    expect(listenerNow().spaceId).toBe('promenade')
    expect(listenerNow().heading).toBe(2.1)
  })
})
