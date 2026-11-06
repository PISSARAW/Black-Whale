import type * as Three from 'three'
import type { TourFlash } from './apparitions'
import { buildMangaPropApparition } from './apparitionMangaPropView'
import { batchNenModel } from './nenModelBatch'

/** Jupiter exists during the impact, not as a permanent sphere beside its user. */
export class HatsuJupiterEffect {
  readonly root: Three.Group
  constructor(
    THREE: typeof Three,
    private readonly scene: Three.Scene,
  ) {
    this.root = new THREE.Group()
    const cache = new Map<number, Three.MeshBasicMaterial>()
    const glow = (colour: number) => {
      if (!cache.has(colour)) cache.set(colour, new THREE.MeshBasicMaterial({ color: colour }))
      return cache.get(colour)!
    }
    buildMangaPropApparition(
      {
        id: 'jupiter-flash',
        kind: 'jupiter',
        size: 1,
        stage: 0,
        colour: 0xc7b39a,
        at: [0, 0],
        y: 0,
        spaceId: '',
        tierId: '',
        hidden: false,
      },
      { THREE, glow, root: this.root, skin: glow(0xc7b39a) },
    )
    batchNenModel(this.root)
    this.hide()
    scene.add(this.root)
  }
  play(played: TourFlash, through: number): void {
    this.root.visible = true
    this.root.position.set(
      played.at[0],
      played.y + (1 - Math.min(1, through * 2)) * 1.2,
      played.at[1],
    )
    this.root.scale.setScalar(Math.sin(Math.PI * through) * 1.15)
    this.root.rotation.z = 0.18
  }
  hide(): void {
    this.root.visible = false
  }
  dispose(): void {
    this.scene.remove(this.root)
    this.root.traverse((part) => {
      const mesh = part as Three.Mesh
      mesh.geometry?.dispose()
      if (mesh.material && !Array.isArray(mesh.material)) mesh.material.dispose()
    })
  }
}
