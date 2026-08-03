import { describe, it, expect } from 'vitest'
import {
  ECHO_LASTS,
  fade,
  HEARING_RANGE,
  noEchoes,
  quietFeedback,
  ring,
  senseAround,
  THROUGH_A_WALL,
  type Sensed,
} from './feedback'

const silence = noEchoes()

function sensed(over: Partial<Sensed> = {}): Sensed {
  return { at: [0, 0], hunterAt: [5, 0], earshot: 'same', ...over }
}

describe('nothing to report', () => {
  it('is quiet by default', () => {
    expect(quietFeedback()).toEqual({
      sweptFrom: null,
      footsteps: null,
      entraveSprung: false,
      entraveFound: false,
    })
  })
})

describe('a sweep felt', () => {
  const rung = ring(noEchoes(), { sweptFrom: [0, 10] })

  it('comes back as a bearing, never as a place', () => {
    expect(senseAround(sensed(), rung).sweptFrom).toEqual([0, 1])
  })

  it('is null when the sweep came from where you are standing', () => {
    const onTop = ring(noEchoes(), { sweptFrom: [0, 0] })
    expect(senseAround(sensed(), onTop).sweptFrom).toBeNull()
  })
})

describe('signals that ring rather than fire', () => {
  it('go on being felt long enough to be read', () => {
    // The defect this exists to prevent: at sixty ticks a second, a signal that
    // lasted one tick was on screen for sixteen milliseconds.
    let echoes = ring(noEchoes(), { sweptFrom: [0, 10], sprung: true, found: true })
    for (let tick = 0; tick < 30; tick += 1) echoes = fade(echoes, 1 / 60)
    const half = senseAround(sensed(), echoes)
    expect(half.sweptFrom).not.toBeNull()
    expect(half.entraveSprung).toBe(true)
    expect(half.entraveFound).toBe(true)
  })

  it('and then stop', () => {
    let echoes = ring(noEchoes(), { sweptFrom: [0, 10], sprung: true, found: true })
    echoes = fade(echoes, ECHO_LASTS + 0.1)
    const quiet = senseAround(sensed(), echoes)
    expect(quiet.sweptFrom).toBeNull()
    expect(quiet.entraveSprung).toBe(false)
    expect(quiet.entraveFound).toBe(false)
  })

  it('are struck back to full strength by a fresh one', () => {
    let echoes = ring(noEchoes(), { sweptFrom: [0, 10] })
    echoes = fade(echoes, ECHO_LASTS - 0.1)
    echoes = ring(echoes, { sweptFrom: [10, 0] })
    expect(echoes.swept).toBe(ECHO_LASTS)
    expect(senseAround(sensed(), echoes).sweptFrom).toEqual([1, 0])
  })

  it('leave a bell that was not struck alone', () => {
    const only = ring(noEchoes(), { sprung: true })
    expect(only.swept).toBe(0)
    expect(only.found).toBe(0)
  })
})

describe('footsteps', () => {
  it('carry across the room you share, and get quieter with distance', () => {
    const near = senseAround(sensed({ hunterAt: [2, 0] }), silence)
    const far = senseAround(sensed({ hunterAt: [15, 0] }), silence)
    expect(near.footsteps!.nearness).toBeGreaterThan(far.footsteps!.nearness)
    expect(near.footsteps!.bearing).toEqual([1, 0])
  })

  it('are muffled through a wall rather than silenced', () => {
    const same = senseAround(sensed({ earshot: 'same' }), silence)
    const next = senseAround(sensed({ earshot: 'adjacent' }), silence)
    expect(next.footsteps!.nearness).toBeCloseTo(same.footsteps!.nearness * THROUGH_A_WALL, 6)
  })

  it('do not carry from a room that is neither yours nor next to it', () => {
    expect(senseAround(sensed({ earshot: 'apart' }), silence).footsteps).toBeNull()
  })

  it('fall below hearing past the range', () => {
    expect(senseAround(sensed({ hunterAt: [HEARING_RANGE, 0] }), silence).footsteps).toBeNull()
  })

  it('drop out through a wall at a distance that still carries in the room', () => {
    const gap: [number, number] = [18, 0]
    expect(
      senseAround(sensed({ hunterAt: gap, earshot: 'same' }), silence).footsteps,
    ).not.toBeNull()
    expect(
      senseAround(sensed({ hunterAt: gap, earshot: 'adjacent' }), silence).footsteps,
    ).toBeNull()
  })
})

describe('what the player is told about their own traps', () => {
  it('passes both signals through while they are still ringing', () => {
    const heard = senseAround(sensed(), ring(noEchoes(), { sprung: true, found: true }))
    expect(heard.entraveSprung).toBe(true)
    expect(heard.entraveFound).toBe(true)
  })
})
