import type * as Three from 'three'
import type { ConcertPerformance } from './melodyConcert'
import type { ConcertLandscapeWalk } from './concertLandscapeWalk'
import { positionHeldFlute } from './heldFlute'
import { applyGrade, LENS_OFF } from './postGrade'
import type { SceneRuntime } from './TourRenderer'

export const CONCERT_DREAM_LAYER = 27

interface DreamFrame {
  camera: Three.PerspectiveCamera
  actors: Record<string, { root: Three.Object3D }>
  seconds: number
  yaw: number
  runtime?: SceneRuntime
  exposure?: number
}

/** Isolates the imagined world without changing furniture, rooms or Hatsu visibility. */
export class ConcertDreamView {
  private camera: Three.PerspectiveCamera | null = null
  private cameraMask = 1
  private cameraFar = 220
  private readonly masks = new Map<Three.Object3D, number>()
  private previousFog: Three.Scene['fog'] = null
  private previousBackground: Three.Scene['background'] = null
  private readonly fog: Three.FogExp2
  private readonly background: Three.Color
  private readonly passes = new Map<{ enabled: boolean }, boolean>()

  constructor(
    THREE: typeof Three,
    private readonly scene: Three.Scene,
  ) {
    this.fog = new THREE.FogExp2(0xd9e6df, 0.0035)
    this.background = new THREE.Color(0xe7eedf)
  }

  apply(frame: DreamFrame, walk: ConcertLandscapeWalk, performance: ConcertPerformance): void {
    this.enter(frame.camera)
    this.restoreActors()
    const id = performance.mode === 'self' ? 'flute' : 'cast:melody'
    const actor = frame.actors[id]?.root
    if (actor) this.include(actor)
    frame.camera.position.set(walk.at[0], walk.floor + 1.7, walk.at[1])
    frame.camera.layers.set(CONCERT_DREAM_LAYER)
    frame.camera.far = 420
    frame.camera.updateProjectionMatrix()
    this.scene.fog = this.fog
    this.scene.background = this.background
    if (frame.runtime) this.optics(frame)
    if (actor && performance.mode === 'self') {
      positionHeldFlute(actor, frame.camera.position, {
        yaw: frame.yaw,
        seconds: frame.seconds,
        playing: true,
      })
    }
  }

  restore(): void {
    if (!this.camera) return
    this.restoreActors()
    this.camera.layers.mask = this.cameraMask
    this.camera.far = this.cameraFar
    this.camera.updateProjectionMatrix()
    this.scene.fog = this.previousFog
    this.scene.background = this.previousBackground
    for (const [pass, enabled] of this.passes) pass.enabled = enabled
    this.passes.clear()
    this.camera = null
  }

  private enter(camera: Three.PerspectiveCamera): void {
    if (this.camera) return
    this.camera = camera
    this.cameraMask = camera.layers.mask
    this.cameraFar = camera.far
    this.previousFog = this.scene.fog
    this.previousBackground = this.scene.background
  }

  private include(root: Three.Object3D): void {
    root.traverse((object) => {
      this.masks.set(object, object.layers.mask)
      object.layers.enable(CONCERT_DREAM_LAYER)
    })
  }

  private restoreActors(): void {
    for (const [object, mask] of this.masks) object.layers.mask = mask
    this.masks.clear()
  }

  private optics(frame: DreamFrame): void {
    const runtime = frame.runtime!
    runtime.renderer.toneMappingExposure = frame.exposure ?? 1
    applyGrade(runtime.grade, {
      grade: { contrast: 1, saturation: 0.9, vignette: 0.06 },
      clock: frame.seconds,
      calm: true,
      lens: LENS_OFF,
    })
    for (const pass of [runtime.shafts, runtime.depthOfField, runtime.motionBlur, runtime.ssr]) {
      if (!pass) continue
      if (!this.passes.has(pass)) this.passes.set(pass, pass.enabled)
      pass.enabled = false
    }
    if (runtime.refraction) runtime.refraction.uniforms.uAmount.value = 0
  }
}
