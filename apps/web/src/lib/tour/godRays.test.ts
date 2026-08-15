import { describe, expect, it } from 'vitest'
import { theShip } from './blueprint'
import { SHAFT_PEAK, shaftAnchorOf, shaftAnchors, shaftStrength } from './godRays'
import type { Structure } from './types'

const ship = theShip()

const pane = (over: Partial<Structure> = {}): Structure =>
  ({
    id: 'test-window',
    spaceId: 'test-room',
    kind: 'window',
    name: 'Window',
    nameFr: 'Baie',
    at: [10, -4],
    size: [6, 0.2],
    rotation: 0,
    base: 1,
    height: 3,
    sides: null,
    provenance: 'panel',
    source: '',
    sourceFr: '',
    ...over,
  }) as Structure

describe('where the light is taken to come from', () => {
  it('anchors on the middle of the opening in plan', () => {
    const anchor = shaftAnchorOf(pane(), 0)
    expect(anchor.position[0]).toBeCloseTo(10)
    expect(anchor.position[2]).toBeCloseTo(-4)
  })

  it('anchors above the middle of the glass, where the sky half of it is', () => {
    // Below the horizon the pane is painted `SEA_GLOW`, which is under the
    // threshold the march reads — so the middle of the opening would aim the
    // shafts at water that is not bright enough to be there.
    const anchor = shaftAnchorOf(pane({ base: 1, height: 3 }), 0)
    expect(anchor.position[1]).toBeGreaterThan(1 + 3 / 2)
    expect(anchor.position[1]).toBeLessThan(4)
  })

  it('lifts the anchor onto the deck the window is standing on', () => {
    expect(shaftAnchorOf(pane(), 60).position[1]).toBeCloseTo(
      shaftAnchorOf(pane(), 0).position[1] + 60,
    )
  })
})

describe('which decks have shafts at all', () => {
  it('finds the observation-deck opening the manga draws, and no second', () => {
    const found = [...ship.plans.values()].flatMap((plan) => shaftAnchors(plan))
    expect(found.map((anchor) => anchor.structureId)).toEqual(['tier-3-observation-deck-window'])
  })

  it('leaves every other deck without one', () => {
    // The doctrine the whole effect hangs on: there is no daylight inside the
    // hull, so a shaft anywhere but these two rooms would be light arriving
    // from an outside that does not exist.
    const withShafts = [...ship.plans.values()].filter((plan) => shaftAnchors(plan).length)
    expect(withShafts).toHaveLength(1)
  })
})

describe('how hard the shafts blow', () => {
  it('is at full strength with the window dead ahead', () => {
    expect(shaftStrength({ x: 0, y: 0, z: 0.5 }, SHAFT_PEAK)).toBeCloseTo(SHAFT_PEAK)
  })

  it('gives nothing for a window behind the camera', () => {
    // Projected past the near plane, the marching direction is the reverse of
    // the one that means anything, and the shafts would sweep the frame.
    expect(shaftStrength({ x: 0, y: 0, z: 1.4 }, SHAFT_PEAK)).toBe(0)
  })

  it('fades out over the margin rather than cutting off at the frame edge', () => {
    const inside = shaftStrength({ x: 0.9, y: 0, z: 0.5 }, SHAFT_PEAK)
    const leaving = shaftStrength({ x: 1.3, y: 0, z: 0.5 }, SHAFT_PEAK)
    const gone = shaftStrength({ x: 1.9, y: 0, z: 0.5 }, SHAFT_PEAK)
    expect(inside).toBeCloseTo(SHAFT_PEAK)
    expect(leaving).toBeGreaterThan(0)
    expect(leaving).toBeLessThan(inside)
    expect(gone).toBe(0)
  })

  it('reads the corner, not one axis: a window off the top is off screen too', () => {
    expect(shaftStrength({ x: 0, y: 1.9, z: 0.5 }, SHAFT_PEAK)).toBe(0)
  })
})
