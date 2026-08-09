/**
 * The eight materials a deck is drawn with, and the arguments behind each.
 *
 * They were built inline in `TourScene.svelte`, which was the right place for
 * them while they were seven constructor calls. They stopped being that. Three
 * of the seven now carry a shader hook — the grain, the daylight pool, the
 * grazing sheen — two of them carry a colour the hour writes every time it
 * moves, and the order the hooks go on in is load-bearing rather than
 * incidental. That is a module, not a preamble.
 *
 * What it is *not* is a place where any of these decisions changed. Every
 * comment below is the comment that was written beside the call it belongs to,
 * and the walk gets back those materials plus the audited floor-pattern line.
 */
import type * as Three from 'three'
import { applySurfaceDetail } from './surfaceDetail'
import { applySheen } from './sheen'
import { applySkyPool } from './skyPool'
import type { QualityProfile } from './quality'

/** Everything a deck is drawn with, and the pool's uniforms with them. */
export interface DeckMaterials {
  /** The structure: bulkheads, floors, deckheads, columns. */
  surface: Three.MeshLambertMaterial
  /** The same, in the two rooms that have a window. */
  skylit: Three.MeshLambertMaterial
  /** The daylight pool's uniform block, which the hour writes. */
  pool: ReturnType<typeof applySkyPool>
  edge: Three.LineBasicMaterial
  seam: Three.LineBasicMaterial
  pattern: Three.LineBasicMaterial
  fitting: Three.MeshBasicMaterial
  pane: Three.MeshBasicMaterial
  dust: Three.PointsMaterial
}

/**
 * The two hooks the structural steel carries, in the order they have to go on.
 *
 * The grain first, then the sheen: `applySheen` chains onto whatever hook it
 * finds rather than replacing it, so the grain has to already be there for the
 * two to compose. Reversed, the sheen would be the earlier hook and the grain
 * would drop it — which is a silent failure, since both edit the same shader
 * and neither throws.
 *
 * The grain is `high` only and the sheen is on everywhere: see `surfaceDetail`
 * and `sheen` in `$lib/tour/quality` for why the cheaper of the two is the one a
 * phone keeps.
 */
function dressSteel(material: Three.MeshLambertMaterial, quality: QualityProfile): void {
  if (quality.surfaceDetail) applySurfaceDetail(material)
  if (quality.sheen) applySheen(material)
}

/**
 * One face per surface, and it is the face that looks at the room.
 *
 * `DoubleSide` was hiding a real defect and paying for it twice. Eight hundred
 * and three pairs of walls on this ship are coplanar — 8 489 of the 29 333
 * metres of partition, 28,9 % — because `wallSegments` runs per room and two
 * rooms either side of a bulkhead each emit their own face on the same line at
 * the same depth. Drawn both ways round, those two faces fight for the depth
 * buffer, which is the shimmer you get walking a corridor. Culled to the front,
 * the far room's face is simply not drawn: the shimmer cannot happen, and every
 * stretch of partition still has a face on each side, each one lit by its own
 * room. That is the whole reason the bake can make a corridor and the cabin
 * behind it two different places.
 *
 * It also halves the fragments, and it makes an inside-out surface visible as a
 * hole instead of leaving it to pass as ordinary steel — see `MeshBuilder.quad`
 * in `$lib/tour/mesh` for what has to hold for that.
 *
 * The grain of the steel is `$lib/tour/surfaceDetail`, and it goes on the
 * structural materials only: the fittings and the window panes are lights, and a
 * lamp with the tooth of a bulkhead on it is a painted panel, not a lamp.
 */
export function createDeckMaterials(THREE: typeof Three, quality: QualityProfile): DeckMaterials {
  const surface = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.FrontSide })
  dressSteel(surface, quality)

  /**
   * The same material again for the two rooms with a window in them, with the
   * daylight pool hung on it — see `$lib/tour/skyPool`.
   *
   * A second material rather than a flag on the first, because what separates
   * them is a vertex attribute: `aSky` exists in two rooms of 314, and a program
   * that reads it in the other 312 would be reading whatever the driver leaves
   * in a missing attribute. The grain goes on first so the glazed rooms are the
   * same steel as everywhere else; the pool composes with it rather than
   * replacing its hook.
   *
   * `phased` is left to `surface` alone on purpose: Luini's walls are about what
   * stops the visitor, and the two rooms that go half transparent with the rest
   * of the deck are these two — so the pool has to follow. Handled where
   * `phased` is applied, not here.
   */
  const skylit = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.FrontSide })
  dressSteel(skylit, quality)
  const pool = applySkyPool(skylit)

  return { surface, skylit, pool, ...trim(THREE), dust: createDust(THREE) }
}

/**
 * The lines and the lights: the five materials that carry no shader hook.
 *
 * Split out for the borne rather than for the argument — the arguments are each
 * beside their own call below, where they have always been.
 */
function trim(
  THREE: typeof Three,
): Pick<DeckMaterials, 'edge' | 'seam' | 'pattern' | 'fitting' | 'pane'> {
  return {
    // The gold outline the deck plans are drawn in, carried into three
    // dimensions: without it the decks read as one unbroken surface.
    edge: new THREE.LineBasicMaterial({ color: 0xffd700, transparent: true, opacity: 0.32 }),

    /**
     * The seams between the deck plates: dim steel, not the gold of the plans.
     *
     * This is the one thing a bare floor cannot tell the visitor — how fast they
     * are crossing it. A hundred-and-fifty-metre hall drawn as an unbroken sheet
     * reads the same at a walk as at a run, and the courses passing underfoot at
     * `PLATE_PITCH` are what turn the published measurement into something felt.
     * Faint on purpose: it is a texture to walk over, not a grid to read.
     */
    seam: new THREE.LineBasicMaterial({ color: 0x6f6256, transparent: true, opacity: 0.22 }),

    // Tile grout, floorboard ends and the pod's radial joints are panel-shown
    // facts, not the inferred plating above. Kept neutral, but made legible in
    // the dim rooms where the generic seam would disappear into the floor.
    pattern: new THREE.LineBasicMaterial({
      color: 0xb8a58d,
      transparent: true,
      opacity: 0.5,
    }),

    /**
     * The ceiling fittings: the one surface on the deck that is a light.
     *
     * `MeshBasicMaterial`, because a lamp must not be lit — run through the
     * Lambert material it would take the night-light and the ambient like any
     * other steel and come out as a pale square, which is a vent, not a lamp.
     *
     * What they burn at comes from the buffer rather than from here — see
     * `FITTING_GLOW` and `fittingColors` in `$lib/tour/mesh`, which is also where
     * the values above 1 and the dimming of an invented room's lamps are argued.
     * The material only has to agree not to light them.
     *
     * Its `color` is the one thing here the hour writes: the ship turns its
     * lamps down on the night watch, and a fitting that stayed at full burn while
     * the floor under it dimmed would be a lamp lighting nothing. See
     * `$lib/tour/regime`.
     *
     * Fog is left on. A row of fittings running away down a hundred and forty
     * metres of corridor, each one dimmer than the last, is the whole point of
     * drawing them: it is the only thing in the walk that makes the length of
     * this ship countable.
     */
    fitting: new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.FrontSide }),

    /**
     * The glass of the two windows: the one surface on the deck whose colour is
     * not settled by the bake.
     *
     * `MeshBasicMaterial` for the reason the fittings are — a pane must not be
     * lit — and its own material rather than theirs because what it carries is
     * different in kind. A fitting burns at what the room's own filament burns
     * at, which is a fact about the deck; the glass burns at what is outside it,
     * which is a fact about the hour of the voyage.
     *
     * So the mesh bakes the two bands *relative* to each other — sky at 1, water
     * at `SEA_FRACTION`, see `paneColors` in `$lib/tour/mesh` — and this colour
     * carries the hour. One material for the whole visit, so a deck sitting in
     * the cache is showing the right sky the moment the visitor walks back onto
     * it.
     *
     * It is written at the drawn state of ch. 380 before a frame is rendered,
     * because `TourHourView` applies on construction: `skyOf(REFERENCE_HOUR).glow`
     * is `WINDOW_GLOW`, which is what the walk showed before any of this.
     */
    pane: new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.FrontSide }),
  }
}

/**
 * The dust of the ten great voids.
 *
 * Warm grey rather than white, because the only thing lighting it is the ship's
 * own filaments, and additive at a low opacity so a mote is a suggestion of a
 * mote. `sizeAttenuation` is the whole point: the motes near the visitor are
 * specks and the ones fifty metres off are barely there, and that gradient is
 * what says how deep the room is.
 *
 * The opacity here is the day's. A ship on a night regime runs its ventilation
 * down with its lighting, and a still room holds what is in the air instead of
 * moving it along — so the hour thickens this. See `motes` in `$lib/tour/regime`.
 */
function createDust(THREE: typeof Three): Three.PointsMaterial {
  return new THREE.PointsMaterial({
    color: 0xb9a88f,
    size: 0.07,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.55,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
}
