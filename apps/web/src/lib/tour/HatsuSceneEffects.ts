import type * as Three from 'three'
import type { Vec2 } from './types'
import type { TourFlash } from './apparitions'

const GUST_SECONDS = 1.1
const PUNCH_SECONDS = 1
const SUN_SECONDS = 2.4
const ARROW_SECONDS = 0.9
const BLAST_SECONDS = 0.9

type SequencedFlash = TourFlash & { seq: number }

/** Owns transient and visitor-carried Nen visuals outside the apparition world. */
export class HatsuSceneEffects {
  readonly #chassis: Three.Group
  readonly #chassisSkin: Three.MeshLambertMaterial
  readonly #headlamp: Three.PointLight
  readonly #gustPositions = new Float32Array(90 * 3)
  readonly #gustGeometry: Three.BufferGeometry
  readonly #gustMaterial: Three.PointsMaterial
  readonly #gust: Three.Points
  readonly #gustRingMaterial: Three.MeshBasicMaterial
  readonly #gustRing: Three.Mesh
  readonly #sunMaterial: Three.MeshBasicMaterial
  readonly #sun: Three.Mesh
  readonly #sunLight: Three.PointLight
  readonly #blastMaterial: Three.MeshBasicMaterial
  readonly #blast: Three.Mesh
  readonly #blastLight: Three.PointLight
  readonly #arrowMaterial: Three.MeshBasicMaterial
  readonly #shaft: Three.Group
  readonly #fist: Three.Group
  readonly #fistMaterial: Three.MeshBasicMaterial
  #playing = 0
  #playedSeq = -1
  #played: SequencedFlash | null = null
  burning = 0

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
    this.#gustGeometry = new THREE.BufferGeometry()
    this.#gustGeometry.setAttribute('position', new THREE.BufferAttribute(this.#gustPositions, 3))
    this.#gustMaterial = new THREE.PointsMaterial({
      color: 0xc6f1ff, size: 0.22, sizeAttenuation: true, transparent: true,
      opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false,
    })
    this.#gust = new THREE.Points(this.#gustGeometry, this.#gustMaterial)
    this.#gust.visible = false
    this.#gust.frustumCulled = false
    this.#gustRingMaterial = new THREE.MeshBasicMaterial({
      color: 0xc6f1ff, transparent: true, opacity: 0.5,
      side: THREE.DoubleSide, depthWrite: false,
    })
    this.#gustRing = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.06, 6, 28), this.#gustRingMaterial,
    )
    this.#gustRing.visible = false
    this.#sunMaterial = new THREE.MeshBasicMaterial({
      color: 0xf2a63b, transparent: true, opacity: 0.3, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    this.#sun = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), this.#sunMaterial)
    this.#sun.visible = false
    this.#sunLight = new THREE.PointLight(0xffb14a, 0, 60, 2)
    this.#blastMaterial = new THREE.MeshBasicMaterial({
      color: 0xffc46b, transparent: true, opacity: 0.5, side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    this.#blast = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 16), this.#blastMaterial)
    this.#blast.visible = false
    this.#blastLight = new THREE.PointLight(0xffb14a, 0, 40, 2)
    this.#arrowMaterial = new THREE.MeshBasicMaterial({
      color: 0xf7e27d, transparent: true, opacity: 0.95, depthTest: false,
    })
    this.#shaft = new THREE.Group()
    const arrowShaft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.6, 6), this.#arrowMaterial,
    )
    arrowShaft.rotation.x = Math.PI / 2
    this.#shaft.add(arrowShaft)
    const arrowHead = new THREE.Mesh(new THREE.ConeGeometry(0.13, 0.4, 6), this.#arrowMaterial)
    arrowHead.rotation.x = -Math.PI / 2
    arrowHead.position.z = -1
    this.#shaft.add(arrowHead)
    this.#shaft.visible = false
    this.#shaft.frustumCulled = false
    this.#shaft.renderOrder = 3
    this.#fistMaterial = new THREE.MeshBasicMaterial({
      color: 0x55a7ff, transparent: true, opacity: 0.72,
      blending: THREE.AdditiveBlending, depthWrite: false,
    })
    this.#fist = new THREE.Group()
    const knuckles = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.75, 0.8), this.#fistMaterial)
    knuckles.position.y = 1.2
    const thumb = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.55), this.#fistMaterial)
    thumb.position.set(0.55, 1.15, 0.1)
    const forearm = new THREE.Mesh(
      new THREE.CylinderGeometry(0.32, 0.36, 1.6, 10), this.#fistMaterial,
    )
    forearm.position.y = 0.2
    this.#fist.add(knuckles, thumb, forearm)
    this.#fist.visible = false
    scene.add(
      this.#chassis, this.#headlamp, this.#gust, this.#gustRing, this.#sun,
      this.#sunLight, this.#blast, this.#blastLight, this.#shaft, this.#fist,
    )
  }

  play(flash: SequencedFlash): boolean {
    if (flash.seq === this.#playedSeq) return false
    this.#playedSeq = flash.seq
    this.#played = flash
    this.#playing = 0
    if (flash.kind !== 'gust') return true
    const from = flash.from ?? flash.at
    for (let i = 0; i < 90; i++) {
      const along = i / 90
      this.#gustPositions[i * 3] = from[0] + (flash.at[0] - from[0]) * along
      this.#gustPositions[i * 3 + 1] = flash.y
      this.#gustPositions[i * 3 + 2] = from[1] + (flash.at[1] - from[1]) * along
    }
    this.#gustGeometry.attributes.position.needsUpdate = true
    return true
  }

  tickFlash(
    delta: number,
    view: { camera: Three.PerspectiveCamera; tierId: string; blinded: boolean },
    fog: Three.FogExp2,
    baseFog: Three.Color,
    renderer: Three.WebGLRenderer,
  ): void {
    const played = this.#played
    if (!played || played.kind === 'rewind' || played.kind === 'lash') return
    this.#playing += delta
    const span = played.kind === 'gust' ? GUST_SECONDS : played.kind === 'sun' ? SUN_SECONDS
      : played.kind === 'arrow' ? ARROW_SECONDS : played.kind === 'blast' ? BLAST_SECONDS : PUNCH_SECONDS
    const through = this.#playing / span
    if (through >= 1) {
      this.hideFlashes()
      if (this.burning) {
        this.burning = 0
        renderer.toneMappingExposure = view.blinded ? 0.02 : 1
        fog.color.copy(baseFog)
      }
      this.#played = null
      return
    }
    if (played.kind === 'arrow') {
      const from = played.from ?? played.at
      const flown = Math.min(1, through * 3)
      this.#shaft.visible = true
      this.#shaft.position.set(
        from[0] + (played.at[0] - from[0]) * flown,
        played.y + Math.sin(flown * Math.PI) * 1.2,
        from[1] + (played.at[1] - from[1]) * flown,
      )
      this.#shaft.lookAt(played.at[0], played.y, played.at[1])
      this.#arrowMaterial.opacity = 0.95 * (1 - Math.max(0, (through - 0.5) * 2))
      return
    }
    if (played.kind === 'blast') {
      if (played.tierId !== view.tierId) return this.hideBlast()
      const out = Math.min(1, through * 5)
      const metres = Math.max(2, played.metres ?? 4)
      this.#blast.visible = true
      this.#blast.position.set(played.at[0], played.y, played.at[1])
      this.#blast.scale.setScalar(metres * (0.3 + out * 0.7))
      this.#blastMaterial.opacity = 0.55 * (1 - through) ** 2
      this.#blastLight.position.copy(this.#blast.position)
      this.#blastLight.intensity = 40 * out * (1 - through)
      return
    }
    if (played.kind === 'sun') {
      const risen = Math.min(1, through * 3)
      const metres = Math.max(2, played.metres ?? 4)
      this.#sun.visible = true
      this.#sun.position.copy(view.camera.position)
      this.#sun.scale.setScalar(metres * risen)
      this.#sunMaterial.opacity = 0.34 * (1 - through * through)
      this.#sunLight.position.copy(view.camera.position)
      this.#sunLight.distance = metres * 2.5
      this.#sunLight.intensity = 26 * risen * (1 - through)
      this.burning = risen * (1 - through * through)
      renderer.toneMappingExposure = 1 + this.burning * 2.6
      fog.color.setHex(0xf2a63b)
      return
    }
    if (played.kind === 'gust') {
      this.animateGust(played, through)
      return
    }
    const rise = through < 0.25 ? through / 0.25 : Math.max(0, 1 - (through - 0.25) / 0.75)
    this.#fist.visible = true
    this.#fist.position.set(played.at[0], played.y - 2 + rise * 3.1, played.at[1])
    this.#fist.rotation.y = this.#playedSeq
    this.#fistMaterial.opacity = 0.72 * (1 - through * 0.6)
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

  private animateGust(played: SequencedFlash, through: number): void {
    if (played.kind !== 'gust') return
    const from = played.from ?? played.at
    const reach = Math.hypot(played.at[0] - from[0], played.at[1] - from[1]) || 1
    this.#gust.visible = true
    for (let i = 0; i < 90; i++) {
      const along = (i / 90 + through * 1.6) % 1
      const swirl = (i % 7) - 3
      this.#gustPositions[i * 3] = from[0] + (played.at[0] - from[0]) * along + swirl * 0.12
      this.#gustPositions[i * 3 + 1] = played.y + Math.sin(along * 9 + i) * 0.5
      this.#gustPositions[i * 3 + 2] = from[1] + (played.at[1] - from[1]) * along + swirl * 0.12
    }
    this.#gustGeometry.attributes.position.needsUpdate = true
    this.#gustMaterial.opacity = 0.8 * (1 - through)
    const landed = Math.max(0, (through - 0.45) / 0.55)
    this.#gustRing.visible = landed > 0
    this.#gustRing.position.set(played.at[0], played.y, played.at[1])
    this.#gustRing.rotation.set(Math.PI / 2, 0, 0)
    this.#gustRing.scale.setScalar(0.4 + landed * Math.min(6, reach * 0.35))
    this.#gustRingMaterial.opacity = 0.5 * (1 - landed)
  }

  private hideBlast(): void {
    this.#blast.visible = false
    this.#blastLight.intensity = 0
  }

  private hideFlashes(): void {
    this.#gust.visible = false
    this.#gustRing.visible = false
    this.#fist.visible = false
    this.#shaft.visible = false
    this.#sun.visible = false
    this.#sunLight.intensity = 0
    this.hideBlast()
  }

  dispose(): void {
    this.scene.remove(
      this.#chassis, this.#headlamp, this.#gust, this.#gustRing, this.#sun,
      this.#sunLight, this.#blast, this.#blastLight, this.#shaft, this.#fist,
    )
    this.#chassis.traverse((part: Three.Object3D) => {
      const mesh = part as Three.Mesh
      mesh.geometry?.dispose()
      const material = mesh.material
      if (material && material !== this.#chassisSkin) {
        if (Array.isArray(material)) for (const item of material) item.dispose()
        else material.dispose()
      }
    })
    this.#chassisSkin.dispose()
    this.#gustGeometry.dispose()
    this.#gustMaterial.dispose()
    this.#gustRing.geometry.dispose()
    this.#gustRingMaterial.dispose()
    this.#sun.geometry.dispose()
    this.#sunMaterial.dispose()
    this.#blast.geometry.dispose()
    this.#blastMaterial.dispose()
    this.#shaft.traverse((part: Three.Object3D) => (part as Three.Mesh).geometry?.dispose())
    this.#arrowMaterial.dispose()
    this.#fist.traverse((part: Three.Object3D) => (part as Three.Mesh).geometry?.dispose())
    this.#fistMaterial.dispose()
  }
}
