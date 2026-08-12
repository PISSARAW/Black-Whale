/**
 * Who is measuring, and where the reading goes.
 *
 * Split from `frameBudget.ts` on the same line `quality.ts` is split from
 * `TourRenderer.ts`: what a frame is allowed to cost is a policy, and it is
 * kept free of the DOM so it can be checked without one. This file is the other
 * half — the URL, the build mode, and the one store the panel reads — and it is
 * deliberately the only place in the instrument that knows a browser exists.
 *
 * **Off unless asked for.** In a production build the meter does not run: no
 * timestamps, no `info.reset()`, `autoReset` untouched, no store writes. It is
 * switched on by `?frames` in the query string, and that is the point rather
 * than a convenience — the machine the budget was written for is a phone on the
 * `low` palier, a phone runs the production build, and an instrument that only
 * exists in `pnpm dev` on a workstation with a discrete card would measure the
 * one machine that was never in doubt.
 */
import { writable } from 'svelte/store'
import { FrameMeter, type FrameReading } from './frameBudget'
import type { QualityTier } from './quality'

/** The query string that turns the meter on in any build. */
export const FRAME_QUERY = 'frames'

/**
 * The latest window, or `null` while nothing is measuring.
 *
 * A store rather than a prop because the two ends are far apart — the reading
 * is taken inside the animation loop in `TourRenderer`, and it is shown by a
 * panel over the canvas — and threading a number that changes twice a second
 * through `TourScene`, `TourPageStage` and their props would put the instrument
 * into the contract of three components that have nothing to do with it.
 */
export const frameReading = writable<FrameReading | null>(null)

/**
 * The palier in force, published by the renderer when it settles one.
 *
 * Module state, and it is the honest shape for it: there is one WebGL renderer
 * on the page, so there is one palier, and the alternative — carrying the tier
 * into `animateVisibleScene`, which is handed a renderer and a callback and has
 * no business knowing what a quality profile is — would put the instrument in
 * the signature of a function that does not use it.
 */
let published: QualityTier = 'high'

/** Say which palier this machine settled on. Called once, by the runtime. */
export function reportQualityTier(tier: QualityTier): void {
  published = tier
}

/** Whether this page was asked to measure. False on the server, and in SSR. */
export function wantsFrameBudget(): boolean {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).has(FRAME_QUERY)
}

/**
 * A meter for this page, or `null` if nobody asked.
 *
 * Returning `null` rather than a meter that does nothing keeps the cost at the
 * call site honest: the caller branches once, at setup, and a production frame
 * never reaches a timestamp at all.
 */
export function startFrameMeter(): FrameMeter | null {
  if (!wantsFrameBudget()) return null
  return new FrameMeter(published)
}
