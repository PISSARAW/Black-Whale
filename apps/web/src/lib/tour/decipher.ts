/**
 * Combo Master's arithmetic: what standing next to something buys, and what
 * walking away from it costs.
 *
 * Furykov's console is the one ability in the catalogue whose canonical
 * manifestation is an interface, and the one whose whole substance is a number
 * going down. So the numbers go here, in a leaf with no ship and no three.js in
 * it, and the walk decides nothing about deciphering beyond which of these
 * answers it applies.
 *
 * **Three durations, and no fourth.** The manga gives ten days for a prince's
 * Guardian Spirit Beast, three hundred and sixty-five to decode Beyond's
 * sacrificial curse and seven hundred to counter it. They are carried as the
 * three numbers they are — read off the ability module, not restated here — and
 * nothing is interpolated between them. A rate fitted through three points
 * would be a claim about how fast this console works, and the archive never
 * makes one; a progress bar that moved smoothly would be that claim drawn.
 *
 * **The asymmetry is the ability.** Deciphering banks co-presence and survives
 * interruption: leave the room, come back a deck later, and the counter is
 * where you left it. Fabrication takes about as long and is destroyed by the
 * same walk out of the door. That is the one thing ch. 413-415 states about the
 * two halves of the menu, and it is the only reason they are two records here
 * rather than one with a flag.
 *
 * **Story time, never the reader's clock.** A day is a day of the walk, counted
 * by the tick the page already keeps. Nothing here reads a wall clock, and a
 * decipher that advanced while the tab sat open would be measuring the reader
 * rather than the reconstruction.
 */
import { COMBO_MASTER_DAYS } from '@black-whale/ability-modules'

/** The three readings the archive puts a duration on, and no others. */
export type DecipherReading = keyof typeof COMBO_MASTER_DAYS

/** How many days of co-presence this reading takes. Attested, all three. */
export const daysNeeded = (reading: DecipherReading): number => COMBO_MASTER_DAYS[reading]

/** What the console is reading, and how far in it has got. */
export interface Decipher {
  /** Whose ability is being read. */
  characterId: string
  reading: DecipherReading
  /**
   * Story-days banked. Never falls: that is what "survives interruption" means,
   * and it is the half of the menu that walking away does not punish.
   */
  days: number
}

/** What the console is building, and where it was started. */
export interface Fabrication {
  slot: 'WEAPON' | 'ARMOR' | 'TOOL'
  days: number
  /**
   * The room it was started in.
   *
   * Kept because leaving is the whole rule: the record has to know which room
   * counts as staying, and a fabrication that only knew its own progress could
   * not tell a walk to the door from a walk across the deck.
   */
  spaceId: string
  /** How long this build takes: about as long as the reading it answers. */
  needs: number
}

/** Whether the reading is finished. */
export const isDeciphered = (work: Decipher): boolean => work.days >= daysNeeded(work.reading)

/** Days still to go, floored at nought — the figure the screen shows. */
export const daysLeft = (work: Decipher): number =>
  Math.max(0, daysNeeded(work.reading) - work.days)

/**
 * One day of the walk, with the console on somebody.
 *
 * Advances only while the visitor is in the room with them, and never past what
 * the reading needs. Away from them nothing is lost — the counter simply does
 * not move, which is the difference between this half of the menu and the other.
 */
export function oneDayBeside(work: Decipher, together: boolean): Decipher {
  if (!together || isDeciphered(work)) return work
  return { ...work, days: work.days + 1 }
}

/**
 * One day of the walk, with something on the bench.
 *
 * In the room it was started in, it advances. Anywhere else it is *gone* —
 * `null` rather than nought, because a build reset to zero and a build never
 * begun are the same thing and the walk should not keep a record of the
 * difference. Sortir coûte tout, and this is the line that says so.
 */
export function oneDayBuilding(work: Fabrication, spaceId: string | null): Fabrication | null {
  if (spaceId !== work.spaceId) return null
  if (work.days >= work.needs) return work
  return { ...work, days: work.days + 1 }
}

/** Whether the thing on the bench is finished. */
export const isBuilt = (work: Fabrication): boolean => work.days >= work.needs

/**
 * Whether the console has Furykov's whole aura, which is the lock.
 *
 * While either half is running he casts nothing else — the walk greys the wheel
 * off this one answer, and the panel quotes the condition. A permanent refusal
 * for as long as the work runs is not a gap in the walk: it is the last arc's
 * own picture of the man, three hundred and sixty-five days into a curse.
 */
export const isLocked = (work: { decipher: Decipher | null; fabrication: Fabrication | null }) =>
  Boolean((work.decipher && !isDeciphered(work.decipher)) || work.fabrication)
