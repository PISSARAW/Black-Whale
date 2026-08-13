import { atElevation, type Band } from './byElevation'

/**
 * The water outside the hull: where it is, and how much of it reaches a deck.
 *
 * `./atmosphere` says there is no sky on the Black Whale — two windows out of
 * 387 spaces, and what stands in for the weather is the ship itself. That is
 * still true of the *light*. It was never quite true of the sound, and the
 * reason is a fact the blueprint states rather than a liberty taken here: the
 * ship floats, most of it is above the water and one whole tier of it is not,
 * so the sea is a thing with a *position* relative to the visitor and not an
 * ambience laid over everything equally.
 *
 * The manga puts Tier 5 at the very bottom of the hull, beside the propeller,
 * and says its twelve decks are all below the waterline (ch. 349's cross-section
 * is the same drawing `data/ship/blueprint.json` is traced from). Tier 4 is the
 * first tier the canon does not place under water. So the waterline is the
 * elevation of Tier 4, which the blueprint already gives — nothing here is
 * invented, and if the deck plan is ever re-measured this follows it.
 *
 * The consequence is the whole feature. Two hundred thousand people on Tier 5
 * have the sea over their heads; the King, a hundred and twenty-eight metres up,
 * has it ninety-six metres under his floor. Take the lift down and the water
 * crosses you. That is not a mix trick — it is what the ship is.
 */

/**
 * Metres above the blueprint's zero at which the water stands.
 *
 * The zero is the bottom of Tier 5, so this is the height of Tier 4's deck.
 */
export const WATERLINE = 31.5

/**
 * How loud the sea is, and how much of it gets through, deck by deck.
 *
 * The shape is not the hull's. `HULL_DECKS` falls away monotonically from the
 * engine room because the engine room is one place and everything above it is
 * further from it; the sea is a *surface*, the loudest place is on it, and both
 * directions away are quieter. The peak is therefore at `WATERLINE` and not at
 * either end of the ship.
 *
 * The cutoff runs the other way from the level, which is the part worth reading
 * twice. Below the waterline the path is water and then steel, and both are
 * merciless to the top end: it arrives as a pressure, felt more than heard, with
 * the propeller's wash in it and nothing above a couple of hundred hertz. Above
 * it the path is air, and air carries the hiss the bow throws off — so the sea
 * gets *further away and brighter at once* as the visitor climbs. Standing in
 * the hold it is a weight overhead; standing in the King's living room it is a
 * thin, remote sibilance a long way down.
 *
 * The top of that range is not decoration. A listener places a sound above or
 * below themselves almost entirely from what the outer ear does to it between
 * about two and eight kilohertz; below five hundred hertz there is no elevation
 * cue at all and barely a left-right one. So a sea filtered at nine hundred
 * hertz is *felt* to be there and cannot be pointed at, and one filtered at four
 * and a half thousand can. That is the honest version of the same physics the
 * levels describe, and it is why the binaural placing of the water is plain on
 * the upper decks and deliberately vague under them.
 *
 * Like `HULL_DECKS` these five pairs are a mix decision written out rather than
 * computed. Nothing in `data/ship/blueprint.json` measures a decibel, and a
 * formula here would dress a choice up as a measurement. What they do follow is
 * the one figure the blueprint gives — the elevation of the deck — so a level
 * between two decks is interpolated rather than guessed.
 *
 * Level is a fraction of `SEA_GAIN` in `$lib/audio/steps/environment`, where it
 * is mixed against the hull; the cutoff is in hertz.
 */
export const SEA_DECKS: readonly Band[] = [
  { elevation: 0, level: 0.5, cutoff: 180 },
  { elevation: WATERLINE, level: 1, cutoff: 700 },
  { elevation: 63, level: 0.62, cutoff: 2400 },
  { elevation: 96, level: 0.4, cutoff: 3600 },
  { elevation: 128, level: 0.26, cutoff: 4500 },
]

/**
 * The sea at an elevation, interpolated between the decks around it.
 *
 * Flat outside the range at both ends, for the same reason `hullRumble` is:
 * there is no deck under Tier 5 and none over Tier 1, so a position that lands
 * outside the hull hears the nearest deck rather than an extrapolation.
 */
export function seaOutside(elevation: number): { level: number; cutoff: number } {
  return atElevation(SEA_DECKS, elevation)
}

/**
 * How far the water is above the visitor, in metres. Negative when it is below.
 *
 * This is the sign that does the work: on Tier 5 it is +31,5 and the sea is over
 * the visitor's head, on Tier 1 it is −96,5 and the sea is under their feet.
 * `$lib/audio/steps/environment` reads only the sign and hands the panner a
 * direction; the distance is dosed by `seaOutside` instead, because a source
 * placed ninety-six metres off would be attenuated twice — once by the curve
 * above, which is the mix decision, and once by the panner's distance model,
 * which is not.
 */
export function seaOffset(elevation: number): number {
  return WATERLINE - elevation
}

/**
 * Whether the visitor is under the water at this elevation.
 *
 * True for the whole of Tier 5 and false everywhere else, which is exactly what
 * the canon says. Exposed because it reads better at a call site than the sign
 * of `seaOffset`, and because it is the thing worth asserting in a test.
 */
export function submerged(elevation: number): boolean {
  return elevation < WATERLINE
}
