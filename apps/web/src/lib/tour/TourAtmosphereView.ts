import type * as Three from 'three'

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
    this.ambient = new THREE.AmbientLight(0xffffff, 2.2)
    this.nightLight = new THREE.PointLight(
      0xffd9a0,
      nightLightDistance > 0 ? NIGHT_LIGHT_INTENSITY : 0,
      nightLightDistance,
      2,
    )
    this.auraLight = new THREE.PointLight(0xffffff, 0, 14, 2)
    this.gildLight = new THREE.PointLight(0xffd98a, 0, 9, 2)
    this.haloLight = new THREE.PointLight(0xfff1d8, 0, 12, 2)
    this.haloBubble = new THREE.Mesh(
      new THREE.SphereGeometry(1, 16, 12),
      new THREE.MeshBasicMaterial({
        color: 0xfff1d8,
        transparent: true,
        opacity: 0.06,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    )
    this.haloBubble.visible = false
    this.white = new THREE.Color(0xffffff)
    this.baseFog = new THREE.Color(0x050505)
    scene.add(
      this.ambient,
      this.nightLight,
      this.auraLight,
      this.gildLight,
      this.haloLight,
      this.haloBubble,
    )
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
