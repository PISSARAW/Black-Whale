import type * as Three from 'three'
import { REFERENCE_REGIME } from './regime'
import { ceilingOf, floorOf, type Ship } from './blueprint'
import { centroid } from './geometry'

export const NIGHT_LIGHT_INTENSITY = 1.2
export const AURA_LIGHT_INTENSITY = 2.4

/** Owns the fog palette and every persistent dynamic light in the tour. */
export class TourAtmosphereView {
  readonly ambient: Three.AmbientLight
  readonly nightLight: Three.PointLight
  readonly auraLight: Three.PointLight
  readonly gildLight: Three.PointLight
  readonly haloLight: Three.PointLight
  readonly haloBubble: Three.Mesh
  readonly litLights: Record<string, Three.PointLight | undefined> = {}
  readonly white: Three.Color
  readonly baseFog: Three.Color
  tinted: number | null = null

  constructor(
    private readonly THREE: typeof Three,
    private readonly scene: Three.Scene,
    nightLightDistance: number,
  ) {
    // The reference hour's wash, and its far air. Read out of the palette in
    // `$lib/tour/regime` rather than written here: the hour moves both of them
    // and `TourHourView` is their one writer, so the value the scene starts at
    // has to be the table's own — otherwise the first tick of the clock is a
    // step change from a second opinion nobody can see in the table.
    const { ambient, air } = REFERENCE_REGIME
    this.ambient = new THREE.AmbientLight(0xffffff, ambient.intensity)
    this.ambient.color.setRGB(ambient.colour[0], ambient.colour[1], ambient.colour[2])
    this.nightLight = new THREE.PointLight(
      0xffe0a8,
      nightLightDistance > 0 ? NIGHT_LIGHT_INTENSITY : 0,
      nightLightDistance,
      2,
    )
    this.auraLight = new THREE.PointLight(0xfff1d8, 0, 14, 2)
    this.gildLight = new THREE.PointLight(0xffd8a7, 0, 9, 2)
    this.haloLight = new THREE.PointLight(0xfff4d8, 0, 12, 2)
    this.haloBubble = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      new THREE.MeshBasicMaterial({
        color: 0xfff2de,
        transparent: true,
        opacity: 0.08,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    )
    this.haloBubble.visible = false
    this.white = new THREE.Color(0xffffff)
    this.baseFog = new THREE.Color().setRGB(air.colour[0], air.colour[1], air.colour[2])
    scene.add(
      this.ambient,
      this.nightLight,
      this.auraLight,
      this.gildLight,
      this.haloLight,
      this.haloBubble,
    )
  }

  syncLitRooms(ship: Ship, rooms: readonly string[]): void {
    for (const spaceId of rooms) {
      if (this.litLights[spaceId]) continue
      const space = ship.spaces.get(spaceId)
      const tier = space ? ship.tiers.find((candidate) => candidate.id === space.tierId) : null
      if (!space || !tier) continue
      const middle = centroid(space)
      const lamp = new this.THREE.PointLight(0xfff1d8, 2.6, 26, 2)
      lamp.position.set(middle[0], floorOf(space, tier) + ceilingOf(space, tier) * 0.7, middle[1])
      this.scene.add(lamp)
      this.litLights[spaceId] = lamp
    }
    for (const spaceId of Object.keys(this.litLights)) {
      if (rooms.includes(spaceId)) continue
      const lamp = this.litLights[spaceId]
      if (lamp) this.scene.remove(lamp)
      delete this.litLights[spaceId]
    }
  }

  dispose(): void {
    for (const light of Object.values(this.litLights)) if (light) this.scene.remove(light)
    this.haloBubble.geometry.dispose()
    const material = this.haloBubble.material as Three.Material
    material.dispose()
    this.scene.remove(
      this.ambient,
      this.nightLight,
      this.auraLight,
      this.gildLight,
      this.haloLight,
      this.haloBubble,
    )
  }
}
