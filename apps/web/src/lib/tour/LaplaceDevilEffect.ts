import type * as Three from 'three'
import type { Vec2 } from './types'

export const LAPLACE_WINDOW_SECONDS = 10
export const LAPLACE_RADIUS_METRES = 36

/** The blink between the precognitive dream and the real present. */
const BLINK_SECONDS = 0.18
const TRACK_STEP = 0.1

interface TrackPoint {
  at: number
  tierId: string
  where: Vec2
  yaw: number
  pitch: number
  ground: number
}

export interface LaplaceFrame extends Omit<TrackPoint, 'at' | 'where'> {
  clock: number
  position: Vec2
  delta: number
  reducedMotion: boolean
  /** The ten-second dream is being experienced, but has not happened in reality. */
  visionActive: boolean
  /** Zetsu, the beast and the illusion are still holding the predicted branch. */
  abilityActive: boolean
}

export interface LaplaceReset {
  tierId: string
  position: Vec2
  yaw: number
  pitch: number
  ground: number
}

/** Whether the real visitor has left the beast's fixed field. */
export function outsideLaplaceField(
  anchor: { tierId: string; at: Vec2 },
  visitor: { tierId: string; at: Vec2 },
): boolean {
  return (
    anchor.tierId !== visitor.tierId ||
    Math.hypot(anchor.at[0] - visitor.at[0], anchor.at[1] - visitor.at[1]) > LAPLACE_RADIUS_METRES
  )
}

/**
 * The Tour-facing form of Laplace Devil.
 *
 * The ten seconds the visitor walks while the vision is open are a detached
 * prediction. When the eyes open, the scene clock and the visitor return to
 * the activation instant; only the predicted double keeps walking. This is a
 * simulation affordance, not time travel: no authoritative Tour state is
 * meant to survive the dream.
 */
export class LaplaceDevilEffect {
  readonly #track: TrackPoint[] = []
  readonly #afterimage: Three.Group
  readonly #material: Three.MeshBasicMaterial
  #origin: TrackPoint | null = null
  #visionWasActive = false
  #capturing = false
  #clockTakenBack = 0
  #blink = 0
  #illusionSeconds = -1

  constructor(
    THREE: typeof Three,
    private readonly scene: Three.Scene,
  ) {
    this.#material = new THREE.MeshBasicMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
    })
    this.#afterimage = new THREE.Group()
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.05, 4, 8), this.#material)
    body.position.y = 0.95
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), this.#material)
    head.position.y = 1.72
    this.#afterimage.add(body, head)
    this.#afterimage.visible = false
    scene.add(this.#afterimage)
  }

  /** Amount removed from wall time so the dream consumes no time in the Tour world. */
  get clockOffset(): number {
    return this.#clockTakenBack + (this.#blink > 0 ? LAPLACE_WINDOW_SECONDS * this.#blink : 0)
  }

  update(frame: LaplaceFrame): LaplaceReset | null {
    const reset = this.syncVision(frame)
    this.advanceBlink(frame)
    this.replay(frame)
    if (!frame.abilityActive && !frame.visionActive) this.hideIllusion()
    return reset
  }

  dispose(): void {
    this.scene.remove(this.#afterimage)
    this.#afterimage.traverse((part: Three.Object3D) => {
      ;(part as Three.Mesh).geometry?.dispose()
    })
    this.#material.dispose()
  }

  private begin(frame: LaplaceFrame): void {
    this.#track.length = 0
    this.#origin = pointOf(frame)
    this.#capturing = true
    this.#illusionSeconds = -1
    this.#afterimage.visible = false
    this.record(frame, true)
  }

  private syncVision(frame: LaplaceFrame): LaplaceReset | null {
    let reset: LaplaceReset | null = null
    if (frame.visionActive && !this.#visionWasActive) this.begin(frame)
    if (frame.visionActive && this.#capturing) this.record(frame)
    if (!frame.visionActive && this.#visionWasActive && this.#capturing) reset = this.conclude()
    this.#visionWasActive = frame.visionActive
    return reset
  }

  private advanceBlink(frame: Pick<LaplaceFrame, 'delta' | 'reducedMotion'>): void {
    if (this.#blink <= 0) return
    this.#blink = frame.reducedMotion ? 1 : Math.min(1, this.#blink + frame.delta / BLINK_SECONDS)
    if (this.#blink < 1) return
    this.#blink = 0
    this.#clockTakenBack += LAPLACE_WINDOW_SECONDS
    this.#illusionSeconds = 0
  }

  private conclude(): LaplaceReset | null {
    this.#capturing = false
    if (!this.#origin || this.#track.length < 2) return null
    this.#blink = Number.EPSILON
    return {
      tierId: this.#origin.tierId,
      position: [...this.#origin.where],
      yaw: this.#origin.yaw,
      pitch: this.#origin.pitch,
      ground: this.#origin.ground,
    }
  }

  private record(frame: LaplaceFrame, force = false): void {
    const last = this.#track[this.#track.length - 1]
    if (!force && last && frame.clock - last.at < TRACK_STEP) return
    this.#track.push(pointOf(frame))
    while (this.#track[0]?.at < frame.clock - (LAPLACE_WINDOW_SECONDS + 2)) this.#track.shift()
  }

  private replay(frame: LaplaceFrame): void {
    if (this.#illusionSeconds < 0 || this.#blink > 0 || !this.#track.length) {
      this.#afterimage.visible = false
      return
    }

    this.#illusionSeconds += frame.delta
    const seen = this.trackAt(Math.min(LAPLACE_WINDOW_SECONDS, this.#illusionSeconds))
    if (!seen || seen.tierId !== frame.tierId) {
      this.#afterimage.visible = false
      return
    }

    this.#afterimage.visible = true
    this.#afterimage.position.set(seen.where[0], seen.ground, seen.where[1])
    this.#afterimage.rotation.y = seen.yaw
    // Past the known ten seconds, the illusion persists at the last attested
    // pose instead of pretending the Tour can predict an unchosen input.
    this.#material.opacity = this.#illusionSeconds < LAPLACE_WINDOW_SECONDS ? 0.3 : 0.18
  }

  private trackAt(seconds: number): TrackPoint | null {
    const first = this.#track[0]
    if (!first) return null
    const wanted = first.at + seconds
    for (let index = 1; index < this.#track.length; index++) {
      const later = this.#track[index]
      const earlier = this.#track[index - 1]
      if (later.at < wanted) continue
      const along = Math.min(1, Math.max(0, (wanted - earlier.at) / (later.at - earlier.at || 1)))
      return {
        at: wanted,
        tierId: along < 1 ? earlier.tierId : later.tierId,
        where: [
          earlier.where[0] + (later.where[0] - earlier.where[0]) * along,
          earlier.where[1] + (later.where[1] - earlier.where[1]) * along,
        ],
        yaw: earlier.yaw + angleGap(later.yaw, earlier.yaw) * along,
        pitch: earlier.pitch + (later.pitch - earlier.pitch) * along,
        ground: earlier.ground + (later.ground - earlier.ground) * along,
      }
    }
    return this.#track[this.#track.length - 1]
  }

  private hideIllusion(): void {
    this.#illusionSeconds = -1
    this.#afterimage.visible = false
  }
}

function pointOf(frame: LaplaceFrame): TrackPoint {
  return {
    at: frame.clock,
    tierId: frame.tierId,
    where: [...frame.position],
    yaw: frame.yaw,
    pitch: frame.pitch,
    ground: frame.ground,
  }
}

const angleGap = (a: number, b: number) =>
  ((((a - b) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI
