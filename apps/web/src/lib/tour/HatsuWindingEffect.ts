import type * as Three from 'three'
import type { Vec2 } from './types'

/** Ripper Cyclotron's own gold, as the dock publishes the technique. */
const CYCLOTRON = 0xf2c34f

/**
 * How many turns the ring is drawn against.
 *
 * Ch. 92's figure, and the same one `ripper.ts` reasons from: fifteen rotations
 * and what fifteen rotations did to a body that was not going to be moved by
 * being pushed. The ring is at its widest and its fastest there and stops
 * growing past it, because the archive stops counting there.
 */
const ANT_TURNS = 15

export interface WindingFrame {
  /** Turns wound into the visitor's own arm, which is `TourWorld.windup`. */
  turns: number
  at: Vec2
  /** The visitor's eye height, in metres. */
  eye: number
  yaw: number
  delta: number
}

/**
 * The arm, turning, while it is still turning.
 *
 * The reason this exists: the wind-up is the whole visible cost of Ripper
 * Cyclotron — it is what the archive lists as the price — and the walk drew
 * nothing for it at all. A visitor pressed the key, a line appeared in the
 * panel, and the ship said nothing, which reads exactly like a technique that
 * is not working. So the charge is worn: a ring of aura going round in front of
 * whoever is carrying it, tighter and faster the more is in there, and gone the
 * instant the arm is let go of.
 *
 * Carried rather than placed, like Kurton's chassis: it goes where the visitor
 * is, facing where they face, every frame. It is not a flash — a flash is over,
 * and this is exactly the thing that is *not* over until it is spent.
 */
export class HatsuWindingEffect {
  readonly #ring: Three.Mesh
  readonly #material: Three.MeshBasicMaterial
  #spun = 0

  constructor(
    THREE: typeof Three,
    private readonly scene: Three.Scene,
  ) {
    this.#material = new THREE.MeshBasicMaterial({
      color: CYCLOTRON,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.#ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.09, 8, 30), this.#material)
    this.#ring.visible = false
    this.#ring.frustumCulled = false
    this.scene.add(this.#ring)
  }

  update(frame: WindingFrame): void {
    const { turns, at, eye, yaw, delta } = frame
    this.#ring.visible = turns > 0
    if (turns <= 0) {
      this.#spun = 0
      return
    }
    // Towards the fifteen and no further. What grows is how fast it goes round
    // and how brightly it sits there; how wide it is barely moves, because an
    // arm is the length of an arm however many times it has been round.
    const wound = Math.min(1, turns / ANT_TURNS)
    this.#spun += delta * (3 + wound * 9)
    // A pace in front of the visitor and a little below the eye, which is where
    // an arm is: close enough to be unmistakably theirs, clear of the reticle.
    this.#ring.position.set(at[0] - Math.sin(yaw) * 1.15, eye - 0.45, at[1] - Math.cos(yaw) * 1.15)
    this.#ring.rotation.set(0, yaw, this.#spun)
    this.#ring.scale.setScalar(0.34 + wound * 0.12)
    this.#material.opacity = 0.3 + wound * 0.35
  }

  dispose(): void {
    this.scene.remove(this.#ring)
    this.#ring.geometry.dispose()
    this.#material.dispose()
  }
}
