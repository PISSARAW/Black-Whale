import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { TourAtmosphereView } from './TourAtmosphereView'

describe('TourAtmosphereView', () => {
  it('uses a warmer cinematic palette for the ship', () => {
    const scene = new THREE.Scene()
    const atmosphere = new TourAtmosphereView(THREE, scene, 24)

    expect(atmosphere.ambient.color.getHex()).toBe(0xf6e5c1)
    expect(atmosphere.baseFog.getHex()).toBe(0x0b1118)
    expect(atmosphere.nightLight.color.getHex()).toBe(0xffe0a8)

    atmosphere.dispose()
  })
})
