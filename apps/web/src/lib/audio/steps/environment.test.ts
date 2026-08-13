import { describe, expect, it } from 'vitest'

import { WATERLINE } from '$lib/tour/sea'

import {
  buildEnvironment,
  type Environment,
  orientEnvironment,
  settleEnvironment,
} from './environment'

/**
 * jsdom has no Web Audio, and what is worth asserting here is not the sound but
 * the geometry: which side of the ear the water is on, which side the engines
 * are on, and whether either moves when the visitor turns their head. Every
 * parameter is written straight through rather than ramped, so a test reads the
 * value the ramp is aimed at.
 */
function fakeContext() {
  const connect = () => undefined
  const param = (value = 0) => ({
    value,
    cancelScheduledValues: () => undefined,
    setTargetAtTime(target: number) {
      this.value = target
    },
  })
  const context = {
    sampleRate: 8000,
    currentTime: 0,
    createGain: () => ({ connect, context, gain: param(0) }),
    createBiquadFilter: () => ({ connect, type: '', frequency: param(0), Q: param(0) }),
    createOscillator: () => ({ connect, start: connect, type: '', frequency: param(0) }),
    createBufferSource: () => ({ connect, start: connect, buffer: null, loop: false }),
    createBuffer: () => ({ copyToChannel: () => undefined }),
    createPanner: () => ({
      connect,
      context,
      panningModel: '',
      distanceModel: '',
      refDistance: 0,
      rolloffFactor: 1,
      positionX: param(0),
      positionY: param(0),
      positionZ: param(0),
    }),
  }
  return context as unknown as AudioContext
}

const build = () => buildEnvironment(fakeContext(), { id: 'muffle' } as unknown as AudioNode)

const heard = (env: Environment, which: 'hull' | 'sea') => {
  const panner = env.panners[which]
  return { x: panner.positionX.value, y: panner.positionY.value, z: panner.positionZ.value }
}

const away = (at: { x: number; y: number; z: number }) => Math.hypot(at.x, at.y, at.z)

describe('where the ship puts its own two noises', () => {
  it('holds the water over the visitor on Tier 5 and under them on Tier 1', () => {
    const env = build()

    settleEnvironment(env, 0)
    expect(heard(env, 'sea').y).toBeGreaterThan(0)

    settleEnvironment(env, 128)
    expect(heard(env, 'sea').y).toBeLessThan(0)
  })

  it('leaves the water where it was on the waterline itself, which has no side', () => {
    const env = build()
    settleEnvironment(env, 0)
    const before = heard(env, 'sea')
    settleEnvironment(env, WATERLINE)
    expect(heard(env, 'sea')).toEqual(before)
  })

  it('keeps the engines under the visitor on every deck, and further under the higher they climb', () => {
    const env = build()
    settleEnvironment(env, 0)
    const hold = heard(env, 'hull')
    settleEnvironment(env, 128)
    const king = heard(env, 'hull')

    expect(hold.y).toBeLessThan(0)
    expect(king.y).toBeLessThan(hold.y)
  })

  it('places both by direction alone, at one fixed distance', () => {
    const env = build()
    settleEnvironment(env, 0)
    const near = away(heard(env, 'hull'))
    settleEnvironment(env, 128)
    // A hundred and thirty-four metres down and eight metres down come out at
    // the same radius: the level curves do the dosing, the panner does not.
    expect(away(heard(env, 'hull'))).toBeCloseTo(near, 9)
    expect(away(heard(env, 'sea'))).toBeCloseTo(near, 9)
  })
})

describe('turning the visitor', () => {
  it('swings the engines across the head, because they are aft and not merely below', () => {
    const env = build()
    settleEnvironment(env, 96)
    const facing = heard(env, 'hull')

    orientEnvironment(env, { heading: Math.PI, pitch: 0 })
    const turned = heard(env, 'hull')
    expect(turned.x).toBeCloseTo(-facing.x, 9)
    expect(Math.abs(facing.x)).toBeGreaterThan(0.5)
    // And the machinery stays under the floor whichever way they are pointed.
    expect(turned.y).toBeCloseTo(facing.y, 9)
  })

  it('leaves the water on the vertical, because a surface has no bearing', () => {
    const env = build()
    settleEnvironment(env, 128)
    orientEnvironment(env, { heading: 1.9, pitch: 0 })
    const water = heard(env, 'sea')
    expect(Math.abs(water.x)).toBeLessThan(1e-9)
    expect(Math.abs(water.z)).toBeLessThan(1e-9)
    expect(water.y).toBeLessThan(0)
  })

  it('brings the water round behind the visitor when they look down at it', () => {
    const env = build()
    settleEnvironment(env, 128)
    const level = heard(env, 'sea')

    // Looking down at the floor it is under: the water rises towards the line of
    // sight and swings forward, which is what tipping the head at it means.
    orientEnvironment(env, { heading: 0, pitch: -0.7 })
    const tipped = heard(env, 'sea')
    expect(tipped.y).toBeGreaterThan(level.y)
    expect(tipped.z).toBeLessThan(-1)
  })
})

describe('how much of each reaches a deck', () => {
  it('is loudest in the machinery at the keel and loudest in the water at the waterline', () => {
    const env = build()
    settleEnvironment(env, 0)
    const hold = { hull: env.hull.gain.value, sea: env.sea.gain.value }
    settleEnvironment(env, WATERLINE)
    const surface = { hull: env.hull.gain.value, sea: env.sea.gain.value }
    settleEnvironment(env, 128)
    const king = { hull: env.hull.gain.value, sea: env.sea.gain.value }

    expect(hold.hull).toBeGreaterThan(surface.hull)
    expect(surface.hull).toBeGreaterThan(king.hull)

    expect(surface.sea).toBeGreaterThan(hold.sea)
    expect(surface.sea).toBeGreaterThan(king.sea)
  })

  it('opens the water up as the visitor climbs out of it', () => {
    const env = build()
    settleEnvironment(env, 0)
    const under = env.seaDamp.frequency.value
    settleEnvironment(env, 128)
    expect(env.seaDamp.frequency.value).toBeGreaterThan(under * 4)
    // While the ship itself goes the other way: further from the engines is duller.
    settleEnvironment(env, 0)
    const loud = env.hullDamp.frequency.value
    settleEnvironment(env, 128)
    expect(env.hullDamp.frequency.value).toBeLessThan(loud)
  })
})
