import type { NenTechniqueState } from '@black-whale/nen-engine'
import type * as Three from 'three'

type ThreeModule = typeof import('three')
export type NenObjectInteraction = 'sense' | 'strike' | 'pressure' | 'channel'

/** First-person counterpart of the aura rendered by `humanFigure`. */
export class NenSceneAura {
  readonly #root: Three.Group
  readonly #en: Three.Group
  readonly #enRings: Three.Mesh[] = []
  readonly #ken: Three.Group
  readonly #kenShells: Three.Mesh[] = []
  readonly #eyes: Three.Mesh[]
  readonly #points = new Map<string, Three.Mesh[]>()
  readonly #base: Three.Mesh
  readonly #ren: Three.Group
  readonly #renFlames: Three.Mesh[] = []
  readonly #on: Three.Group
  readonly #onCore: Three.Mesh
  readonly #onFlames: Three.Mesh[] = []
  readonly #world: Three.Group
  readonly #THREE: ThreeModule
  readonly #shu = new Map<string, Three.Mesh>()
  readonly #interactions: Three.Group[] = []
  #seconds = 0

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
    this.#en = new THREE.Group()
    for (let index = 0; index < 3; index++) {
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.965 - index * 0.012, 1 + index * 0.018, 96),
        material(0.26 - index * 0.055),
      )
      ring.rotation.x = -Math.PI / 2
      this.#enRings.push(ring)
      this.#en.add(ring)
    }
    this.#ken = new THREE.Group()
    for (let index = 0; index < 2; index++) {
      const shell = new THREE.Mesh(
        new THREE.SphereGeometry(1 + index * 0.065, 24, 18),
        material(index === 0 ? 0.2 : 0.075),
      )
      ;(shell.material as Three.Material).side = THREE.BackSide
      this.#kenShells.push(shell)
      this.#ken.add(shell)
    }
    this.#eyes = [-1, 1].map((side) => {
      const eye = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 7), material(0.72))
      eye.position.set(side * 0.07, -0.035, -0.22)
      return eye
    })
    const pointCounts = { head: 1, torso: 1, hands: 2, feet: 2 }
    for (const [zone, count] of Object.entries(pointCounts)) {
      const points = Array.from({ length: count }, () =>
        new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 9), material(0.7)),
      )
      this.#points.set(zone, points)
    }
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
      flame.userData.auraAngle = angle
      flame.userData.auraLayer = index % 5
      this.#renFlames.push(flame)
      this.#ren.add(flame)
    }
    this.#on = new THREE.Group()
    this.#onCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.82, 24, 18),
      new THREE.MeshBasicMaterial({
        color: 0x020612,
        transparent: true,
        opacity: 0.48,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    )
    this.#onCore.scale.set(0.82, 1.72, 0.82)
    this.#on.add(this.#onCore)
    for (let index = 0; index < 28; index++) {
      const materialOn = new THREE.MeshBasicMaterial({
        color: index % 2 ? 0x01040c : 0x123b7a,
        transparent: true,
        opacity: index % 2 ? 0.66 : 0.46,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      })
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.07 + (index % 4) * 0.018, 0.58 + (index % 5) * 0.1, 7),
        materialOn,
      )
      const angle = (index / 28) * Math.PI * 2
      flame.position.set(Math.cos(angle) * 0.62, -0.82 + (index % 7) * 0.27, Math.sin(angle) * 0.62)
      flame.userData.onAngle = angle
      flame.userData.onLayer = index % 7
      this.#onFlames.push(flame)
      this.#on.add(flame)
    }
    this.#root.add(
      this.#en,
      this.#base,
      this.#ren,
      this.#on,
      this.#ken,
      ...this.#eyes,
      ...[...this.#points.values()].flat(),
    )
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
      shell.userData.shuScale = [object.size[0] * 1.04, object.height * 1.04, object.size[1] * 1.04]
    }
    for (const [id, shell] of this.#shu) {
      if (wanted.has(id)) continue
      this.#world.remove(shell)
      shell.geometry.dispose()
      ;(shell.material as Three.Material).dispose()
      this.#shu.delete(id)
    }
  }

  /** Plays a Nen reaction on a physical object without invoking a Hatsu. */
  interact(
    object: { id: string; at: readonly [number, number]; y: number; size: readonly [number, number]; height: number },
    kind: NenObjectInteraction,
  ) {
    const THREE = this.#THREE
    const root = new THREE.Group()
    root.name = `nen-object-${kind}-${object.id}`
    root.position.set(object.at[0], object.y + object.height / 2, object.at[1])
    root.userData.started = this.#seconds
    root.userData.kind = kind
    root.userData.extent = Math.max(object.size[0], object.size[1], object.height, 0.35)
    const colour = kind === 'pressure' ? 0x123b7a : kind === 'strike' ? 0xd9f4ff : 0x8ecae6
    const material = (opacity: number) =>
      new THREE.MeshBasicMaterial({
        color: colour,
        transparent: true,
        opacity,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      })
    if (kind === 'sense') {
      for (let index = 0; index < 3; index++) {
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.018, 6, 48), material(0.5))
        ring.rotation.set(index === 0 ? Math.PI / 2 : 0, index === 2 ? Math.PI / 2 : 0, 0)
        ring.userData.phase = index / 3
        root.add(ring)
      }
    } else {
      const shell = new THREE.Mesh(new THREE.SphereGeometry(0.65, 20, 14), material(kind === 'strike' ? 0.48 : 0.3))
      shell.scale.set(
        Math.max(0.4, object.size[0]),
        Math.max(0.4, object.height),
        Math.max(0.4, object.size[1]),
      )
      root.add(shell)
      const wave = new THREE.Mesh(new THREE.RingGeometry(0.25, 0.31, 64), material(0.72))
      wave.rotation.x = -Math.PI / 2
      wave.userData.wave = true
      root.add(wave)
    }
    this.#interactions.push(root)
    this.#world.add(root)
  }

  update(
    state: NenTechniqueState,
    camera: Three.PerspectiveCamera,
    ground: number,
    seconds: number,
  ) {
    this.#seconds = seconds
    const active = state.mode !== 'zetsu'
    this.#root.position.copy(camera.position)
    this.#root.rotation.set(0, camera.rotation.y, 0)
    this.#eyes.forEach((eye, index) => {
      eye.visible = active && state.gyo
      const focus = 1 + Math.sin(seconds * 11 + index * Math.PI) * 0.14
      eye.scale.set(1.5 * focus, 0.72 * focus, 1.5 * focus)
      ;(eye.material as Three.MeshBasicMaterial).opacity = 0.62 + Math.sin(seconds * 15 + index) * 0.16
      eye.quaternion.copy(camera.quaternion)
    })
    this.#ken.visible = active && state.ken
    this.#ken.scale.set(0.85, 1.7, 0.85)
    this.#ken.position.y = ground + 0.9 - camera.position.y
    this.#ken.rotation.y = Math.sin(seconds * 0.8) * 0.08
    this.#kenShells.forEach((shell, index) => {
      const pressure = 1 + Math.sin(seconds * (3.2 + index) + index * 2.1) * (index ? 0.025 : 0.012)
      shell.scale.setScalar(pressure)
      ;(shell.material as Three.MeshBasicMaterial).opacity =
        (index === 0 ? 0.2 : 0.075) + Math.sin(seconds * 5 + index) * 0.018
    })
    this.#en.visible = active && state.en !== null
    if (state.en) {
      this.#enRings.forEach((ring, index) => {
        const sweep = (seconds * (0.42 + index * 0.07) + index / 3) % 1
        const radius = state.en!.radius * (0.9 + sweep * 0.16)
        ring.scale.setScalar(radius)
        ;(ring.material as Three.MeshBasicMaterial).opacity = (1 - sweep) * (0.3 - index * 0.045)
      })
      this.#en.rotation.z = seconds * 0.045
    }
    this.#en.position.y = ground + 0.025 - camera.position.y
    this.#base.visible = !state.ken && !state.on
    const tenBreath = 1 + Math.sin(seconds * 1.8) * 0.012
    const zetsuCollapse = state.mode === 'zetsu' ? 0.72 + Math.sin(seconds * 0.9) * 0.01 : 1
    this.#base.scale.set(0.78 * tenBreath * zetsuCollapse, 1.62 * tenBreath, 0.78 * tenBreath * zetsuCollapse)
    ;(this.#base.material as Three.MeshBasicMaterial).opacity =
      state.mode === 'zetsu'
        ? 0.004 + Math.max(0, Math.sin(seconds * 0.7)) * 0.003
        : state.mode === 'ten'
          ? 0.052 + Math.sin(seconds * 1.8) * 0.006
          : 0.12 + Math.sin(seconds * 4.2) * 0.025
    this.#ren.visible = state.mode === 'ren' && !state.ken && !state.on
    this.#ren.position.y = ground + 0.9 - camera.position.y
    this.#ren.rotation.y = seconds * -0.14
    this.#renFlames.forEach((flame, index) => {
      const phase = seconds * (3.4 + (index % 3) * 0.28) + index * 1.37
      const angle = Number(flame.userData.auraAngle) + Math.sin(phase) * 0.16
      const rise = ((seconds * (0.62 + (index % 2) * 0.09) + index / 5) % 1) * 0.38
      const radius = 0.52 + Math.sin(phase * 0.73) * 0.1
      flame.position.set(
        Math.cos(angle) * radius,
        -0.82 + Number(flame.userData.auraLayer) * 0.35 + rise,
        Math.sin(angle) * radius,
      )
      flame.rotation.set(Math.sin(angle) * 0.3, -angle, Math.cos(angle) * -0.3)
      flame.scale.set(0.72 + Math.sin(phase) * 0.22, 0.9 + Math.sin(phase * 1.41) * 0.32, 0.72)
      ;(flame.material as Three.MeshBasicMaterial).opacity = 0.16 + Math.max(0, Math.sin(phase)) * 0.13
    })
    this.#on.visible = state.on
    this.#on.position.y = ground + 0.9 - camera.position.y
    const onBreath = 1 + Math.sin(seconds * 5.5) * 0.035 + Math.sin(seconds * 13) * 0.012
    this.#on.scale.set(onBreath, 1 + Math.sin(seconds * 6.5) * 0.025, onBreath)
    this.#on.rotation.y = seconds * 0.22
    this.#onCore.scale.set(0.82 * onBreath, 1.72 + Math.sin(seconds * 8) * 0.07, 0.82 * onBreath)
    ;(this.#onCore.material as Three.MeshBasicMaterial).opacity = 0.42 + Math.sin(seconds * 9) * 0.06
    this.#onFlames.forEach((flame, index) => {
      const phase = seconds * (2.4 + (index % 4) * 0.16) + index * 1.73
      const rise = ((seconds * (0.42 + (index % 3) * 0.06) + index / 7) % 1) * 0.32
      const angle = Number(flame.userData.onAngle) + Math.sin(phase) * 0.12
      const radius = 0.57 + Math.sin(phase * 0.7) * 0.08
      flame.position.set(
        Math.cos(angle) * radius,
        -0.86 + Number(flame.userData.onLayer) * 0.27 + rise,
        Math.sin(angle) * radius,
      )
      flame.rotation.set(Math.sin(angle) * 0.28, -angle, Math.cos(angle) * -0.28)
      flame.scale.set(0.75 + Math.sin(phase) * 0.18, 0.82 + Math.sin(phase * 1.3) * 0.24, 0.75)
    })

    const ko = active ? state.ko : null
    const zonePositions: Record<string, Array<[number, number, number]>> = {
      head: [[0, 0.02, -0.25]],
      torso: [[0, -0.62, -0.42]],
      hands: [[-0.27, -0.48, -0.62], [0.27, -0.48, -0.62]],
      feet: [[-0.2, -1.45, -0.35], [0.2, -1.45, -0.35]],
    }
    for (const [zone, points] of this.#points) {
      const share = ko === zone ? 1 : Number(state.ryu[zone] ?? 0)
      points.forEach((point, index) => {
        point.visible = active && share > 0
        const position = zonePositions[zone]?.[index] ?? zonePositions.torso[0]
        point.position.set(...position)
        const energy = 0.68 + share * 0.92
        const flow = 1 + Math.sin(seconds * 8 - share * 5 + index * Math.PI) * (ko ? 0.16 : 0.08)
        point.scale.setScalar(energy * flow)
        ;(point.material as Three.MeshBasicMaterial).opacity = 0.42 + share * 0.42 + Math.sin(seconds * 10 + index) * 0.08
        point.quaternion.copy(camera.quaternion)
      })
    }
    for (const [index, shell] of [...this.#shu.values()].entries()) {
      const shimmer = 1 + Math.sin(seconds * 4.5 + index * 1.7) * 0.018
      const scale = shell.userData.shuScale as [number, number, number] | undefined
      if (scale) shell.scale.set(scale[0] * shimmer, scale[1] * shimmer, scale[2] * shimmer)
      ;(shell.material as Three.MeshBasicMaterial).opacity = 0.22 + Math.sin(seconds * 6 + index) * 0.055
    }
    for (let index = this.#interactions.length - 1; index >= 0; index--) {
      const effect = this.#interactions[index]
      const age = seconds - Number(effect.userData.started)
      const kind = effect.userData.kind as NenObjectInteraction
      const duration = kind === 'sense' ? 1.8 : kind === 'pressure' ? 1.25 : 0.8
      if (age >= duration) {
        this.#world.remove(effect)
        effect.traverse((part) => {
          const mesh = part as Three.Mesh
          mesh.geometry?.dispose()
          ;(mesh.material as Three.Material | undefined)?.dispose()
        })
        this.#interactions.splice(index, 1)
        continue
      }
      const progress = Math.max(0, age / duration)
      effect.rotation.y = seconds * (kind === 'pressure' ? 1.8 : 0.7)
      effect.children.forEach((part, partIndex) => {
        const mesh = part as Three.Mesh
        const phase = Number(mesh.userData.phase ?? 0)
        if (kind === 'sense') {
          const sweep = (progress + phase) % 1
          mesh.scale.setScalar((0.45 + sweep * 1.25) * Number(effect.userData.extent))
          ;(mesh.material as Three.MeshBasicMaterial).opacity = (1 - sweep) * 0.55
        } else if (mesh.userData.wave) {
          mesh.scale.setScalar((0.5 + progress * 2.8) * Number(effect.userData.extent))
          ;(mesh.material as Three.MeshBasicMaterial).opacity = (1 - progress) * 0.75
        } else {
          const impact = kind === 'strike' ? 1 + Math.sin(progress * Math.PI) * 0.3 : 1 + Math.sin(seconds * 9 + partIndex) * 0.06
          mesh.scale.multiplyScalar(impact / Number(mesh.userData.lastImpact ?? 1))
          mesh.userData.lastImpact = impact
          ;(mesh.material as Three.MeshBasicMaterial).opacity = (1 - progress) * (kind === 'strike' ? 0.5 : 0.32)
        }
      })
    }
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
