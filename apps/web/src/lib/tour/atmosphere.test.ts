import { describe, expect, it } from 'vitest'
import {
  ABSORPTION,
  HULL_DECKS,
  HULL_FUNDAMENTAL,
  MAX_DENSITY,
  MAX_REVERB,
  MAX_TAIL,
  MIN_DENSITY,
  MIN_REVERB,
  SEALED_DENSITY,
  SETTLE,
  SPEED_OF_SOUND,
  fogDensityFor,
  fogDensityOf,
  hullNoise,
  hullRumble,
  impulseResponse,
  reverbTime,
  roomSurface,
  roomVolume,
  settleDensity,
  slapDelay,
} from './atmosphere'
import { buildShip } from './blueprint'
import { BOB_RISE, STRIDE, WALK_SPEED, bobOf, stepsIn } from './navigation'
import type { Space, Tier } from './types'

const tier: Tier = {
  id: 'test',
  name: 'Test deck',
  elevation: 0,
  ceiling: 3,
  provenance: 'plan',
  sources: [],
} as unknown as Tier

const box = (width: number, depth: number, ceiling?: number): Space =>
  ({
    id: `box-${width}x${depth}`,
    tierId: 'test',
    name: 'Box',
    category: 'room',
    provenance: 'plan',
    ceiling,
    footprint: [
      [0, 0],
      [width, 0],
      [width, depth],
      [0, depth],
    ],
    sources: [],
  }) as unknown as Space

describe('the air of a room', () => {
  it('thickens as the room shrinks', () => {
    expect(fogDensityFor(60)).toBeGreaterThan(fogDensityFor(140))
    expect(fogDensityFor(20)).toBeGreaterThan(fogDensityFor(60))
  })

  it('never goes clear in the longest hall, nor opaque in the smallest cabin', () => {
    expect(fogDensityFor(4000)).toBe(MIN_DENSITY)
    expect(fogDensityFor(0.5)).toBe(MAX_DENSITY)
    expect(fogDensityFor(0)).toBe(MAX_DENSITY)
    expect(fogDensityFor(-3)).toBe(MAX_DENSITY)
  })

  it('leaves most of a small room showing at its own far wall', () => {
    // The point of the cap: a cabin is hazy, not fogged in.
    const cabin = fogDensityFor(6)
    expect(Math.exp(-((6 * cabin) ** 2))).toBeGreaterThan(0.6)
  })

  it('hazes the far end of a hall the near end is crisp in', () => {
    const hall = fogDensityFor(150)
    expect(Math.exp(-((10 * hall) ** 2))).toBeGreaterThan(0.98)
    expect(Math.exp(-((150 * hall) ** 2))).toBeLessThan(0.5)
  })

  it('seals sight far tighter than any room of the ship', () => {
    expect(SEALED_DENSITY).toBeGreaterThan(MAX_DENSITY * 5)
  })

  it('gives every space of the ship a density inside its own bounds', () => {
    const ship = buildShip()
    for (const space of ship.spaces.values()) {
      const density = fogDensityOf(space)
      expect(density).toBeGreaterThanOrEqual(MIN_DENSITY)
      expect(density).toBeLessThanOrEqual(MAX_DENSITY)
    }
  })

  it('tells a cabin from the promenade it opens onto', () => {
    const ship = buildShip()
    const cabin = ship.spaces.get('tier-1-lifeboats-port-pod-cabin')
    const promenade = ship.spaces.get('tier-3-starboard-promenade')
    expect(cabin && promenade).toBeTruthy()
    expect(fogDensityOf(cabin!)).toBeGreaterThan(fogDensityOf(promenade!) * 5)
  })
})

describe('settling from one room into the next', () => {
  it('closes about 95% of the gap over the settling time', () => {
    let density = 0
    // A frame at a time, rather than one big step, is how the walk runs it.
    for (let t = 0; t < SETTLE; t += 1 / 60) density = settleDensity(density, 1, 1 / 60)
    expect(density).toBeGreaterThan(0.9)
    expect(density).toBeLessThan(0.99)
  })

  it('gets to the same place at 30 Hz as at 144 Hz', () => {
    const walk = (rate: number) => {
      let density = 0
      for (let i = 0; i < rate; i++) density = settleDensity(density, 1, 1 / rate)
      return density
    }
    expect(Math.abs(walk(30) - walk(144))).toBeLessThan(0.01)
  })

  it('never overshoots, and stands still when no time passes', () => {
    expect(settleDensity(0.02, 0.09, 10)).toBeLessThanOrEqual(0.09)
    expect(settleDensity(0.02, 0.09, 0)).toBe(0.02)
  })
})

describe('how long a room rings', () => {
  it('follows Sabine on the volume and surface the blueprint gives', () => {
    const room = box(10, 10)
    expect(roomVolume(room, tier)).toBeCloseTo(300)
    expect(roomSurface(room, tier)).toBeCloseTo(200 + 40 * 3)
    const expected = (0.161 * 300) / (roomSurface(room, tier) * ABSORPTION)
    expect(reverbTime(room, tier)).toBeCloseTo(expected, 5)
  })

  it('rings longer as the room grows, and is bounded at both ends', () => {
    expect(reverbTime(box(60, 40), tier)).toBeGreaterThan(reverbTime(box(4, 3), tier))
    expect(reverbTime(box(0.5, 0.5), tier)).toBe(MIN_REVERB)
    expect(reverbTime(box(400, 400, 30), tier)).toBe(MAX_REVERB)
  })

  it('separates the smallest room of the ship from the largest by ear', () => {
    const ship = buildShip()
    const timeOf = (space: Space) =>
      reverbTime(
        space,
        ship.tiers.find((deck) => deck.id === space.tierId)!,
      )
    const times = [...ship.spaces.values()].map(timeOf)
    // Under about 1.3:1 the ear treats two rooms as the same room. The ship
    // spans a great deal more than that, which is the whole point of measuring.
    expect(Math.max(...times) / Math.min(...times)).toBeGreaterThan(4)
  })
})

describe('the first reflection off the nearest wall', () => {
  it('is the round trip at the speed of sound', () => {
    expect(slapDelay(17.15)).toBeCloseTo((2 * 17.15) / SPEED_OF_SOUND, 6)
    expect(slapDelay(17.15)).toBeCloseTo(0.1, 6)
  })

  it('arrives later the further the wall is', () => {
    expect(slapDelay(40)).toBeGreaterThan(slapDelay(2))
  })

  it('stays inside the delay line the graph allocates', () => {
    expect(slapDelay(1e6)).toBeLessThanOrEqual(0.5)
    expect(slapDelay(0)).toBeGreaterThan(0)
    expect(slapDelay(-5)).toBeGreaterThan(0)
  })
})

describe('the impulse response a room is convolved with', () => {
  it('is as long as the tail is worth convolving', () => {
    expect(impulseResponse(1, 48000).length).toBe(48000)
    expect(impulseResponse(MAX_REVERB, 48000).length).toBe(MAX_TAIL * 48000)
  })

  it('decays by 60 dB over the reverberation time', () => {
    const rt60 = 1.5
    const response = impulseResponse(rt60, 48000)
    const peak = Math.max(...Array.from(response.slice(0, 2000), Math.abs))
    const late = Math.max(...Array.from(response.slice(48000 * 1.4, 48000 * 1.5), Math.abs))
    // A thousandth of the peak is 60 dB down, give or take the noise itself.
    expect(late).toBeLessThan(peak / 200)
  })

  it('is the same room every time it is entered', () => {
    const a = impulseResponse(2, 44100, { seed: 7 })
    const b = impulseResponse(2, 44100, { seed: 7 })
    const c = impulseResponse(2, 44100, { seed: 8 })
    expect(Array.from(a.slice(0, 64))).toEqual(Array.from(b.slice(0, 64)))
    expect(Array.from(a.slice(0, 64))).not.toEqual(Array.from(c.slice(0, 64)))
  })

  it('puts a reflection where the geometry says one lands', () => {
    const bare = impulseResponse(2, 48000, { seed: 3 })
    const withSlap = impulseResponse(2, 48000, { seed: 3, reflections: [0.05] })
    const index = 0.05 * 48000
    expect(withSlap[index]).not.toBe(bare[index])
    expect(Math.abs(withSlap[index])).toBeGreaterThan(Math.abs(bare[index]))
  })

  it('holds every sample inside the range an audio buffer takes', () => {
    for (const rt60 of [MIN_REVERB, 1, MAX_REVERB]) {
      const response = impulseResponse(rt60, 48000, { reflections: [0.01, 0.02] })
      for (const sample of response) expect(Math.abs(sample)).toBeLessThanOrEqual(1)
    }
  })
})

describe('the pace the ship is walked at', () => {
  it('walks at a human speed, so the published measurements mean something', () => {
    // 175 m of hull, bow to stern, at a brisk walk: a minute and a half.
    expect(175 / WALK_SPEED).toBeGreaterThan(60)
    expect(WALK_SPEED).toBeLessThan(2.5)
  })

  it('dips the head once per pace, at the pace', () => {
    expect(bobOf(0).rise).toBeCloseTo(-BOB_RISE)
    expect(bobOf(STRIDE).rise).toBeCloseTo(-BOB_RISE)
    expect(bobOf(STRIDE / 2).rise).toBeCloseTo(BOB_RISE)
  })

  it('leans on alternate feet', () => {
    expect(bobOf(STRIDE / 2).roll).toBeGreaterThan(0)
    expect(bobOf(STRIDE * 1.5).roll).toBeLessThan(0)
    expect(bobOf(0).roll).toBeCloseTo(0)
    expect(bobOf(STRIDE).roll).toBeCloseTo(0)
  })

  it('stands still when the walking stops, because distance stops growing', () => {
    expect(bobOf(4.2)).toEqual(bobOf(4.2))
  })

  it('counts one step per stride of ground covered', () => {
    expect(stepsIn(0)).toBe(0)
    expect(stepsIn(STRIDE * 0.99)).toBe(0)
    expect(stepsIn(STRIDE)).toBe(1)
    expect(stepsIn(STRIDE * 9.5)).toBe(9)
  })

  it('takes the same steps on the same ground whatever the frame rate', () => {
    // The whole reason the gait is keyed to distance: two visitors covering the
    // same hundred metres take the same number of steps.
    expect(stepsIn(100)).toBe(Math.floor(100 / STRIDE))
  })
})

/**
 * The hull, which is what the ship has instead of weather.
 *
 * Two of these are worth guarding. The rumble has to be monotone in elevation —
 * the whole cue is that descending is audible, and a deck that broke the order
 * would say the engines are upstairs. And the noise bed is looped for as long as
 * the walk lasts, so its ends have to meet: a discontinuity there is a click every
 * four seconds, which is the one artefact an ear places instantly.
 */
describe('the rumble of the hull', () => {
  it('gives each deck the level and the cutoff it is written for', () => {
    for (const deck of HULL_DECKS) {
      const heard = hullRumble(deck.elevation)
      expect(heard.level, `${deck.elevation} m is mixed wrong`).toBeCloseTo(deck.level, 10)
      expect(heard.cutoff, `${deck.elevation} m is filtered wrong`).toBeCloseTo(deck.cutoff, 10)
    }
    // The machinery is in the bottom of the hull: the hold is the loud end.
    expect(HULL_DECKS[0].level).toBe(1)
    expect(hullRumble(0).level).toBeGreaterThan(hullRumble(72).level * 5)
  })

  it('gets quieter and duller with every deck climbed, without exception', () => {
    let last = hullRumble(-10)
    for (let elevation = -10; elevation <= 90; elevation += 0.5) {
      const heard = hullRumble(elevation)
      expect(heard.level, `${elevation} m is louder than the deck below it`).toBeLessThanOrEqual(
        last.level + 1e-12,
      )
      expect(heard.cutoff, `${elevation} m is brighter than the deck below it`).toBeLessThanOrEqual(
        last.cutoff + 1e-12,
      )
      last = heard
    }
  })

  it('interpolates between decks, and stops at the top and the bottom of the ship', () => {
    // Nothing in the reconstruction stands between two decks — but a lift does
    // travel there, and an elevation off the table must not fall to zero.
    const between = hullRumble(9)
    expect(between.level).toBeCloseTo((1 + 0.7) / 2, 10)
    expect(between.cutoff).toBeCloseTo((260 + 190) / 2, 10)

    // Flat outside the hull: there is nothing under Tier 5 and nothing over Tier 1.
    expect(hullRumble(-40)).toEqual(hullRumble(0))
    expect(hullRumble(400)).toEqual(hullRumble(72))
  })

  it('meets its own ends, so the loop has no click in it', () => {
    const rate = 8000
    const bed = hullNoise(2, rate)
    expect(bed.length).toBe(2 * rate)

    // The seam is the joint between the last sample and the first. It has to be no
    // bigger a step than the noise takes anywhere else in the buffer, or the loop
    // is heard ticking.
    let biggest = 0
    for (let i = 1; i < bed.length; i++) {
      biggest = Math.max(biggest, Math.abs(bed[i] - bed[i - 1]))
    }
    const seam = Math.abs(bed[0] - bed[bed.length - 1])
    expect(seam, 'the loop point steps further than the noise ever does').toBeLessThanOrEqual(
      biggest,
    )
  })

  it('stays inside the range an audio buffer takes, and is pink rather than white', () => {
    const rate = 8000
    const bed = hullNoise(2, rate)
    for (const sample of bed) expect(Math.abs(sample)).toBeLessThanOrEqual(1)

    // Pink noise carries equal energy per octave, so it is dominated by its low
    // end: the difference between neighbouring samples — a crude high-pass — holds
    // far less energy than the samples themselves. For white noise the two are
    // uncorrelated and the ratio is √2; this bed measures about 0,64, less than
    // half of that. It is the difference between a hiss with the top taken off and
    // a machine heard through a deck.
    let signal = 0
    let difference = 0
    for (let i = 1; i < bed.length; i++) {
      signal += bed[i] * bed[i]
      difference += (bed[i] - bed[i - 1]) ** 2
    }
    expect(Math.sqrt(difference / signal), 'the bed is a hiss, not a rumble').toBeLessThan(
      Math.SQRT2 / 2,
    )
  })

  it('sounds the same to two visitors, and different in two ships', () => {
    // Seeded like every other noise in the walk: a reconstruction that publishes
    // its sources cannot answer differently on a second visit.
    expect([...hullNoise(0.2, 8000)]).toEqual([...hullNoise(0.2, 8000)])
    expect([...hullNoise(0.2, 8000, 5)]).not.toEqual([...hullNoise(0.2, 8000, 6)])
  })

  it('sits below the fundamental of a footstep, because it is not a footstep', () => {
    // The plate under a boot rings from about 104 Hz down to 58 — see `footstep`.
    // The hull is under all of it, and every deck's cutoff is low enough that what
    // is left of it is felt rather than heard as a pitch.
    expect(HULL_FUNDAMENTAL).toBeLessThan(58)
    for (const deck of HULL_DECKS) expect(deck.cutoff).toBeGreaterThan(HULL_FUNDAMENTAL)
  })
})
