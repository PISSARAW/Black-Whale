import { readFileSync } from 'fs'
import { dirname, join, parse } from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import { bracket, curatedChronology, formatVoyageTime, hasVoyageTime } from '@black-whale/domain'

const prisma = new PrismaClient()

// The curated event log is canon data, not script state: it lives in data/ beside
// characters.json and blueprint.json so it can be read, reviewed and diffed
// without running a backfill. Walk up for the repo root rather than hardcoding a
// depth — this file is invoked from the workspace root and from packages/database.
function findDataRoot() {
  let current = dirname(fileURLToPath(import.meta.url))
  const { root } = parse(current)

  while (true) {
    const candidate = join(current, 'data')
    try {
      readFileSync(join(candidate, 'events/events.json'))
      return candidate
    } catch {}
    if (current === root) break
    current = dirname(current)
  }

  throw new Error('Unable to locate data/events/events.json')
}

const knownEvents = JSON.parse(readFileSync(join(findDataRoot(), 'events/events.json'), 'utf-8'))

async function syncEvent(definition) {
  const chapter = await prisma.chapter.upsert({
    where: { number: definition.chapter },
    update: { title: definition.chapterTitle },
    create: { number: definition.chapter, title: definition.chapterTitle },
  })

  const matchingTitles = [definition.title, ...definition.legacyTitles]
  const existing = await prisma.narrativeEvent.findFirst({
    where: { title: { in: matchingTitles } },
  })

  if (existing) {
    await prisma.narrativeEvent.update({
      where: { id: existing.id },
      data: {
        chapterId: chapter.id,
        sequence: definition.sequence,
        title: definition.title,
        summary: definition.summary,
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
      summary: definition.summary,
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
 * The ordinals used to be kept and only extended: a run assigned one to every
 * event that lacked it, appended after the highest in use, then moved the
 * `occursAfterTitle` ones beside their anchor. That treated the column as the
 * curated record — but the record is `data/events/events.json`, and every event
 * added to it since landed at the end of the timeline whatever its chapter. The
 * chronological view ended on chapters 376, 380, 406 and 410, and the clock,
 * which brackets in this order, inherited the mistake.
 *
 * So the order is recomputed whole, by the same `curatedChronology` the data
 * tests use. Seeded events carry no `occursAfterTitle` and fall in by chapter
 * and sequence, as they did before. Ordinals are cleared first because the
 * column is unique and any renumbering passes through collisions.
 */
async function renumberChronology() {
  const declared = new Map(knownEvents.map((definition) => [definition.title, definition]))
  const events = await prisma.narrativeEvent.findMany({
    include: { chapter: { select: { number: true } } },
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
 * The hours themselves are canon data and live in the log; what the database
 * stores is the result of running the cascade over them, so that a query can
 * order by time and a page can render one without recomputing anything. The
 * label goes the same way: it used to be typed by hand next to the event, which
 * let it disagree with the number the engines sort by. It is rendered here now.
 */
async function stampVoyageClock() {
  const declared = new Map(knownEvents.map((definition) => [definition.title, definition]))
  const events = await prisma.narrativeEvent.findMany({
    orderBy: [{ ordinal: 'asc' }, { chapter: { number: 'asc' } }, { sequence: 'asc' }],
    include: { chapter: { select: { number: true } } },
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

  const dated = times.filter((time) => time && time.basis !== 'bracketed').length
  return { dated, bracketed: times.filter((time) => time?.basis === 'bracketed').length }
}

async function main() {
  const results = { created: 0, updated: 0 }
  for (const definition of knownEvents) {
    const result = await syncEvent(definition)
    results[result] += 1
  }

  await renumberChronology()

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
  const clock = await stampVoyageClock()

  console.log(
    `Timeline synchronisée : ${results.created} créations, ${results.updated} mises à jour.`,
  )
  console.log(
    `Horloge du voyage : ${clock.dated} événements datés, ${clock.bracketed} encadrés entre deux ancres.`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
