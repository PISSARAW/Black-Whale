import type * as Three from 'three'
import type { Vec2 } from './types'

/** Owns transient and visitor-carried Nen visuals outside the apparition world. */
export class HatsuSceneEffects {
  readonly #chassis: Three.Group
  readonly #chassisSkin: Three.MeshLambertMaterial
  readonly #headlamp: Three.PointLight

  constructor(
    private readonly THREE: typeof Three,
    private readonly scene: Three.Scene,
  ) {
    this.#chassis = new THREE.Group()
    this.#chassis.visible = false
    this.#chassisSkin = new THREE.MeshLambertMaterial({ color: 0xf2a65a })
    const bonnet = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.35, 2.6), this.#chassisSkin)
    bonnet.position.set(0, -0.95, -1.5)
    this.#chassis.add(bonnet)
    for (const side of [-1, 1]) {
      const wing = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.5, 3.4), this.#chassisSkin)
      wing.position.set(side * 1.05, -0.85, -0.9)
      this.#chassis.add(wing)
      const lamp = new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0xfff0c0 }),
      )
      lamp.position.set(side * 0.75, -0.85, -2.75)
      this.#chassis.add(lamp)
    }
    this.#headlamp = new THREE.PointLight(0xffe0a0, 0, 22, 2)
    scene.add(this.#chassis, this.#headlamp)
  }

  syncVehicle(riding: boolean, at: Vec2, eye: number, yaw: number): void {
    this.#chassis.visible = riding
    this.#headlamp.intensity = riding ? 3.2 : 0
    if (!riding) return
    this.#chassis.position.set(at[0], eye, at[1])
    this.#chassis.rotation.set(0, yaw, 0)
    this.#headlamp.position.set(
      at[0] - Math.sin(yaw) * 4,
      eye - 0.8,
      at[1] - Math.cos(yaw) * 4,
    )
  }

  dispose(): void {
    this.scene.remove(this.#chassis, this.#headlamp)
    this.#chassis.traverse((part) => {
      const mesh = part as Three.Mesh
      mesh.geometry?.dispose()
      const material = mesh.material
      if (material && material !== this.#chassisSkin) {
        if (Array.isArray(material)) for (const item of material) item.dispose()
        else material.dispose()
      }
    })
    this.#chassisSkin.dispose()
  }
}
