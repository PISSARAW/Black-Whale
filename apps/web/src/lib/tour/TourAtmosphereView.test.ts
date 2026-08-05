import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { TourAtmosphereView } from './TourAtmosphereView'
import { REFERENCE_REGIME } from './regime'

describe('TourAtmosphereView', () => {
  /**
   * The wash and the far air are no longer written here.
   *
   * They used to be two hex literals in the constructor, and this test held
   * them to the digit — which was right while they were the only opinion in the
   * walk about what colour the ship's ambient is. They are the palette's now:
   * `TourHourView` writes both on every change of the hour, so a constructor
   * holding a *different* colour would mean the scene starts on a value the
   * table does not contain and steps off it on the first tick.
   *
   * So what is asserted is the agreement rather than the digits. The palette is
   * free to move; the two may not disagree while it does.
   */
  it('starts on the reference hour the palette holds, and not on a copy of it', () => {
    const scene = new THREE.Scene()
    const atmosphere = new TourAtmosphereView(THREE, scene, 24)
    const { ambient, air } = REFERENCE_REGIME

    const wash = atmosphere.ambient.color
    expect([wash.r, wash.g, wash.b]).toEqual([ambient.colour[0], ambient.colour[1], ambient.colour[2]])
    expect(atmosphere.ambient.intensity).toBe(ambient.intensity)

    const fog = atmosphere.baseFog
    expect([fog.r, fog.g, fog.b]).toEqual([air.colour[0], air.colour[1], air.colour[2]])

    atmosphere.dispose()
  })

  /**
   * The one light in here the hour does not own.
   *
   * The night-light is the visitor's own, not the ship's — see `nightLight` in
   * `$lib/tour/comfort` — so it keeps its colour at every hour, and keeping it
   * out of the palette is the point rather than an oversight.
   */
  it('leaves the light the visitor carries alone', () => {
    const scene = new THREE.Scene()
    const atmosphere = new TourAtmosphereView(THREE, scene, 24)

    expect(atmosphere.nightLight.color.getHex()).toBe(0xffe0a8)

    atmosphere.dispose()
  })
})
