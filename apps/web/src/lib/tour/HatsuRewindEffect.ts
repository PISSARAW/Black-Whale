import type * as Three from 'three'
import { rewindSound } from '$lib/audio/steps'
import type { Vec2 } from './types'

const REWIND_SECONDS = 10
const REEL_SECONDS = 1.2
const TRACK_STEP = 0.1

interface TrackPoint {
  at: number
  where: Vec2
  yaw: number
}

export interface RewindFrame {
  clock: number
  position: Vec2
  yaw: number
  ground: number
  delta: number
}

/** Records, rewinds and replays the visitor's predicted ten seconds. */
export class HatsuRewindEffect {
  readonly #track: TrackPoint[] = []
  readonly #afterimage: Three.Group
  readonly #material: Three.MeshBasicMaterial
  #sinceSample = 0
  #rewound = 0
  #reeling = 0
  #after = -1

  constructor(
    private readonly THREE: typeof Three,
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

  get offset(): number {
    return this.#rewound + (this.#reeling > 0 ? REWIND_SECONDS * this.#reeling : 0)
  }

  start(): void {
    if (!this.#track.length) return
    rewindSound(REEL_SECONDS)
    this.#reeling = Number.EPSILON
  }

  update(frame: RewindFrame): void {
    this.record(frame)
    if (this.#reeling > 0) {
      this.#reeling = Math.min(1, this.#reeling + frame.delta / REEL_SECONDS)
      if (this.#reeling >= 1) {
        this.#reeling = 0
        this.#rewound += REWIND_SECONDS
        this.#after = 0
      }
      return
    }
    this.replay(frame)
  }

  dispose(): void {
    this.scene.remove(this.#afterimage)
    this.#afterimage.traverse((part: Three.Object3D) => {
      ;(part as Three.Mesh).geometry?.dispose()
    })
    this.#material.dispose()
  }

  private record(frame: RewindFrame): void {
    this.#sinceSample += frame.delta
    if (this.#sinceSample < TRACK_STEP) return
    this.#sinceSample = 0
    this.#track.push({ at: frame.clock, where: frame.position, yaw: frame.yaw })
    while (this.#track[0]?.at < frame.clock - (REWIND_SECONDS + 2)) this.#track.shift()
  }

  private replay(frame: RewindFrame): void {
    if (this.#after < 0) {
      this.#afterimage.visible = false
      return
    }
    this.#after += frame.delta
    if (this.#after >= REWIND_SECONDS) {
      this.#after = -1
      this.#afterimage.visible = false
      return
    }
    const seen = this.trackAt(REWIND_SECONDS - this.#after)
    if (!seen) return
    this.#afterimage.visible = true
    this.#afterimage.position.set(seen.where[0], frame.ground, seen.where[1])
    this.#afterimage.rotation.y = seen.yaw
    this.#material.opacity = 0.3 * (1 - (this.#after / REWIND_SECONDS) ** 2)
  }

  private trackAt(seconds: number): TrackPoint | null {
    if (!this.#track.length) return null
    const wanted = this.#track[this.#track.length - 1].at - seconds
    if (wanted <= this.#track[0].at) return this.#track[0]
    for (let i = this.#track.length - 1; i > 0; i--) {
      const later = this.#track[i]
      const earlier = this.#track[i - 1]
      if (later.at < wanted) continue
      const along = Math.min(1, Math.max(0, (wanted - earlier.at) / (later.at - earlier.at || 1)))
      return {
        at: wanted,
        where: [
          earlier.where[0] + (later.where[0] - earlier.where[0]) * along,
          earlier.where[1] + (later.where[1] - earlier.where[1]) * along,
        ],
        yaw: earlier.yaw + angleGap(later.yaw, earlier.yaw) * along,
      }
    }
    return this.#track[this.#track.length - 1]
  }
}

const angleGap = (a: number, b: number) =>
  ((((a - b) % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2)) - Math.PI
