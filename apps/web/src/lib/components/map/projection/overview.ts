import { DEFAULT_LOCALE, type Locale } from '$lib/i18n/config'
import { messagesFor } from '$lib/i18n'

/**
 * Where each deck sits in the overview, as a percentage of its height; the
 * label is built from the catalogue.
 *
 * The overview is the ship in longitudinal section now, so these are the mid
 * height of each deck in that drawing rather than five numbers eyeballed
 * against five hand-drawn slabs — a marker on tier 4 lands between tier 4's
 * floor and its ceiling. `scripts/generate-section-map.py` prints them when it
 * runs; `sectionMap.test.ts` fails if they drift from what it draws.
 */
export const tierOverviewY: Record<string, number> = {
  'tier-1': 32.3,
  'tier-1-b': 28.8,
  'tier-1-c': 27.4,
  'tier-2': 45.1,
  'tier-3': 58.2,
  'tier-3-b': 54.9,
  'tier-3-c': 53.5,
  'tier-4': 71.1,
  'tier-4-b': 68.0,
  'tier-5': 83.8,
  'tier-5-b': 78.7,
}

/**
 * How tall each deck is drawn in the overview, as a percentage of its height.
 *
 * A deck used to be a hand-drawn slab a seventh of the picture tall, and a
 * crowd on it could fan out freely. In section a deck is its own five metres
 * and no more, so a fan-out that ignores this puts tier 1's hundred passengers
 * across tiers 2 and 3 as well — people standing in a deck they are not on,
 * which is the one thing this map exists to answer.
 */
/**
 * How far each deck reaches fore and aft in the overview, as percentages of the
 * width.
 *
 * The whale tapers, so no two decks are the same length: tier 5 stops at 69 %
 * where tier 3 runs to 79 %, and the liner's guest deck does not begin until
 * 28 %. A crowd fanned out across one fixed band therefore hung people off both
 * ends of the ship — Tajao, in the Cha-R office on tier 5, was drawn swimming
 * astern of it.
 *
 * `scripts/generate-section-map.py` prints these when it runs, and
 * `sectionMap.test.ts` fails if they drift from the hull it draws.
 */
export const tierOverviewSpan: Record<string, [number, number]> = {
  'tier-1': [12.8, 72.9],
  'tier-1-b': [28.8, 72.9],
  'tier-1-c': [28.8, 63.5],
  'tier-2': [8.6, 77.1],
  'tier-3': [4.4, 81.2],
  'tier-3-b': [4.4, 81.2],
  'tier-3-c': [4.4, 81.2],
  'tier-4': [5, 80.5],
  'tier-4-b': [5, 80.5],
  'tier-5': [7.7, 70.7],
  'tier-5-b': [7.7, 70.7],
}

export const tierOverviewBand: Record<string, number> = {
  'tier-1': 2,
  'tier-1-b': 1.2,
  'tier-1-c': 1.2,
  'tier-2': 2,
  'tier-3': 2.4,
  'tier-3-b': 1.2,
  'tier-3-c': 1.2,
  'tier-4': 1.8,
  'tier-4-b': 1.2,
  'tier-5': 1.8,
  'tier-5-b': 1.8,
}

/**
 * A deck of the tier 1 liner is still tier 1 to a reader: `tier-1-c` labels as
 * Tier 1, not as Tier 1-c. The split is geometry, and the badge on a marker
 * answers which tier someone is on.
 */
export function tierLabelFor(tierId: string, locale: Locale = DEFAULT_LOCALE): string {
  const number = tierId.match(/^tier-([1-5])/)?.[1] ?? tierId.replace('tier-', '')
  return messagesFor(locale).ship.tierLabel(number)
}
