import type * as Three from 'three'
import type { HumanFigure } from './humanFigure'
import type { SceneRuntime } from './TourRenderer'
import type { ConcertPerformance } from './melodyConcert'
import { isClashConcertActor } from './clashConcertAudience'
import { concertLandscapeHeight, type ConcertLandscapeSpec } from './concertLandscapeWalk'
import type { Vec2 } from './types'
import type { AnimatedHuman } from './humanAnimation'
import { frameConcertCover } from './concertCover'

function flutePhrasing(rig: AnimatedHuman, seconds: number): void {
  const phrase = Math.sin(seconds * 1.12) + 0.32 * Math.sin(seconds * 2.6)
  rig.figure.rotation.z += 0.052 * phrase
  rig.figure.rotation.y += 0.17 * Math.sin(seconds * 0.64)
  rig.figure.rotation.x += 0.042 * Math.sin(seconds * 1.12 - 0.45)
  rig.head.rotation.x += 0.015 * Math.sin(seconds * 2.4)
}

interface FilmActor {
  root: Three.Object3D
  at?: Vec2
  humanHeading?: number
  humanLod?: HumanFigure['lod']
  humanAnimate?: HumanFigure['animate']
}

export interface FilmFrame {
  camera: Three.PerspectiveCamera
  runtime?: SceneRuntime
  actors: Readonly<Record<string, FilmActor | undefined>>
}

interface Shot {
  name: string
  seconds: number
  slide: number
}

export class ConcertFilm {
  private readonly focus: Three.Vector3
  private readonly floors = new Map<Three.Object3D, number>()
  private readonly eyes = new Map<Three.Object3D, number>()
  private shotName = ''
  private cutAt = 0

  constructor(THREE: typeof Three) {
    this.focus = new THREE.Vector3()
  }

  shot(frame: FilmFrame, performance: ConcertPerformance): Shot | undefined {
    if (performance.ensemble !== 'clash') return
    const name = frame.runtime?.renderer.domElement.dataset.concertShot
    if (!name) return
    const seconds = globalThis.performance.now() / 1000
    if (name !== this.shotName) {
      this.shotName = name
      this.cutAt = seconds
    }
    return { name, seconds, slide: 1 - Math.exp(-(seconds - this.cutAt) / 6) }
  }

  restore(): void {
    for (const [root, y] of this.floors) root.position.y = y
    this.floors.clear()
    this.restoreEyes()
  }

  private restoreEyes(): void {
    for (const [eye, scale] of this.eyes) eye.scale.y = scale
    this.eyes.clear()
  }

  dream(frame: FilmFrame, spec: ConcertLandscapeSpec, shot: Shot): void {
    this.restoreEyes()
    this.positionCast(frame, spec)
    const melody = frame.actors['cast:melody']
    if (melody) {
      melody.root.visible = true
      melody.root.position.set(spec.origin[0], spec.floor + spec.stageRise + 0.035, spec.origin[1])
      melody.root.rotation.set(0, Math.PI, 0)
      this.frontDetail(melody)?.humanAnimate?.(shot.seconds, 'flute', {
        afterMotion: (rig) => flutePhrasing(rig, shot.seconds),
      })
    }
    if (this.portrait(frame, shot)) return
    if (shot.name === 'cover') {
      frameConcertCover(frame, spec, this.focus)
      return
    }
    this.landscape(frame.camera, spec, shot)
  }

  private positionCast(frame: FilmFrame, spec: ConcertLandscapeSpec): void {
    for (const [id, actor] of Object.entries(frame.actors)) {
      if (!actor?.at || !isClashConcertActor(id)) continue
      const { root, at } = actor
      if (!this.floors.has(root)) this.floors.set(root, root.position.y)
      root.position.set(at[0], concertLandscapeHeight(spec, at) + 0.035, at[1])
      root.rotation.set(0, actor.humanHeading ?? 0, 0)
    }
  }

  hall(frame: FilmFrame, performance: ConcertPerformance, spec: ConcertLandscapeSpec | null): void {
    this.restoreEyes()
    if (!spec) return
    const shot = this.shot(frame, performance)
    if (!shot) return
    if (this.portrait(frame, shot)) return
    const { camera } = frame
    const y = spec.floor
    if (shot.name === 'hall-stage') {
      camera.position.set(-1 + shot.slide, y + 2.9, 24.3)
      this.focus.set(-0.7, y + 1.1, 0)
      camera.fov = 57
    } else {
      camera.position.set(-1 + shot.slide, y + 4.2, -18 + 2 * shot.slide)
      this.focus.set(-1, y + 1.5, 17)
      camera.fov = 64
    }
    if (camera.aspect < 1) camera.fov += 15
    this.aim(camera)
  }

  private frontDetail(actor: FilmActor): FilmActor | undefined {
    if (!actor.humanLod) return
    actor.humanLod.near.visible = true
    actor.humanLod.far.visible = false
    return actor
  }

  private portrait(frame: FilmFrame, shot: Shot): boolean {
    if (!shot.name.startsWith('cast:')) return false
    const actor = frame.actors[shot.name]
    if (!actor?.humanLod) return false
    const { near } = actor.humanLod
    this.frontDetail(actor)
    const eye = near.getObjectByName('face-eye-left')
    if (!eye?.parent) return false
    actor.humanAnimate?.(shot.seconds, 'idle')
    const variation = shot.name.length
    const side = variation % 2 ? 1 : -1
    const beat = Math.sin(shot.slide * 8)
    eye.parent.rotation.x += 0.075 * beat
    eye.parent.rotation.y += side * (0.11 * beat - 0.055)
    this.blink(eye, shot, variation)
    const right = near.getObjectByName('face-eye-right')
    if (right) this.blink(right, shot, variation)
    eye.parent.getWorldPosition(this.focus)
    this.framePortrait(frame.camera, { side, slide: shot.slide })
    return true
  }

  private framePortrait(
    camera: Three.PerspectiveCamera,
    framing: { side: number; slide: number },
  ): void {
    const { side, slide } = framing
    const vertical = camera.aspect < 1
    this.focus.y -= 0.075
    camera.position.copy(this.focus)
    camera.position.x += side * (0.42 - 0.27 * slide)
    camera.position.y += 0.085
    camera.position.z += 1.09 - 0.18 * slide
    this.focus.x += side * (vertical ? 0.025 : 0.105)
    camera.fov = vertical ? 42 : 34
    this.aim(camera)
  }

  private blink(eye: Three.Object3D, shot: Shot, variation: number): void {
    const moment = (shot.seconds + variation * 0.13) % 3.6
    const blink = Math.exp(-((moment - 1.25) ** 2) / 0.003)
    this.eyes.set(eye, eye.scale.y)
    eye.scale.y *= 1 - 0.91 * blink
  }

  private landscape(camera: Three.PerspectiveCamera, spec: ConcertLandscapeSpec, shot: Shot): void {
    const [x, z] = spec.origin
    const y = spec.floor
    const { slide: t } = shot
    switch (shot.name) {
      case 'meadow':
        camera.position.set(x - 9 + 5 * t, y + 0.75 + t, z - 8 + 3 * t)
        this.focus.set(x + 11 - 7 * t, y + 5, z + 22)
        camera.fov = 72
        break
      case 'vista':
        camera.position.set(x + 15 - 21 * t, y + 9 + 7 * t, z - 40 + 8 * t)
        this.focus.set(x, y + 3.5, z - 5)
        camera.fov = 65
        break
      case 'profile':
        camera.position.set(x + 1.94 - t, y + spec.stageRise + 1.34, z - 2 - t)
        this.focus.set(x + 0.05, y + spec.stageRise + 1.15, z)
        camera.fov = 37
        break
      case 'flute':
        camera.position.set(x - 0.63 + 0.5 * t, y + spec.stageRise + 1.3, z - 1.8)
        this.focus.set(x - 0.15, y + spec.stageRise + 1.25, z)
        camera.fov = 36
        break
      default:
        camera.position.set(x, y + 1.7, z - 7.2 + 1.5 * t)
        this.focus.set(x, y + 1.85, z)
        camera.fov = 52
    }
    if (camera.aspect < 1) this.frameVerticalLandscape(camera, shot)
    this.aim(camera)
  }

  private frameVerticalLandscape(camera: Three.PerspectiveCamera, shot: Shot): void {
    const { position } = camera
    switch (shot.name) {
      case 'flute':
        position.z -= 0.65
        this.focus.x += 0.17
        camera.fov = 52
        break
      case 'profile':
        position.z -= 0.55
        camera.fov = 47
        break
      case 'vista':
      case 'meadow':
        camera.fov += 7
        break
      default:
        position.z += 1.4
        this.focus.y += 0.28
    }
  }

  private aim(camera: Three.PerspectiveCamera): void {
    camera.lookAt(this.focus)
    camera.updateProjectionMatrix()
  }
}
