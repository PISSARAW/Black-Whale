export const VOYAGE_DURATION_DAYS = 56
export const TERRITORIAL_WATERS_DAYS = 21
export const LATEST_RECORDED_DAY = 12

export type VoyageTime = {
  day: number
  time?: string
  precision: 'exact' | 'day' | 'approximate'
}

/**
 * Narrative days are not aligned one-to-one with chapters: some chapters
 * revisit earlier scenes or cross midnight. This lookup is deliberately
 * conservative and should eventually be replaced by event-level timestamps.
 */
export function voyageTimeForEvent(chapter: number, title: string): VoyageTime | undefined {
  if (chapter < 358) return undefined
  if (chapter === 358) return { day: 0, precision: 'day' }

  if (title === 'Ship Departs') return { day: 1, time: '12:00', precision: 'exact' }
  if (chapter >= 359 && chapter <= 368) return { day: 1, precision: 'day' }
  if (chapter >= 369 && chapter <= 375) return { day: 2, precision: 'day' }
  if (chapter >= 376 && chapter <= 378) return { day: 3, precision: 'approximate' }
  if (chapter === 379) return { day: 4, precision: 'day' }
  if (chapter === 380) return { day: 5, precision: 'day' }
  if (chapter === 381) return { day: 5, time: '20:00', precision: 'exact' }
  if (chapter === 382) return { day: 6, precision: 'day' }
  if (chapter === 384) return { day: 7, precision: 'day' }
  if (chapter === 383 || (chapter >= 385 && chapter <= 389))
    return { day: 8, precision: 'approximate' }
  if (chapter >= 390 && chapter <= 392) return { day: 10, precision: 'day' }
  if (chapter >= 393 && chapter <= 395) return { day: 11, precision: 'approximate' }
  if (chapter >= 398) return { day: 12, precision: 'day' }

  return undefined
}

export function formatVoyageTime(time: VoyageTime): string {
  const prefix = time.precision === 'approximate' ? '≈ ' : ''
  return `${prefix}Day ${time.day}${time.time ? ` · ${time.time}` : ''}`
}
