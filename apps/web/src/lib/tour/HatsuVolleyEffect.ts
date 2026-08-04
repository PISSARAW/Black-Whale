import type * as Three from 'three'
import type { TourFlash } from './apparitions'

/**
 * How many tracers are drawn, which is how many barrels there are.
 *
 * Ten, which is the ability's own figure: Franklin's ten severed fingertips,
 * one barrel each. Every one of them is a line, so what the room sees is the
 * number the archive gives rather than a spray of unspecified density.
 */
const BARRELS = 10

/** Two ends per tracer, three floats per end. */
const TRACER_FLOATS = BARRELS * 2 * 3

/**
 * Double Machine Gun, firing.
 *
 * Why this exists: the walk had rules for both halves of ch. 353 — the volley
 * on one thing and the sweep across a sector — and drew neither. The struck
 * thing was shoved back, the swept ones stopped being there on the third burst,
 * and the only evidence a shot had been fired was furniture moving by itself.
 * Every other technique whose whole substance is the moment of the cast has a
 * picture; this one had none.
 *
 * So: ten streaks out of the hip, each on its own lane, walking outward and
 * fading. Nothing is drawn where they land — the ability's own claim is that
 * Nen constructs do not stop the bullets, so there is no impact to draw; what
 * stops a round is whatever it was aimed at, and that thing is already
 * answering in the world.
 *
 * One `LineSegments` rather than ten objects: the buffer is allocated once and
 * rewritten each frame, so a burst costs one draw call however wide it spreads.
 */
export class HatsuVolleyEffect {
  readonly #tracers: Three.LineSegments
  readonly #geometry: Three.BufferGeometry
  readonly #material: Three.LineBasicMaterial
  readonly #points = new Float32Array(TRACER_FLOATS)

  constructor(
    THREE: typeof Three,
    private readonly scene: Three.Scene,
  ) {
    this.#material = new THREE.LineBasicMaterial({
      color: 0xe6ad57,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.#geometry = new THREE.BufferGeometry()
    this.#geometry.setAttribute('position', new THREE.BufferAttribute(this.#points, 3))
    this.#tracers = new THREE.LineSegments(this.#geometry, this.#material)
    this.#tracers.visible = false
    this.#tracers.frustumCulled = false
    this.#tracers.renderOrder = 3
    this.scene.add(this.#tracers)
  }

  /**
   * One frame of the burst, `through` being how far into it the flash is.
   *
   * Each barrel gets its own lane off the line of fire and its own moment of
   * opening, so the ten do not travel as one bar. Both come from the index
   * rather than from a random draw: a burst that scattered differently on every
   * frame would shimmer rather than fire.
   */
  play(flash: TourFlash, through: number): void {
    const from = flash.from ?? flash.at
    const dx = flash.at[0] - from[0]
    const dz = flash.at[1] - from[1]
    const reach = Math.hypot(dx, dz) || 1
    // Across the line of fire, for the scatter to be laid out on.
    const sideX = -dz / reach
    const sideZ = dx / reach

    for (let barrel = 0; barrel < BARRELS; barrel++) {
      // Staggered openings: the barrels do not all start at the same instant,
      // and by the end of the flash every one of them has.
      const head = Math.max(0, Math.min(1, through * 1.9 - (barrel / BARRELS) * 0.5))
      // A tracer is a short streak, not a rope from the hip to the target.
      const tail = Math.max(0, head - 0.28)
      // Two lanes' worth either side of the line, and a little of it vertical:
      // ten guns held in two hands do not fire through one hole.
      const lane = ((barrel % 5) - 2) * 0.16 + (barrel < 5 ? -0.08 : 0.08)
      const lift = ((barrel % 3) - 1) * 0.12
      // The burst leaves at hip height and rides up into whatever it was aimed
      // at, so it arrives on the thing rather than flat out of the deck.
      const climb = (along: number) => flash.y + lift - (1 - along) * 0.35

      const at = barrel * 6
      this.#points[at] = from[0] + dx * tail + sideX * lane * (0.3 + tail)
      this.#points[at + 1] = climb(tail)
      this.#points[at + 2] = from[1] + dz * tail + sideZ * lane * (0.3 + tail)
      this.#points[at + 3] = from[0] + dx * head + sideX * lane * (0.3 + head)
      this.#points[at + 4] = climb(head)
      this.#points[at + 5] = from[1] + dz * head + sideZ * lane * (0.3 + head)
    }

    this.#geometry.attributes.position.needsUpdate = true
    this.#material.opacity = 0.9 * (1 - through * through)
    this.#tracers.visible = true
  }

  hide(): void {
    this.#tracers.visible = false
  }

  dispose(): void {
    this.scene.remove(this.#tracers)
    this.#geometry.dispose()
    this.#material.dispose()
  }
}
