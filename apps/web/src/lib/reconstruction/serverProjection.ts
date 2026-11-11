import type { Prisma } from '@black-whale/database'

export function presenceSpoilerWhere(maxChapter: number | undefined): Prisma.PresenceWhereInput {
  return {
    entityType: 'BODY',
    ...(maxChapter === undefined
      ? {}
      : { fromEvent: { chapter: { number: { lte: maxChapter } } } }),
  }
}

export function locationSpoilerWhere(maxChapter: number | undefined): Prisma.LocationWhereInput {
  return maxChapter === undefined
    ? {}
    : { firstVisibleEvent: { chapter: { number: { lte: maxChapter } } } }
}

export function worldEventSpoilerWhere(
  maxChapter: number | undefined,
): Prisma.WorldEventRecordWhereInput {
  return {
    branchId: 'canon',
    ...(maxChapter === undefined
      ? {}
      : {
          chapterNumber: { lte: maxChapter },
          OR: [{ revealedAtChapter: null }, { revealedAtChapter: { lte: maxChapter } }],
        }),
  }
}

export function capPresenceEnds<T extends { untilEvent: { chapter: { number: number } } | null }>(
  rows: readonly T[],
  maxChapter: number | undefined,
): T[] {
  if (maxChapter === undefined) return [...rows]
  return rows.map((row) =>
    row.untilEvent && row.untilEvent.chapter.number > maxChapter
      ? { ...row, untilEvent: null }
      : row,
  )
}
