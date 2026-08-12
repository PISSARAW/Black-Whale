/**
 * What a frame of the walk costs, and what it was allowed to cost.
 *
 * Five waves of effects have been added to the tour — the bloom, the shafts at
 * the two windows, the air bending round an aura, the darkness in the
 * junctions, the dither on the way out — and not one of them was ever weighed.
 * `quality.ts` says what a palier switches off and argues for each line, which
 * is a policy; nothing said what a palier *spends*, which is the measurement
 * the policy was supposed to be about. So `low` has been a promise rather than
 * a budget: a phone could have been dropping to twelve frames a second for a
 * month and the only way anyone would know is by holding one.
 *
 * This is the missing half. `renderer.info` already counts every draw call and
 * every triangle three.js issues — it costs nothing, it has always been there,
 * and the walk has never once read it.
 *
 * Two honesties about what is measured here:
 *
 *   - **The frame interval is the budget. The rest is the explanation.** How
 *     long a frame took is the only number a visitor can feel. Draw calls and
 *     triangles cannot be felt and cannot be budgeted in the abstract; they are
 *     here because when the interval goes over, they are what says *why* — a
 *     frame drawing three decks' worth of triangles has a culling defect, and
 *     one drawing four hundred objects has a batching defect, and those are
 *     different repairs.
 *   - **This is a CPU clock, not a GPU one.** `performance.now()` around the
 *     frame callback measures the work the main thread does and whatever the
 *     driver makes it block on; it does not measure a shader. A fragment-bound
 *     palier can miss its interval with a flat `cpuMs`, and that reading — slow
 *     frames, idle CPU — is itself the diagnosis. A real GPU timer needs
 *     `EXT_disjoint_timer_query_webgl2`, which most browsers withhold for
 *     fingerprinting reasons, so pretending to have one would be worse than
 *     saying which clock this is.
 *
 * Nothing here reads three.js or the DOM: the meter is handed plain numbers, so
 * the whole budget is checkable without a GPU the way `mesh.ts` and
 * `visibility.ts` are.
 */
import type { QualityTier } from './quality'

/** What `renderer.info` says at the end of one frame, as plain numbers. */
export interface FrameSnapshot {
  /** Draw calls issued: `info.render.calls`. */
  calls: number
  /** Triangles rasterised: `info.render.triangles`. */
  triangles: number
  /** Live geometries and textures: `info.memory`. Flat, or something leaks. */
  geometries: number
  textures: number
  /** Compiled programs. Each one is a shader compile the visitor waited for. */
  programs: number
}

/** The ceiling for one palier. Over any line is an alert, not a failure. */
export interface FrameBudget {
  /** The frame interval, in milliseconds. The only line a visitor can feel. */
  frameMs: number
  /** Triangles in one frame, past which culling is the suspect. */
  triangles: number
  /** Draw calls in one frame, past which batching is the suspect. */
  calls: number
}

/**
 * The ceilings, and where each number comes from.
 *
 * The triangle lines are the only ones derived rather than chosen, and they are
 * the ones worth trusting. `mesh.test.ts` bounds a whole extruded deck at
 * 120 000 triangles; `visibility.ts` names about fourteen rooms of fifty-three
 * at depth two, so a frame standing in one room has no business drawing a
 * deck's worth. On `low` that is the line outright. On `high` it is doubled,
 * because a portal pane renders a second deck from the far side of a stair and
 * that is the picture working, not failing.
 *
 * The intervals are the two frame rates that mean something: 16.7 ms is a 60 Hz
 * frame, and 22 ms is about 45 a second — the floor below which a first-person
 * walk stops reading as walking, and the honest target for a phone that is also
 * managing a thermal envelope rather than a fill rate.
 *
 * The call lines are the softest of the three and are marked as such: they are
 * "this is unusual" rather than "this is wrong". A room and its solids, its
 * apparitions, its motes, two portal panes and a corner inset is a few dozen
 * calls; two hundred means something is drawing per-object that used to draw
 * per-deck, which is worth a look even when the interval is fine.
 */
export const BUDGETS: Record<QualityTier, FrameBudget> = {
  low: { frameMs: 22, triangles: 120_000, calls: 200 },
  high: { frameMs: 16.7, triangles: 240_000, calls: 400 },
}

/** Which lines of the budget a reading is over. Empty is within. */
export type Overspend = 'frame' | 'triangles' | 'calls'

/** One window of frames, summarised. What the panel shows and the alert reads. */
export interface FrameReading {
  tier: QualityTier
  /** Frames a second over the window: frames divided by the wall time. */
  fps: number
  /** The median frame interval, in milliseconds. */
  frameMs: number
  /** The worst single interval in the window — where a stutter shows up. */
  worstMs: number
  /** The median time the frame callback itself held the main thread. */
  cpuMs: number
  /** The last frame's counters. Not an average: a count has no average. */
  snapshot: FrameSnapshot
  /** Which budget lines this window is over. */
  over: readonly Overspend[]
}

/** The middle value of a set of samples. Sorts a copy — the caller keeps its own. */
function median(samples: readonly number[]): number {
  if (!samples.length) return 0
  const sorted = [...samples].sort((a, b) => a - b)
  const middle = sorted.length >> 1
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

/**
 * Which lines this reading is over.
 *
 * The interval is judged on the *median* and not on the worst: one 40 ms frame
 * is a garbage collection or a deck being built, and alerting on it would mean
 * alerting on every room the visitor walks into. What the budget is about is a
 * walk that is habitually slow, and half the frames being over is that.
 */
export function overspends(reading: Omit<FrameReading, 'over'>): Overspend[] {
  const budget = BUDGETS[reading.tier]
  const over: Overspend[] = []
  if (reading.frameMs > budget.frameMs) over.push('frame')
  if (reading.snapshot.triangles > budget.triangles) over.push('triangles')
  if (reading.snapshot.calls > budget.calls) over.push('calls')
  return over
}

/** How long a window is, in milliseconds, before the meter reports. */
export const WINDOW_MS = 500

/**
 * The accumulator.
 *
 * A reading every half second rather than every frame, and that is not only
 * politeness towards whatever renders it: a number that changes sixty times a
 * second cannot be read by a person, and a store written sixty times a second
 * is a Svelte update per frame, which would make the instrument part of what it
 * is measuring.
 *
 * `begin` takes the timestamp the animation loop was handed — the real frame
 * clock, which is what an interval has to be measured on — and `end` takes a
 * reading of the wall clock after the callback, which is the CPU half.
 */
export class FrameMeter {
  private intervals: number[] = []
  private costs: number[] = []
  private previous: number | null = null
  private started = 0
  private startedFrame = 0

  constructor(
    private readonly tier: QualityTier,
    private readonly windowMs: number = WINDOW_MS,
  ) {}

  /** Open a frame, at the timestamp the animation loop gave. */
  begin(now: number): void {
    if (this.previous !== null) this.intervals.push(now - this.previous)
    this.previous = now
    if (!this.started) this.started = now
    this.startedFrame = now
  }

  /**
   * Close a frame, and report if the window is up.
   *
   * Returns `null` on every frame but the one that closes a window, so the
   * caller can push a reading without deciding when there is one.
   */
  end(now: number, snapshot: FrameSnapshot): FrameReading | null {
    this.costs.push(Math.max(0, now - this.startedFrame))
    const elapsed = (this.previous ?? 0) - this.started
    if (elapsed < this.windowMs || this.intervals.length < 2) return null
    const partial = {
      tier: this.tier,
      fps: (this.intervals.length / elapsed) * 1000,
      frameMs: median(this.intervals),
      worstMs: Math.max(...this.intervals),
      cpuMs: median(this.costs),
      snapshot,
    }
    this.intervals = []
    this.costs = []
    this.started = this.previous ?? 0
    return { ...partial, over: overspends(partial) }
  }

  /**
   * Forget the window without reporting.
   *
   * The walk stops its loop whenever the canvas scrolls off screen, and the gap
   * that leaves is not a slow frame — charging the budget for time the visitor
   * spent reading the index below the canvas would make every scroll look like
   * a stutter.
   */
  resume(): void {
    this.intervals = []
    this.costs = []
    this.previous = null
    this.started = 0
  }
}
