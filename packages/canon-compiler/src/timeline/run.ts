import type { PrismaClient } from '@prisma/client'
import type { CanonEvent } from '@black-whale/contracts'
import { bracket, curatedChronology, formatVoyageTime, hasVoyageTime } from '@black-whale/domain'

/**
 * `data/events/events.json` projected onto the timeline.
 *
 * The curated event log is canon data, not script state: it lives in `data/`
 * beside characters.json so it can be read, reviewed and diffed without running
 * a backfill. What the database stores is the *result* of running the ordering
 * and the clock over it, so a query can sort by time and a page can render one
 * without recomputing anything.
 */

export interface CompileTimelineReport {
  created: number
  updated: number
  dated: number
  bracketed: number
}

export interface CompileTimeline {
  prisma: PrismaClient
  events: readonly CanonEvent[]
}

/** Write one declared event, matching on its title or any it used to carry. */
async function syncEvent(
  prisma: PrismaClient,
  definition: CanonEvent,
): Promise<'created' | 'updated'> {
  const chapter = await prisma.chapter.upsert({
    where: { number: definition.chapter },
    update: { title: definition.chapterTitle },
    create: { number: definition.chapter, title: definition.chapterTitle },
  })

  const titles = [definition.title, ...(definition.legacyTitles ?? [])]
  const existing = await prisma.narrativeEvent.findFirst({ where: { title: { in: titles } } })

  if (existing) {
    await prisma.narrativeEvent.update({
      where: { id: existing.id },
      data: {
        chapterId: chapter.id,
        sequence: definition.sequence,
        title: definition.title,
        summary: definition.summary ?? '',
        ...(definition.isFlashback === undefined ? {} : { isFlashback: definition.isFlashback }),
        ...(definition.occursOnBlackWhale === undefined
          ? {}
          : { occursOnBlackWhale: definition.occursOnBlackWhale }),
      },
    })
    return 'updated'
  }

  await prisma.narrativeEvent.create({
    data: {
      chapterId: chapter.id,
      sequence: definition.sequence,
      title: definition.title,
      summary: definition.summary ?? '',
      isFlashback: definition.isFlashback ?? false,
      occursOnBlackWhale: definition.occursOnBlackWhale ?? true,
    },
  })
  return 'created'
}

/**
 * Number the events in the order they happened, from the log rather than from
 * what the column already held.
 *
 * The ordinals used to be kept and only extended, which treated the column as
 * the curated record — but the record is `data/events/events.json`, and every
 * event added to it since landed at the end of the timeline whatever its
 * chapter. The chronological view ended on chapters 376, 380, 406 and 410, and
 * the clock, which brackets in this order, inherited the mistake.
 *
 * Ordinals are cleared first because the column is unique and any renumbering
 * passes through collisions.
 */
async function renumberChronology(
  prisma: PrismaClient,
  declared: ReadonlyMap<string, CanonEvent>,
): Promise<void> {
  const events = await prisma.narrativeEvent.findMany({
    select: {
      id: true,
      sequence: true,
      title: true,
      chapter: { select: { number: true } },
    },
  })

  const ordered = curatedChronology(
    events.map((event) => ({
      id: event.id,
      chapter: event.chapter.number,
      sequence: event.sequence,
      title: event.title,
      occursAfterTitle: declared.get(event.title)?.occursAfterTitle,
    })),
  )

  await prisma.$transaction([
    prisma.narrativeEvent.updateMany({ data: { ordinal: null } }),
    ...ordered.map((event, ordinal) =>
      prisma.narrativeEvent.update({ where: { id: event.id }, data: { ordinal } }),
    ),
  ])
}

/**
 * Put every event on the voyage clock, in the order the ordinals just settled.
 *
 * The hours themselves are canon data and live in the log; the label goes the
 * same way. It used to be typed by hand next to the event, which let it
 * disagree with the number the engines sort by — so it is rendered here.
 */
async function stampVoyageClock(
  prisma: PrismaClient,
  declared: ReadonlyMap<string, CanonEvent>,
): Promise<{ dated: number; bracketed: number }> {
  const events = await prisma.narrativeEvent.findMany({
    orderBy: [{ ordinal: 'asc' }, { chapter: { number: 'asc' } }, { sequence: 'asc' }],
    select: {
      id: true,
      title: true,
      isFlashback: true,
      chapter: { select: { number: true } },
    },
  })

  const times = bracket(
    events.map((event) => ({
      onVoyage: hasVoyageTime({ chapter: event.chapter.number, isFlashback: event.isFlashback }),
      occurredAt: declared.get(event.title)?.occurredAt,
    })),
  )

  await prisma.$transaction(
    events.map((event, index) => {
      const time = times[index]
      return prisma.narrativeEvent.update({
        where: { id: event.id },
        data: {
          occurredAtBasis: time?.basis ?? null,
          occurredAtHours: time?.hours ?? null,
          occurredAtEarliest: time?.earliest ?? null,
          occurredAtLatest: time?.latest ?? null,
          occurredAtSource: time?.source ?? null,
          // Off the clock, the log's own label is all there is — chapter 415
          // dates its flashback two months before a departure that has no hour.
          occurredAtLabel: time
            ? formatVoyageTime(time)
            : (declared.get(event.title)?.occurredAtLabel ?? null),
        },
      })
    }),
  )

  return {
    dated: times.filter((time) => time && time.basis !== 'bracketed').length,
    bracketed: times.filter((time) => time?.basis === 'bracketed').length,
  }
}

/**
 * Whether an event happens aboard, recomputed from the arc rather than stored.
 *
 * Everything before 359 is the mainland, 396 and 397 are the Troupe's flashback
 * ashore, and the twins' escape and its aftermath happen off the ship even
 * though the chapters around them do not. A flashback keeps whatever the log
 * declares: where it happens is not decided by which chapter reveals it.
 */
async function markWhatHappensAboard(prisma: PrismaClient): Promise<void> {
  await prisma.$executeRawUnsafe(`
		UPDATE "NarrativeEvent" event
		SET "occursOnBlackWhale" = CASE
			WHEN event."isFlashback" = TRUE THEN event."occursOnBlackWhale"
			WHEN event."title" IN (
				'Kacho and Fugetsu attempt to escape',
				'Kacho dies and Without You awakens'
			) THEN FALSE
			WHEN event."title" = 'Without You rejoins Fugetsu aboard the Black Whale' THEN TRUE
			ELSE NOT (
				SELECT chapter."number" < 359 OR chapter."number" IN (396, 397)
				FROM "Chapter" chapter
				WHERE chapter."id" = event."chapterId"
			)
		END
	`)
}

export async function compileTimeline({
  prisma,
  events,
}: CompileTimeline): Promise<CompileTimelineReport> {
  let created = 0
  let updated = 0
  for (const definition of events) {
    const result = await syncEvent(prisma, definition)
    if (result === 'created') created += 1
    else updated += 1
  }

  const declared = new Map(events.map((definition) => [definition.title, definition]))
  await renumberChronology(prisma, declared)
  await markWhatHappensAboard(prisma)
  const clock = await stampVoyageClock(prisma, declared)

  return { created, updated, ...clock }
}
