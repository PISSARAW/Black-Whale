import type { NenTechniqueState } from '@black-whale/nen-engine'
import type * as Three from 'three'

type ThreeModule = typeof import('three')

/** First-person counterpart of the aura rendered by `humanFigure`. */
export class NenSceneAura {
  readonly #root: Three.Group
  readonly #en: Three.Mesh
  readonly #ken: Three.Mesh
  readonly #eyes: Three.Mesh[]
  readonly #points: Three.Mesh[]
  readonly #base: Three.Mesh
  readonly #ren: Three.Group
  readonly #on: Three.Group
  readonly #world: Three.Group
  readonly #THREE: ThreeModule
  readonly #shu = new Map<string, Three.Mesh>()

  constructor(THREE: ThreeModule, scene: Three.Scene) {
    this.#THREE = THREE
    this.#root = new THREE.Group()
    this.#world = new THREE.Group()
    const material = (opacity: number) =>
      new THREE.MeshBasicMaterial({
        color: 0x8ecae6,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    this.#en = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 96), material(0.3))
    this.#en.rotation.x = -Math.PI / 2
    this.#ken = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 18), material(0.16))
    ;(this.#ken.material as Three.Material).side = THREE.BackSide
    this.#eyes = [-1, 1].map((side) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 7), material(0.72))
      eye.position.set(side * 0.07, -0.035, -0.22)
      return eye
    })
    this.#points = [-1, 1].map(
      () => new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 9), material(0.7)),
    )
    this.#base = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 16), material(0.06))
    ;(this.#base.material as Three.Material).side = THREE.BackSide
    this.#ren = new THREE.Group()
    for (let index = 0; index < 14; index++) {
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.1 + (index % 3) * 0.025, 0.65, 7),
        material(0.2),
      )
      const angle = (index / 14) * Math.PI * 2
      flame.position.set(Math.cos(angle) * 0.58, -0.7 + (index % 5) * 0.35, Math.sin(angle) * 0.58)
      this.#ren.add(flame)
    }
    this.#on = new THREE.Group()
    for (let index = 0; index < 20; index++) {
      const materialOn = new THREE.MeshBasicMaterial({
        color: index % 2 ? 0x01040c : 0x123b7a,
        transparent: true,
        opacity: index % 2 ? 0.74 : 0.4,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.1 + (index % 4) * 0.02, 0.78, 7),
        materialOn,
      )
      const angle = (index / 20) * Math.PI * 2
      flame.position.set(Math.cos(angle) * 0.62, -0.75 + (index % 6) * 0.32, Math.sin(angle) * 0.62)
      this.#on.add(flame)
    }
    this.#root.add(this.#en, this.#base, this.#ren, this.#on, this.#ken, ...this.#eyes, ...this.#points)
    scene.add(this.#root, this.#world)
  }

  syncShu(objects: Array<{ id: string; at: readonly [number, number]; y: number; size: readonly [number, number]; height: number }>) {
    const wanted = new Set(objects.map((object) => object.id))
    for (const object of objects) {
      let shell = this.#shu.get(object.id)
      if (!shell) {
        shell = new this.#THREE.Mesh(
          new this.#THREE.BoxGeometry(1, 1, 1),
          new this.#THREE.MeshBasicMaterial({
            color: 0x8ecae6,
            transparent: true,
            opacity: 0.28,
            wireframe: true,
          }),
        )
        shell.name = `nen-shu-${object.id}`
        this.#shu.set(object.id, shell)
        this.#world.add(shell)
      }
      shell.position.set(object.at[0], object.y + object.height / 2, object.at[1])
      shell.scale.set(object.size[0] * 1.04, object.height * 1.04, object.size[1] * 1.04)
    }
    for (const [id, shell] of this.#shu) {
      if (wanted.has(id)) continue
      this.#world.remove(shell)
      shell.geometry.dispose()
      ;(shell.material as Three.Material).dispose()
      this.#shu.delete(id)
    }
  }

  update(
    state: NenTechniqueState,
    camera: Three.PerspectiveCamera,
    ground: number,
    seconds: number,
  ) {
    const active = state.mode !== 'zetsu'
    const pulse = 0.92 + Math.sin(seconds * 4) * 0.08
    this.#root.position.copy(camera.position)
    this.#root.rotation.set(0, camera.rotation.y, 0)
    this.#eyes.forEach((eye) => {
      eye.visible = active && state.gyo
      eye.scale.setScalar(pulse)
      eye.quaternion.copy(camera.quaternion)
    })
    this.#ken.visible = active && state.ken
    this.#ken.scale.set(0.85, 1.7, 0.85)
    this.#ken.position.y = ground + 0.9 - camera.position.y
    this.#en.visible = active && state.en !== null
    if (state.en) this.#en.scale.setScalar(state.en.radius)
    this.#en.position.y = ground + 0.025 - camera.position.y
    this.#base.visible = !state.ken && !state.on
    this.#base.scale.set(0.78, 1.62, 0.78)
    ;(this.#base.material as Three.MeshBasicMaterial).opacity =
      state.mode === 'zetsu' ? 0.008 : state.mode === 'ten' ? 0.055 : 0.13
    this.#ren.visible = state.mode === 'ren' && !state.ken && !state.on
    this.#ren.position.y = ground + 0.9 - camera.position.y
    this.#on.visible = state.on
    this.#on.position.y = ground + 0.9 - camera.position.y
    this.#on.scale.setScalar(1 + Math.sin(seconds * 7) * 0.045)

    const ko = active ? state.ko : null
    this.#points.forEach((point, index) => {
      point.visible = ko !== null || Object.keys(state.ryu).length > 0
      const feet = ko === 'feet'
      point.position.set((index ? 1 : -1) * 0.22, feet ? -1.45 : -0.48, feet ? -0.35 : -0.62)
      const share = ko ? 1 : (Object.values(state.ryu)[index] ?? 0.25)
      point.scale.setScalar((0.7 + share) * pulse)
      point.quaternion.copy(camera.quaternion)
    })
  }

  dispose(scene: Three.Scene) {
    scene.remove(this.#root, this.#world)
    for (const root of [this.#root, this.#world]) root.traverse((part) => {
      const mesh = part as Three.Mesh
      mesh.geometry?.dispose()
      const material = mesh.material as Three.Material | undefined
      material?.dispose()
    })
  }
}
