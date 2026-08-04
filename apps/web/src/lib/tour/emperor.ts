/**
 * Emperor Time in the walk: what the scarlet eyes show, and what they cost.
 *
 * The walk carried the technique already, and carried it for free: `scarlet`
 * set `laidOpen`, every room on every deck came open at once, and nothing was
 * ever paid for it. That is the one thing about Emperor Time nobody who has
 * read the arc would accept — the ability *is* its price. So the walk now keeps
 * a ledger beside the hold, and spends an hour of life for every second the
 * eyes stay red, which is the rate the canon states and not a figure of ours.
 *
 * The other half is what full efficiency buys in a reconstruction. There is no
 * damage here to multiply and no category to be a hundred per cent of, so the
 * transposition is the one `/tour` makes everywhere: what the technique does to
 * *knowledge* is what survives. In the walk, everything that is deliberately
 * unseen is unseen behind In — the gum strung at shin height, the mark Beyond
 * put on the sacrifice among the victim's own — and Gyo is what finds it. At a
 * hundred per cent in every category, so is Emperor Time, without being aimed
 * and without being held on the eyes: it all lights at once.
 *
 * A leaf module, like `bodyKinds.ts`, and for the same reason: `hatsu.ts` reads
 * it and it reads nothing back but a type, so neither can drag the other into a
 * cycle. Nothing here touches a clock, a store or the DOM — the second is
 * counted by the page, which is the only thing aboard that has one.
 */
import type { TourWorld } from './hatsu'

/**
 * What one second of it takes, in hours of life.
 *
 * The canon's own exchange rate, and the reason it is a named constant rather
 * than a literal `+ 1`: the walk spends it, `/tour/morena` spends it in blocks
 * at a table's pace, and both are the same year.
 */
export const HOURS_PER_SECOND = 1

/** Whose eyes are red, and how much of a life it has burnt so far. */
export interface ScarletEyes {
  /**
   * The character carrying it, or `null` for the visitor's own activation.
   *
   * The distinction is not bookkeeping. A body in the ship that goes scarlet
   * under the emotion of the moment is spending *its* years, and charging them
   * to the reader would be the walk making somebody else's cost the visitor's.
   */
  by: string | null
  /** Hours spent since the eyes turned, one per second, never given back. */
  hours: number
}

/** The moment the eyes turn: nothing spent yet, and whose they are. */
export const eyesTurn = (by: string | null = null): ScarletEyes => ({ by, hours: 0 })

/** Whether it is the reader who is paying for this. */
export const isTheVisitors = (eyes: ScarletEyes | null): boolean =>
  eyes !== null && eyes.by === null

/** One more second held, and the hour it took. */
export const oneSecondOn = (eyes: ScarletEyes): ScarletEyes => ({
  ...eyes,
  hours: eyes.hours + HOURS_PER_SECOND,
})

/**
 * A year of life, in hours. The figure ch. 380 puts on what was burnt.
 *
 * Eight thousand seven hundred and sixty seconds of holding, at the rate above
 * — two and a half hours of walking, and nobody will do it. That is not a
 * problem to be solved by making the walk's second worth more than an hour: it
 * is the size of the thing, and a reader who watches the counter climb for
 * thirty seconds and reads how far off the year still is has been told the
 * truth about the price. Shortening it would be inventing a rate for the one
 * ability whose rate the arc states outright.
 */
export const HOURS_IN_A_YEAR = 8760

/**
 * How long the Nen stays gone once the year is spent, in seconds of the walk.
 *
 * The other half of ch. 380's own pairing, and the reason the two constants sit
 * together: the arc states a year consumed *and* five minutes without Nen, as
 * one sentence. The walk carries the sentence rather than either half of it, so
 * there is no reading of this file in which the price is paid and the Zetsu
 * does not follow.
 */
export const ZETSU_SECONDS = 300

/** Whether the ledger has reached the year, which is when the eyes go out. */
export const isSpent = (eyes: ScarletEyes): boolean => eyes.hours >= HOURS_IN_A_YEAR

/** Hours still to go before the year is gone — what the banner counts down. */
export const untilSpent = (eyes: ScarletEyes): number =>
  Math.max(0, HOURS_IN_A_YEAR - eyes.hours)

/**
 * Everything in the walk that is deliberately not shown, by apparition id.
 *
 * Two things, and both of them are In: the Bungee Gum strung across a doorway
 * at the height of a trip-line, and the mark on the one thing Beyond chose to
 * lose among the things it was aiming at. Neither is a thing the reconstruction
 * refuses to draw — the scene has both meshes ready — they are things the
 * reconstruction refuses to draw *to an eye that has nothing out*, which is
 * exactly what In means and exactly what Gyo and Emperor Time answer.
 *
 * Returned as a list rather than a count because the count is what the report
 * says and the list is what a test can hold on to.
 */
export function hiddenByIn(world: TourWorld): string[] {
  return [
    ...world.gumTraps.map((spaceId) => `gum:${spaceId}`),
    ...(world.curse && world.curse.sacrifice !== world.curse.victim
      ? [`mark:${world.curse.sacrifice}`]
      : []),
  ]
}

/**
 * Whether the eye looking at the walk right now can see what In is hiding.
 *
 * One rule for the two ways of getting there, which is the point of writing it
 * down: Gyo is aura put on the eyes and Emperor Time is aura at full in every
 * category at once, and a technique that had to be pointed at the trip-line to
 * find it would not be a hundred per cent of anything.
 */
export const seesTheHidden = (gyo: boolean, world: TourWorld): boolean => gyo || world.laidOpen
