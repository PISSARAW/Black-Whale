/**
 * The two corners of the picture that are not the picture.
 *
 * Four things can ask for a second camera in a box over the walk, and they pair
 * off by corner rather than by technique. The top corner is a live feed: either
 * Little Eye left in a room some decks away, or the same technique over Morena's
 * fan a metre from the visitor's hands — never both, because one is sent by the
 * dock and the other is put there by the game. The bottom corner is footage:
 * either Secret Window's ten seconds of a bird that has gone, or the table's own
 * owl, which holds still because a recording does.
 *
 * Lifted out of the frame loop as a unit because the two cameras it makes are a
 * unit: they are lazy, they are the table's, they are the only two of the four
 * that nothing outside the render step ever touches, and they were the only
 * mutable state left in that block. Owning them here is what lets the extraction
 * be a move rather than a rewrite — `TourScene` keeps `eyeCamera` and
 * `filmCamera`, which it also builds and aims elsewhere, and hands them in.
 *
 * Behaviour is transcribed and not revisited: the same order, the same
 * `else if` between the two feeds and between the two recordings, the same
 * `0.02`/`40` planes on the table's pair. `renderSceneInset` in `TourRenderer`
 * already owns the scissor dance.
 */
import type * as Three from 'three'
import { EYE_FOV, OWL_FOV, type EyeFeed } from './morena'
import { renderSceneInset, type SceneRuntime } from './TourRenderer'

/** What the walk hands in each frame, once it has drawn the room itself. */
export interface InsetFrame {
  runtime: Pick<SceneRuntime, 'renderer' | 'scene'>
  /** The scratch vector the renderer measures itself into. The caller's. */
  measure: Three.Vector2
  /**
   * The eye left somewhere on the ship, and how far round it has turned.
   *
   * The angle is handed in rather than taken from a clock here: the walk's
   * clock is not the wall's — Parallel Future moves it — and a camera that
   * span on real time would be the one thing in the scene that a rewind did
   * not take back.
   */
  eye: Three.PerspectiveCamera | null
  spin: number
  /** Little Eye over the fan, which is a position rather than a camera. */
  feed: EyeFeed | null
  /** Secret Window's playback, already walked along the bird's path. */
  film: Three.PerspectiveCamera | null
  showing: boolean
  /** The table's owl: footage, so a fixed point rather than a path. */
  record: EyeFeed | null
}

export class SceneInsets {
  private table: Three.PerspectiveCamera | null = null
  private recorded: Three.PerspectiveCamera | null = null

  constructor(private readonly THREE: typeof Three) {}

  /** Both corners, in the order they are drawn over the finished frame. */
  render(frame: InsetFrame): void {
    this.top(frame)
    this.bottom(frame)
  }

  /**
   * The live corner.
   *
   * The eye's feed, inset in the corner: the same scene from where the eye was
   * left, however many decks away that is. Or, failing that, the table's own
   * eye — the same technique doing the same thing a metre away rather than a
   * deck away, so they share the corner.
   */
  private top({ runtime, measure, eye, spin, feed }: InsetFrame): void {
    if (eye) {
      eye.rotation.set(0, 0, 0)
      eye.rotateY(spin)
      renderSceneInset({ runtime, lens: eye, corner: 'top', measure })
      return
    }
    if (!feed) return
    this.table ??= new this.THREE.PerspectiveCamera(EYE_FOV, 1, 0.02, 40)
    this.table.position.set(feed.at[0], feed.y, feed.at[1])
    this.table.lookAt(feed.look[0], feed.lookY, feed.look[1])
    renderSceneInset({ runtime, lens: this.table, corner: 'top', measure })
  }

  /**
   * The footage corner.
   *
   * The owl's film, below the eye's feed: the last ten seconds of a bird that
   * is not there any more, played at the speed it flew them. Or the table's own
   * owl, which stays up once it is up — the hand can end, and footage does not
   * un-happen.
   */
  private bottom({ runtime, measure, film, showing, record }: InsetFrame): void {
    if (film && showing) {
      renderSceneInset({ runtime, lens: film, corner: 'bottom', measure })
      return
    }
    if (!record) return
    this.recorded ??= new this.THREE.PerspectiveCamera(OWL_FOV, 1, 0.02, 40)
    this.recorded.position.set(record.at[0], record.y, record.at[1])
    this.recorded.lookAt(record.look[0], record.lookY, record.look[1])
    renderSceneInset({ runtime, lens: this.recorded, corner: 'bottom', measure })
  }

  /** Drop both cameras, as the walk's teardown always did by hand. */
  clear(): void {
    this.table = null
    this.recorded = null
  }
}
