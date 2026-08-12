/**
 * The conversion the composer silently dropped, and the switch that puts it back.
 *
 * `WebGLRenderer` compiles its tone mapping and its output colour space into a
 * material only when the target is the default framebuffer — three.js decides
 * this in `WebGLPrograms.getParameters`, where `toneMapping` is forced to
 * `NoToneMapping` the moment `currentRenderTarget` is not null. `RenderPass`
 * renders into a target. So from the day the composer went in, three things
 * stopped happening on the walk and nothing said so:
 *
 * - `renderer.toneMappingExposure` became a dead property. The visitor's own
 *   aperture, the hour's share of the day, the 0.02 of a sealed room and the
 *   `1 + burning * 2.6` of a Hatsu flash are all writes nobody reads.
 * - ACES stopped rolling off the highlights, so a filament core clips flat
 *   instead of bending.
 * - Linear values are written to an sRGB drawing buffer, which is a picture
 *   about two stops darker and much harder than the bake intends — and the bake
 *   in `$lib/tour/light` converts its albedos out of sRGB on the explicit
 *   assumption that something converts them back at the end.
 *
 * `OutputPass` is the piece that does all three, and it exists in three.js for
 * exactly this reason.
 *
 * **It is off by default, and that is deliberate.** Every tuned constant in the
 * walk — the contrast about a 0.18 pivot, the halation threshold at 0.85, the
 * lamp powers in `DECK_LIGHT`, the `above white` the panes are written at — was
 * dialled in by eye against the uncorrected signal. Switching the conversion on
 * does not fix those numbers, it invalidates them, and a correction that lands
 * as "the walk is now washed out" is not an improvement anybody can act on.
 * This is the same trap the file comment in `$lib/tour/postGrade` describes
 * about grading albedos that were five times too light.
 *
 * So it ships as something to look at rather than something decided: append
 * `?tonemap=1` to the tour's url and the frame is colour-managed. Compare, then
 * re-tune, then make it the default and delete the flag. The url is where the
 * walk already keeps its addressable state — `deck` and `space` — so this needs
 * no store, no panel and no line inside `TourScene.svelte`.
 */
import type { Pass } from 'three/examples/jsm/postprocessing/Pass.js'

/** The query the flag is spelled with. One place, so the docs cannot drift. */
export const TONEMAP_FLAG = 'tonemap'

/**
 * Whether this visit asked for the conversion.
 *
 * Read from the location rather than handed in, for the reason the pixel ratio
 * and the window size are read inside `TourRenderer`: this is a browser fact,
 * the runtime is the browser-owned shell, and routing it through the scene
 * component would mean a new line in the body of a file already over the bound.
 *
 * Anything other than `1` is off, including `0`, `true` and a bare `?tonemap`.
 * A flag that is going to be deleted should be impossible to half-enable.
 */
export function wantsColourManagement(search: string): boolean {
  return new URLSearchParams(search).get(TONEMAP_FLAG) === '1'
}

/** The pass itself. Lazily imported, like every other pass in the walk. */
export async function createOutputPass(): Promise<Pass> {
  const { OutputPass } = await import('three/examples/jsm/postprocessing/OutputPass.js')
  return new OutputPass()
}
