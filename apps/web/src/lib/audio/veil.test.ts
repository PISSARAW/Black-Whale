import { describe, expect, it } from 'vitest'

import { setWorldVeil, veiled, worldVeil } from './veil'

/**
 * jsdom has no Web Audio, and what is under test is the shape of the graph and
 * the direction the parameters move — not the sound. Every param records the
 * last target it was given.
 */
function fakeContext() {
  const connections: string[] = []
  const node = (name: string) => {
    const param = () => ({
      value: 0,
      target: null as number | null,
      cancelScheduledValues: () => undefined,
      setTargetAtTime(value: number) {
        this.target = value
      },
    })
    return {
      name,
      connect: (to: { name: string }) => connections.push(`${name}->${to.name}`),
      type: '',
      Q: { value: 0 },
      frequency: param(),
      gain: param(),
    }
  }
  return {
    connections,
    context: {
      currentTime: 0,
      createBiquadFilter: () => node('filter'),
      createGain: () => node('gain'),
    } as never,
  }
}

describe('the veil over the ordinary world', () => {
  it('puts a filter in front of the ship and none in front of the techniques', () => {
    const { context, connections } = fakeContext()
    const limiter = { name: 'limiter' } as never

    const ambient = veiled(context, 'ambient', limiter)
    const effects = veiled(context, 'effects', limiter)

    expect(ambient).not.toBe(limiter)
    expect(effects).toBe(limiter)
    expect(connections).toEqual(['filter->filter', 'filter->gain', 'gain->limiter'])
  })

  it('closes the cutoff and the level together, and opens them again', () => {
    const { context } = fakeContext()
    const entry = veiled(context, 'walk', { name: 'limiter' } as never) as unknown as {
      frequency: { target: number }
    }

    setWorldVeil(1)
    const closed = entry.frequency.target
    setWorldVeil(0)

    expect(closed).toBeLessThan(2000)
    expect(entry.frequency.target).toBeGreaterThan(10000)
    expect(worldVeil()).toBe(0)
  })

  it('clamps whatever it is handed', () => {
    setWorldVeil(4)
    expect(worldVeil()).toBe(1)
    setWorldVeil(-1)
    expect(worldVeil()).toBe(0)
  })
})
