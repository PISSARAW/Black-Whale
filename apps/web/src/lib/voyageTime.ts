/** Eight weeks announced by the Zodiacs for the crossing. */
export const VOYAGE_DURATION_DAYS = 56
/** Three of those weeks are sailed inside Kakin territorial waters, then the ship refuels. */
export const TERRITORIAL_WATERS_DAYS = 21
/** Latest voyage day the manga has actually depicted (chapters 398-407). */
export const LATEST_RECORDED_DAY = 12

/** Day 1 is a Sunday: the Black Whale leaves Kakin on August 8th, at noon. */
export const DEPARTURE_DATE = 'August 8th'
export const DEPARTURE_TIME = '12:00'

/** Last chapter whose in-world day can be anchored to canon. Beyond it, we do not date. */
export const LAST_DATED_CHAPTER = 407

export type VoyageTime = {
  day: number
  time?: string
  precision: 'exact' | 'day' | 'approximate'
}

/**
 * Narrative days are not aligned one-to-one with chapters: some chapters
 * revisit earlier scenes or cross midnight. This lookup is deliberately
 * conservative and should eventually be replaced by event-level timestamps.
 *
 * Two hard anchors calibrate the whole scale:
 *  - departure, Sunday August 8th at 12:00 (day 1);
 *  - chapter 381, stated to be 104 hours after departure, i.e. Thursday 20:00 (day 5).
 * The first weekly banquet then falls on Sunday August 15th at 20:00 (day 8),
 * the night Kacho dies during the escape attempt.
 */
export function voyageTimeForEvent(chapter: number, title: string): VoyageTime | undefined {
  if (chapter < 358) return undefined
  if (chapter === 358) return { day: 0, precision: 'day' } // August 7th, eve of departure

  if (title === 'Ship Departs') return { day: 1, time: DEPARTURE_TIME, precision: 'exact' }
  if (chapter >= 359 && chapter <= 368) return { day: 1, precision: 'day' }
  if (chapter >= 369 && chapter <= 373) return { day: 2, precision: 'day' }
  if (chapter >= 374 && chapter <= 378) return { day: 3, precision: 'approximate' }
  if (chapter >= 379 && chapter <= 380) return { day: 4, precision: 'approximate' }
  if (chapter === 381) return { day: 5, time: '20:00', precision: 'exact' } // 104 h after departure
  if (chapter === 382) return { day: 6, precision: 'day' }
  if (chapter === 383) return { day: 7, precision: 'approximate' }
  if (chapter >= 384 && chapter <= 385) return { day: 8, time: '20:00', precision: 'exact' } // banquet
  if (chapter >= 386 && chapter <= 389) return { day: 8, precision: 'approximate' }
  if (chapter >= 390 && chapter <= 392) return { day: 9, precision: 'approximate' }
  if (chapter === 393) return { day: 10, precision: 'approximate' }
  if (chapter >= 394 && chapter <= 397) return { day: 11, precision: 'approximate' }
  if (chapter >= 398 && chapter <= LAST_DATED_CHAPTER) return { day: 12, precision: 'approximate' }

  // Chapters 408 and later have no published day anchor yet: leaving them
  // undated is correct, inventing a day is not.
  return undefined
}

export function formatVoyageTime(time: VoyageTime): string {
  const prefix = time.precision === 'approximate' ? '≈ ' : ''
  return `${prefix}Day ${time.day}${time.time ? ` · ${time.time}` : ''}`
}
