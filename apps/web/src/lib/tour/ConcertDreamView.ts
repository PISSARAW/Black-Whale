import type * as Three from 'three'
import type { ConcertPerformance } from './melodyConcert'
import type { ConcertLandscapeWalk } from './concertLandscapeWalk'
import { positionHeldFlute } from './heldFlute'
import { applyGrade, LENS_OFF } from './postGrade'
import type { SceneRuntime } from './TourRenderer'
import { CONCERT_REFERENCE } from './concertReference'
import { isClashConcertActor } from './clashConcertAudience'
import { ConcertFilm, type FilmFrame } from './ConcertFilm'

export const CONCERT_DREAM_LAYER = 27

interface DreamFrame extends FilmFrame {
  camera: Three.PerspectiveCamera
  seconds: number
  yaw: number
  runtime?: SceneRuntime
  exposure?: number
  blend?: number
}

interface AudienceFrame {
  frame: DreamFrame
  performerId: string
  blend: number
  ensemble: ConcertPerformance['ensemble']
}

/** Isolates the imagined world without changing furniture, rooms or Hatsu visibility. */
export class ConcertDreamView {
  private camera: Three.PerspectiveCamera | null = null
  private cameraMask = 1
  private cameraFar = 220
  private cameraFov = 50
  private readonly masks = new Map<Three.Object3D, number>()
  private readonly hiddenAura = new Map<Three.Object3D, boolean>()
  private readonly performerPose = new Map<
    Three.Object3D,
    { position: Three.Vector3; rotation: Three.Euler }
  >()
  private readonly audiencePose = new Map<Three.Object3D, Three.Euler>()
  private previousFog: Three.Scene['fog'] = null
  private previousBackground: Three.Scene['background'] = null
  private readonly fog: Three.FogExp2
  private readonly background: Three.Color
  private readonly passes = new Map<{ enabled: boolean }, boolean>()
  readonly film: ConcertFilm

  constructor(
    THREE: typeof Three,
    private readonly scene: Three.Scene,
  ) {
    this.fog = new THREE.FogExp2(0xd9e6df, 0.0035)
    this.background = new THREE.Color(0xe7eedf)
    this.film = new ConcertFilm(THREE)
  }

  apply(frame: DreamFrame, walk: ConcertLandscapeWalk, performance: ConcertPerformance): void {
    const blend = frame.blend ?? 1
    this.enter(frame.camera)
    this.restoreActors()
    this.restoreAudience()
    const id = performance.mode === 'self' ? 'flute' : 'cast:melody'
    const actor = frame.actors[id]?.root
    if (actor) {
      this.include(actor)
      if (performance.presentation === 'manga') this.suppressAura(actor)
    }
    this.stageAudience({ frame, performerId: id, blend, ensemble: performance.ensemble })
    this.positionCamera(frame, walk, performance)
    this.stageFilm(frame, walk, performance)
    if (frame.runtime) this.optics(frame, performance)
    if (actor && performance.mode === 'self') {
      positionHeldFlute(actor, frame.camera.position, {
        yaw: frame.yaw,
        seconds: frame.seconds,
        playing: true,
      })
    }
  }

  private stageFilm(
    frame: DreamFrame,
    walk: ConcertLandscapeWalk,
    performance: ConcertPerformance,
  ): void {
    const shot = this.film.shot(frame, performance)
    const performer = frame.actors['cast:melody']?.root
    if (shot?.name === 'cover') {
      const glow = this.scene.getObjectByName('concert-melody-heart-glow')
      if (glow) {
        this.hiddenAura.set(glow, glow.visible)
        glow.visible = false
      }
    }
    if (shot) this.film.dream(frame, walk.landscape, shot)
    else if (performer) this.stagePerformer(performer, frame, performance)
  }

  private positionCamera(
    frame: DreamFrame,
    walk: ConcertLandscapeWalk,
    performance: ConcertPerformance,
  ): void {
    const blend = frame.blend ?? 1
    frame.camera.position.set(walk.at[0], walk.floor + 1.7, walk.at[1])
    if (performance.presentation === 'manga') {
      frame.camera.fov = CONCERT_REFERENCE.fov
      frame.camera.rotation.set(0, 0, 0)
      frame.camera.rotateY(CONCERT_REFERENCE.heading)
      frame.camera.rotateX(CONCERT_REFERENCE.pitch)
    }
    frame.camera.layers.mask =
      blend < 0.82 ? this.cameraMask | (1 << CONCERT_DREAM_LAYER) : 1 << CONCERT_DREAM_LAYER
    frame.camera.far = 420
    frame.camera.updateProjectionMatrix()
    this.scene.fog = blend < 0.82 ? this.previousFog : this.fog
    this.scene.background = this.blendedBackground(blend)
  }

  private blendedBackground(blend: number): Three.Scene['background'] {
    if (!(this.previousBackground && 'isColor' in this.previousBackground)) return this.background
    return (this.previousBackground as Three.Color).clone().lerp(this.background, blend)
  }

  restore(): void {
    if (!this.camera) return
    this.restoreActors()
    this.restoreAudience()
    this.film.restore()
    this.camera.layers.mask = this.cameraMask
    this.camera.far = this.cameraFar
    this.camera.fov = this.cameraFov
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
    this.cameraFov = camera.fov
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
    for (const [root, pose] of this.performerPose) {
      root.position.copy(pose.position)
      root.rotation.copy(pose.rotation)
    }
    this.performerPose.clear()
    for (const [object, visible] of this.hiddenAura) object.visible = visible
    this.hiddenAura.clear()
  }

  /** Locks the filmed Clash performance to the chapter's central Melody silhouette. */
  private stagePerformer(
    actor: Three.Object3D,
    frame: DreamFrame,
    performance: ConcertPerformance,
  ): void {
    if (performance.ensemble !== 'clash' || performance.presentation !== 'manga') return
    this.performerPose.set(actor, {
      position: actor.position.clone(),
      rotation: actor.rotation.clone(),
    })
    actor.visible = true
    actor.position.set(
      frame.camera.position.x,
      frame.camera.position.y - 0.3,
      frame.camera.position.z + CONCERT_REFERENCE.distance,
    )
    actor.rotation.set(0, Math.PI, 0)
  }

  /** The chapter shows one small light at Melody's heart, not her full Ten shell. */
  private suppressAura(root: Three.Object3D): void {
    root.traverse((object) => {
      if (!object.name.startsWith('nen-')) return
      if (!this.hiddenAura.has(object)) this.hiddenAura.set(object, object.visible)
      object.visible = false
    })
  }

  /** The room holds its breath before the listeners disappear into the vision. */
  private stageAudience(options: AudienceFrame): void {
    const { frame, performerId, blend, ensemble } = options
    if (ensemble === 'clash') {
      for (const [id, actor] of Object.entries(frame.actors))
        if (actor && id !== performerId && isClashConcertActor(id)) this.include(actor.root)
    } else if (blend < 0.82) this.reactAudience(frame, performerId, blend)
  }

  private reactAudience(frame: DreamFrame, performerId: string, blend: number): void {
    const { actors, seconds } = frame
    const attention = Math.sin(Math.min(1, blend / 0.82) * Math.PI)
    for (const [id, item] of Object.entries(actors)) {
      if (!item || id === performerId || id === 'flute') continue
      this.include(item.root)
      if (!this.audiencePose.has(item.root))
        this.audiencePose.set(item.root, item.root.rotation.clone())
      const base = this.audiencePose.get(item.root)!
      const variation = [...id].reduce((total, char) => total + char.charCodeAt(0), 0)
      const phase = (variation % 11) * 0.37
      const direction = variation % 2 ? 1 : -1
      item.root.rotation.set(
        base.x + attention * (0.025 + (variation % 4) * 0.008),
        base.y + direction * attention * 0.018,
        base.z + direction * attention * (0.006 + Math.sin(seconds * 0.8 + phase) * 0.006),
      )
    }
  }

  private restoreAudience(): void {
    for (const [root, rotation] of this.audiencePose) root.rotation.copy(rotation)
    this.audiencePose.clear()
  }

  private optics(frame: DreamFrame, performance: ConcertPerformance): void {
    const runtime = frame.runtime!
    runtime.renderer.toneMappingExposure = frame.exposure ?? 1
    const manga = performance.presentation === 'manga'
    applyGrade(runtime.grade, {
      grade: manga
        ? { contrast: 1.18, saturation: 0.92, vignette: 0.1 }
        : { contrast: 1, saturation: 0.9, vignette: 0.06 },
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
