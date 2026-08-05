/**
 * The hour, on everything that answers to it — which used to be three things
 * and is now the whole ship.
 *
 * `syncSky` lived in the walk itself and set the glass, the pool that glass
 * throws on its own floor, and the tint of the shafts through it. Three
 * consumers, all of them inside two rooms of 314, and the argument for keeping
 * them together was that they are one statement about what is outside. That
 * argument was right and it is why this file exists rather than four scattered
 * writes; what has changed is the size of the statement. `$lib/tour/regime` adds
 * what the hour does *inside* the hull — the watch the ship goes to at night —
 * and that reaches the deck material, the fittings, the ambient, the air, the
 * dust, the aperture and the grade. Nine consumers of one number.
 *
 * So the number is read once and written out from here, and nothing else in the
 * walk is allowed to hold an opinion about what time it is. Two things follow
 * from that and both are load-bearing:
 *
 * - **The Nen tint composes here too.** A technique that leaves a room standing
 *   in colour writes the ambient and the far air, and so does the regime. Two
 *   independent writers of one `Color` is a race decided by whichever changed
 *   last, and the visible form of that bug is a room that snaps back to daylight
 *   when the hour ticks under a tint. `setTint` and `setHour` therefore both go
 *   through one `apply`, which knows the order: the tint wins where there is
 *   one, over the regime's own values and not over the tuned ones.
 * - **Nothing eases.** Changing event is a jump, not an hour passing — the light
 *   cuts the way `jumpTo` cuts to another deck, with no fade that would imitate a
 *   twilight nobody watched. Guarded on a key, so it costs a string comparison a
 *   frame and lands the frame anything moves.
 *
 * The aperture and the grade are the two the hour cannot simply write, because
 * the visitor owns them too: `exposure` here is a *multiplier* on what the
 * comfort panel asked for, and `grade` is read by the frame loop rather than
 * pushed. Both are getters for that reason.
 */
import type * as Three from 'three'
import type { PostPass } from './postTypes'
import type { TierPlan } from './blueprint'
import type { ShaftWindow } from './shaftDecks'
import type { applySkyPool } from './skyPool'
import { REFERENCE_HOUR, shipTimeOfDay, skyOf, type ShipHourChoice, type Sky } from './sky'
import { REFERENCE_REGIME, regimeOf, type Regime } from './regime'
import { shaftStrength } from './godRays'

/** What the walk hands over: every surface and pass the hour reaches. */
export interface HourStage {
  THREE: typeof Three
  camera: Three.PerspectiveCamera
  renderer: Three.WebGLRenderer
  fog: Three.FogExp2
  ambient: Three.AmbientLight
  /** The structural materials — the plain one and the two glazed rooms'. */
  decks: readonly Three.MeshLambertMaterial[]
  /** The lamps you can see, which dim with what they are lighting. */
  fittings: Three.MeshBasicMaterial
  /** The glass, whose colour is the hour and nothing else. */
  pane: Three.MeshBasicMaterial
  /** The motes of the great voids. */
  motes: Three.PointsMaterial
  /** The daylight pool's uniform block, from `applySkyPool`. */
  pool: ReturnType<typeof applySkyPool>
  shafts: PostPass | null
  /** Where the windows of a deck are, from `createShaftDecks`. */
  windows: (plan: TierPlan) => ShaftWindow[]
  /**
   * Whether a technique has the room on fire.
   *
   * Asked rather than told: `HatsuSceneEffects` drives the fog itself while it
   * burns, and a second writer would fight it for one `Color` a frame.
   */
  burning: () => boolean
}

/** The hour of the walk, and everything that reads it. */
export class TourHourView {
  private sky: Sky = skyOf(REFERENCE_HOUR)
  private regime: Regime = REFERENCE_REGIME
  private key = ''
  private tint: number | null = null
  private readonly point: Three.Vector3
  /** The colour the air closes to, kept so the walk can read it back. */
  readonly air: Three.Color
  /** What the motes were tuned at, before any hour touched them. */
  private readonly moteOpacity: number

  constructor(private readonly stage: HourStage) {
    this.point = new stage.THREE.Vector3()
    this.air = new stage.THREE.Color()
    this.moteOpacity = stage.motes.opacity
    this.apply()
  }

  /** A multiplier on the visitor's own aperture — never a replacement for it. */
  get exposure(): number {
    return this.regime.exposure
  }

  /** The three numbers the grade pass wants this frame. */
  get grade(): Regime['grade'] {
    return this.regime.grade
  }

  /**
   * The hour the walk is showing: the projected event's, or the visitor's
   * override. A no-op unless one of the two actually moved.
   */
  setHour(choice: ShipHourChoice, voyageHours: number | null): void {
    const key = `${choice}|${voyageHours ?? ''}`
    if (key === this.key) return
    this.key = key
    const timeOfDay = shipTimeOfDay(choice, voyageHours)
    this.sky = skyOf(timeOfDay)
    this.regime = regimeOf(timeOfDay)
    this.apply()
  }

  /** The colour a technique has left the room standing in, or none. */
  setTint(tint: number | null): void {
    if (tint === this.tint) return
    this.tint = tint
    this.apply()
  }

  /** The whole write, in the order the two writers have to compose in. */
  private apply(): void {
    this.applySky()
    this.applyRegime()
    this.applyAir()
  }

  /** The two openings: the glass, the pool on its floor, the shafts' hue. */
  private applySky(): void {
    const { glow, tint } = this.sky
    this.stage.pane.color.setRGB(glow[0], glow[1], glow[2])
    this.stage.pool.uSkyGlow.value = [glow[0], glow[1], glow[2]]
    const uniforms = this.stage.shafts?.uniforms
    if (uniforms) uniforms.uTint.value = [tint[0], tint[1], tint[2]]
  }

  /** The other 312 spaces: what the ship's own routine leaves on them. */
  private applyRegime(): void {
    const { deck, fitting, motes } = this.regime
    for (const material of this.stage.decks) material.color.setRGB(deck[0], deck[1], deck[2])
    this.stage.fittings.color.setRGB(fitting[0], fitting[1], fitting[2])
    // Clamped: the motes are additive, and an opacity past 1 is a mote that has
    // stopped being a suggestion of a mote.
    this.stage.motes.opacity = Math.min(1, this.moteOpacity * motes)
  }

  /**
   * The ambient and the far air, where the tint and the regime meet.
   *
   * The tint wins, and it wins over the *regime's* values rather than over the
   * tuned ones: a room gone blue at three in the morning is a darker blue than
   * the same room at noon, which is the whole point of having a night at all.
   * Halfway to white for the ambient, a fifth of itself for the air — both
   * exactly as they were when the walk owned this, and for the reasons argued
   * there: the pure aura colour multiplied into the bake reads as a room that
   * has gone dim, and what is wanted is a room that has gone blue.
   */
  private applyAir(): void {
    const { ambient, air } = this.regime
    const { THREE } = this.stage
    this.stage.ambient.intensity = ambient.intensity
    this.stage.ambient.color.setRGB(ambient.colour[0], ambient.colour[1], ambient.colour[2])
    this.air.setRGB(air.colour[0], air.colour[1], air.colour[2])

    if (this.tint !== null) {
      this.stage.ambient.color.lerp(new THREE.Color(this.tint), 0.6)
      this.air.setHex(this.tint).multiplyScalar(0.22)
    }

    if (this.stage.burning()) return
    this.stage.fog.color.copy(this.air)
    this.stage.renderer.setClearColor(this.air)
  }

  /**
   * A multiplier on the room's own fog, from the hour.
   *
   * Handed back rather than written, because the density is eased in the frame
   * loop towards whichever room the visitor is in — see `settleDensity` — and a
   * write here would be a cut through the middle of that ease.
   */
  get density(): number {
    return this.regime.air.density
  }

  /**
   * The shafts, pointed at whichever window of this deck is on screen.
   *
   * The hour's own peak rather than a constant: at night it is zero, which is
   * the honest way to say the march has nothing to sum — the pane is under the
   * threshold by then whatever this said.
   */
  aim(plan: TierPlan, standingId: string | null): void {
    const uniforms = this.stage.shafts?.uniforms
    if (!uniforms) return

    let strongest = 0
    for (const { anchor, rooms } of this.stage.windows(plan)) {
      if (!standingId || !rooms.has(standingId)) continue
      this.point.set(anchor.position[0], anchor.position[1], anchor.position[2])
      this.point.project(this.stage.camera)
      const strength = shaftStrength(this.point, this.sky.peak)
      if (strength <= strongest) continue
      strongest = strength
      uniforms.uSource.value = [this.point.x * 0.5 + 0.5, this.point.y * 0.5 + 0.5]
    }
    uniforms.uStrength.value = strongest
  }
}
