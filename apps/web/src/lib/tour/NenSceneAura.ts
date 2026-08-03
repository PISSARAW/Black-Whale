import { NEN_PRESENTATION, type NenTechniqueState } from '@black-whale/nen-engine'
import type * as Three from 'three'
import {
  buildInteractionMarker,
  type NenObjectExtent,
  type NenObjectInteraction,
} from './auraInteraction'
import {
  enFragmentShader,
  enVertexShader,
  fluxFragmentShader,
  fluxVertexShader,
  onFragmentShader,
  onVertexShader,
  renFragmentShader,
  renVertexShader,
  tenFragmentShader,
  tenVertexShader,
} from './auraShaders'

type ThreeModule = typeof import('three')

export type { NenObjectInteraction } from './auraInteraction'

/** Where the walker stands and when, plus the depth buffer to read against. */
export interface NenAuraFrame {
  ground: number
  seconds: number
  depthTexture?: Three.DepthTexture
}

export class NenSceneAura {
  readonly #root: Three.Group
  readonly #world: Three.Group
  readonly #THREE: ThreeModule
  readonly #shu = new Map<string, Three.Mesh>()
  readonly #interactions: Three.Group[] = []

  readonly #auraGeom: Three.CylinderGeometry

  readonly #ten: Three.Mesh
  readonly #ren: Three.Mesh
  readonly #renTen: Three.Mesh
  readonly #on: Three.Mesh
  readonly #onTen: Three.Mesh
  readonly #zetsu: Three.Mesh
  readonly #flux: Three.Mesh
  readonly #en: Three.Mesh

  readonly #fluxUniforms: any
  readonly #enUniforms: any

  #seconds = 0
  #onStartTime = 0
  #wasOn = false
  #renStartTime = 0
  #wasRen = false

  constructor(THREE: ThreeModule, scene: Three.Scene) {
    this.#THREE = THREE
    this.#root = new THREE.Group()
    this.#world = new THREE.Group()

    this.#auraGeom = new THREE.CylinderGeometry(0.7, 0.9, 2.4, 32, 32, true)
    this.#auraGeom.translate(0, 1.2, 0)

    // TEN
    this.#ten = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: tenVertexShader,
        fragmentShader: tenFragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.ten.colours[0]) },
          u_colorEdge: { value: new THREE.Color(NEN_PRESENTATION.ten.colours[0]) },
          u_opacity: { value: 0.8 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    )
    this.#ten.position.y = -1.2

    // REN
    this.#ren = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: renVertexShader,
        fragmentShader: renFragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.ren.colours[0]) },
          u_colorEdge: {
            value: new THREE.Color(
              NEN_PRESENTATION.ren.colours[1] || NEN_PRESENTATION.ren.colours[0],
            ),
          },
          u_opacity: { value: 0.8 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    )
    this.#ren.position.y = -1.2

    // REN (Settled into Ten state)
    this.#renTen = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: tenVertexShader,
        fragmentShader: tenFragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.ren.colours[0]) },
          u_colorEdge: {
            value: new THREE.Color(
              NEN_PRESENTATION.ren.colours[1] || NEN_PRESENTATION.ren.colours[0],
            ),
          },
          u_opacity: { value: 0.0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    )
    this.#renTen.position.y = -1.2

    // ON
    this.#on = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: onVertexShader,
        fragmentShader: onFragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_intensityMultiplier: { value: 1.0 },
          u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.on.colours[0]) },
          u_colorEdge: {
            value: new THREE.Color(
              NEN_PRESENTATION.on.colours[1] || NEN_PRESENTATION.on.colours[0],
            ),
          },
          u_opacity: { value: 0.8 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.MultiplyBlending,
        side: THREE.DoubleSide,
      }),
    )
    this.#on.position.y = -1.2

    // ON (Settled into Ten state)
    this.#onTen = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: tenVertexShader,
        fragmentShader: tenFragmentShader,
        uniforms: {
          u_time: { value: 0 },
          u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.on.colours[0]) },
          u_colorEdge: {
            value: new THREE.Color(
              NEN_PRESENTATION.on.colours[1] || NEN_PRESENTATION.on.colours[0],
            ),
          },
          u_opacity: { value: 0.0 },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    )
    this.#onTen.position.y = -1.2

    // ZETSU (Refraction via MeshPhysicalMaterial)
    this.#zetsu = new THREE.Mesh(
      this.#auraGeom,
      new THREE.MeshPhysicalMaterial({
        transmission: 1.0,
        ior: 1.05, // subtle heat mirage
        roughness: 0.1,
        thickness: 0.5,
        transparent: true,
        opacity: 1,
        side: THREE.DoubleSide,
      }),
    )
    this.#zetsu.position.y = -1.2

    // FLUX (Gyo, Ko, Ryu)
    this.#fluxUniforms = {
      u_time: { value: 0 },
      u_colorCore: { value: new THREE.Color(NEN_PRESENTATION.ryu.colours[0]) },
      u_nodes: { value: Array(8).fill(new THREE.Vector3()) },
      u_intensities: { value: Array(8).fill(0.0) },
      u_opacity: { value: 1.0 },
    }
    this.#flux = new THREE.Mesh(
      this.#auraGeom,
      new THREE.ShaderMaterial({
        vertexShader: fluxVertexShader,
        fragmentShader: fluxFragmentShader,
        uniforms: this.#fluxUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      }),
    )
    this.#flux.position.y = -1.2

    // EN
    this.#enUniforms = {
      tDepth: { value: null },
      u_resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
      // Both are overwritten from the camera every frame — see `update` — so
      // these only have to be the walk's own planes for the first one.
      u_cameraNear: { value: 0.15 },
      u_cameraFar: { value: 220.0 },
      u_color: { value: new THREE.Color(NEN_PRESENTATION.en.colours[0]) },
      u_opacity: { value: 1.0 },
    }
    this.#en = new THREE.Mesh(
      new THREE.SphereGeometry(1.0, 64, 64),
      new THREE.ShaderMaterial({
        vertexShader: enVertexShader,
        fragmentShader: enFragmentShader,
        uniforms: this.#enUniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
      }),
    )

    this.#root.add(this.#ten)
    this.#root.add(this.#ren)
    this.#root.add(this.#renTen)
    this.#root.add(this.#on)
    this.#root.add(this.#onTen)
    this.#root.add(this.#zetsu)
    this.#root.add(this.#flux)
    this.#root.add(this.#en)
    scene.add(this.#root, this.#world)
  }

  syncShu(
    objects: Array<{
      id: string
      at: readonly [number, number]
      y: number
      size: readonly [number, number]
      height: number
    }>,
  ) {
    const wanted = new Set(objects.map((object) => object.id))
    for (const object of objects) {
      let shell = this.#shu.get(object.id)
      if (!shell) {
        shell = new this.#THREE.Mesh(
          new this.#THREE.BoxGeometry(1, 1, 1),
          new this.#THREE.MeshBasicMaterial({
            color: NEN_PRESENTATION.shu.colours[0],
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

  interact(object: NenObjectExtent, kind: NenObjectInteraction) {
    const root = buildInteractionMarker(this.#THREE, {
      object,
      kind,
      startedAt: this.#seconds,
    })
    this.#interactions.push(root)
    this.#world.add(root)
  }

  update(state: NenTechniqueState, camera: Three.PerspectiveCamera, frame: NenAuraFrame) {
    const { ground, seconds, depthTexture } = frame
    this.#seconds = seconds
    this.#root.position.copy(camera.position)
    this.#root.rotation.set(0, camera.rotation.y, 0)

    // Hide all by default
    this.#ten.visible = false
    this.#ren.visible = false
    this.#renTen.visible = false
    this.#on.visible = false
    this.#onTen.visible = false
    this.#zetsu.visible = false
    this.#flux.visible = false
    this.#en.visible = false

    const active = state.mode !== 'zetsu'
    const isFlux =
      active && (state.ko !== null || Object.values(state.ryu).some((v) => (v || 0) > 0))

    if (!active) {
      this.#zetsu.visible = true
      // minor wobble
      const mat = this.#zetsu.material as Three.MeshPhysicalMaterial
      mat.ior = 1.02 + Math.sin(seconds * 2.0) * 0.02
    } else if (state.on) {
      if (!this.#wasOn) {
        this.#wasOn = true
        this.#onStartTime = seconds
      }
      const elapsed = seconds - this.#onStartTime
      const progress = Math.min(elapsed / 30.0, 1.0) // transition over 30s

      if (progress < 1.0) {
        this.#on.visible = true
        ;(this.#on.material as Three.ShaderMaterial).uniforms.u_time.value = seconds
        ;(this.#on.material as Three.ShaderMaterial).uniforms.u_opacity.value =
          (1.0 - progress) * 0.8
      }

      if (progress > 0.0) {
        this.#onTen.visible = true
        ;(this.#onTen.material as Three.ShaderMaterial).uniforms.u_time.value = seconds
        ;(this.#onTen.material as Three.ShaderMaterial).uniforms.u_opacity.value = progress * 0.8
      }
    } else if (isFlux) {
      this.#flux.visible = true
      this.#fluxUniforms.u_time.value = seconds

      const rootPos = this.#root.position
      // Convert camera local offsets to world coordinates for nodes
      const headPos = rootPos
        .clone()
        .add(new this.#THREE.Vector3(0, 0.02, -0.25).applyQuaternion(camera.quaternion))
      const torsoPos = rootPos
        .clone()
        .add(new this.#THREE.Vector3(0, -0.62, -0.42).applyQuaternion(camera.quaternion))
      const handLPos = rootPos
        .clone()
        .add(new this.#THREE.Vector3(-0.27, -0.48, -0.62).applyQuaternion(camera.quaternion))
      const handRPos = rootPos
        .clone()
        .add(new this.#THREE.Vector3(0.27, -0.48, -0.62).applyQuaternion(camera.quaternion))
      const footLPos = rootPos
        .clone()
        .add(new this.#THREE.Vector3(-0.2, -1.45, -0.35).applyQuaternion(camera.quaternion))
      const footRPos = rootPos
        .clone()
        .add(new this.#THREE.Vector3(0.2, -1.45, -0.35).applyQuaternion(camera.quaternion))

      const nodes = [headPos, torsoPos, handLPos, handRPos, footLPos, footRPos, rootPos, rootPos]
      const ints = Array(8).fill(0.0)

      if (state.ko) {
        if (state.ko === 'head') ints[0] = 5.0
        if (state.ko === 'torso') ints[1] = 5.0
        if (state.ko === 'hands') {
          ints[2] = 5.0
          ints[3] = 5.0
        }
        if (state.ko === 'feet') {
          ints[4] = 5.0
          ints[5] = 5.0
        }
      } else {
        ints[0] = state.ryu.head || 0
        ints[1] = state.ryu.torso || 0
        ints[2] = state.ryu.hands || 0
        ints[3] = state.ryu.hands || 0
        ints[4] = state.ryu.feet || 0
        ints[5] = state.ryu.feet || 0
      }

      this.#fluxUniforms.u_nodes.value = nodes
      this.#fluxUniforms.u_intensities.value = ints
    } else if (state.mode === 'ren' && !state.ken) {
      if (!this.#wasRen) {
        this.#wasRen = true
        this.#renStartTime = seconds
      }
      const elapsed = seconds - this.#renStartTime
      const progress = Math.min(elapsed / 30.0, 1.0) // transition over 30s

      if (progress < 1.0) {
        this.#ren.visible = true
        ;(this.#ren.material as Three.ShaderMaterial).uniforms.u_time.value = seconds
        ;(this.#ren.material as Three.ShaderMaterial).uniforms.u_opacity.value =
          (1.0 - progress) * 0.8
      }

      if (progress > 0.0) {
        this.#renTen.visible = true
        ;(this.#renTen.material as Three.ShaderMaterial).uniforms.u_time.value = seconds
        ;(this.#renTen.material as Three.ShaderMaterial).uniforms.u_opacity.value = progress * 0.8
      }
    } else {
      this.#ten.visible = true
      ;(this.#ten.material as Three.ShaderMaterial).uniforms.u_time.value = seconds
      // Ken can just be a slightly scaled Ten for now
      if (state.ken) {
        this.#ten.scale.set(1.2, 1.2, 1.2)
      } else {
        this.#ten.scale.set(1.0, 1.0, 1.0)
      }
    }

    if (!state.on) {
      this.#wasOn = false
    }

    if (state.mode !== 'ren' || state.ken || !active) {
      this.#wasRen = false
    }

    if (active && state.en !== null) {
      this.#en.visible = true
      this.#en.position.set(0, ground + 0.025 - camera.position.y, 0) // world coords relative to root
      this.#en.scale.setScalar(state.en.radius)
      if (depthTexture) {
        this.#enUniforms.tDepth.value = depthTexture
        this.#enUniforms.u_cameraNear.value = camera.near
        this.#enUniforms.u_cameraFar.value = camera.far
      }
    }

    for (const [index, shell] of [...this.#shu.values()].entries()) {
      const shimmer = 1 + Math.sin(seconds * 4.5 + index * 1.7) * 0.018
      const scale = shell.userData.shuScale as [number, number, number] | undefined
      if (scale) shell.scale.set(scale[0] * shimmer, scale[1] * shimmer, scale[2] * shimmer)
      ;(shell.material as Three.MeshBasicMaterial).opacity =
        0.22 + Math.sin(seconds * 6 + index) * 0.055
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
          const impact =
            kind === 'strike'
              ? 1 + Math.sin(progress * Math.PI) * 0.3
              : 1 + Math.sin(seconds * 9 + partIndex) * 0.06
          mesh.scale.multiplyScalar(impact / Number(mesh.userData.lastImpact ?? 1))
          mesh.userData.lastImpact = impact
          ;(mesh.material as Three.MeshBasicMaterial).opacity =
            (1 - progress) * (kind === 'strike' ? 0.5 : 0.32)
        }
      })
    }
  }

  dispose(scene: Three.Scene) {
    scene.remove(this.#root, this.#world)
    for (const root of [this.#root, this.#world])
      root.traverse((part) => {
        const mesh = part as Three.Mesh
        mesh.geometry?.dispose()
        const material = mesh.material as Three.Material | undefined
        material?.dispose()
      })
    this.#auraGeom.dispose()
  }
}
