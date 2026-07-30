import { readFileSync } from 'fs'
import { dirname, join, parse } from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'

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
        ...(definition.occurredAtLabel === undefined
          ? {}
          : { occurredAtLabel: definition.occurredAtLabel }),
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
      occurredAtLabel: definition.occurredAtLabel ?? null,
      occursOnBlackWhale: definition.occursOnBlackWhale ?? true,
    },
  })
  return 'created'
}

async function main() {
  const results = { created: 0, updated: 0 }
  for (const definition of knownEvents) {
    const result = await syncEvent(definition)
    results[result] += 1
  }

  // Preserve curated occurrence order (including flashbacks). Only events that
  // do not have a chronological position yet are appended in publication order.
  await prisma.$executeRawUnsafe(`
		WITH cursor_end AS (
			SELECT COALESCE(MAX("ordinal"), -1) AS "lastOrdinal" FROM "NarrativeEvent"
		), ordered_events AS (
			SELECT event."id", cursor_end."lastOrdinal" + ROW_NUMBER() OVER (
				ORDER BY chapter."number", event."sequence", event."id"
			) AS "ordinal"
			FROM "NarrativeEvent" event
			JOIN "Chapter" chapter ON chapter."id" = event."chapterId"
			CROSS JOIN cursor_end
			WHERE event."ordinal" IS NULL
		)
		UPDATE "NarrativeEvent" event
		SET "ordinal" = ordered_events."ordinal"
		FROM ordered_events
		WHERE event."id" = ordered_events."id"
	`)

  // A late chapter can reveal an event from much earlier. Reinsert those
  // declared events beside their chronological anchor without disturbing the
  // relative order of the rest of the curated timeline.
  const anchoredDefinitions = knownEvents.filter((definition) => definition.occursAfterTitle)
  if (anchoredDefinitions.length > 0) {
    const orderedEvents = await prisma.narrativeEvent.findMany({
      orderBy: [{ ordinal: 'asc' }, { chapter: { number: 'asc' } }, { sequence: 'asc' }],
    })

    for (const definition of anchoredDefinitions) {
      const eventIndex = orderedEvents.findIndex((event) => event.title === definition.title)
      if (eventIndex === -1) continue
      const [event] = orderedEvents.splice(eventIndex, 1)
      const anchorIndex = orderedEvents.findIndex(
        (candidate) => candidate.title === definition.occursAfterTitle,
      )
      if (anchorIndex === -1) {
        orderedEvents.splice(eventIndex, 0, event)
        continue
      }
      orderedEvents.splice(anchorIndex + 1, 0, event)
    }

    await prisma.$transaction([
      prisma.narrativeEvent.updateMany({ data: { ordinal: null } }),
      ...orderedEvents.map((event, ordinal) =>
        prisma.narrativeEvent.update({ where: { id: event.id }, data: { ordinal } }),
      ),
    ])
  }

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
  console.log(
    `Timeline synchronisée : ${results.created} créations, ${results.updated} mises à jour.`,
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
