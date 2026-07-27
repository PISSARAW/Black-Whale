/**
 * Checks that the map agrees with the catalogue.
 *
 * `backfill_catalog_map.mjs` projects `data/characters/characters.json` into
 * Presence and BodyState rows, and nothing else re-reads those rows to confirm
 * the projection survived. This script does: it walks every character, every
 * chapter the catalogue says they are physically on panel, and asserts the map
 * puts them somewhere aboard at that point in the story.
 *
 * Run it after any backfill. A non-zero exit means the map and the catalogue
 * have drifted apart.
 */
import { PrismaClient } from '@prisma/client'
import { isActiveAt } from '@black-whale/domain'
import { readFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const prisma = new PrismaClient()
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const characters = JSON.parse(
  await readFile(resolve(projectRoot, 'data/characters/characters.json'), 'utf8'),
)

/// Statuses that mean the character's body is on panel. `pictured`, `mentioned`,
/// `flashback`, `vision`, `voice` and `impersonated` all describe someone who is
/// discussed or shown in effigy while being somewhere else — or nowhere.
/// `corpse` is deliberately absent: a dead body leaves the map.
const presentStatuses = new Set(['appears', 'debut', 'disguised', 'death'])

function deathChapter(character) {
  const appearances = character.mangaAppearances || []
  const death = [...appearances].reverse().find((entry) => entry.status === 'death')
  if (!death) return null
  const returnsLater = appearances.some(
    (entry) => entry.chapter > death.chapter && presentStatuses.has(entry.status),
  )
  return returnsLater ? null : death.chapter
}

const failures = []

function fail(scope, message) {
  failures.push(`${scope}: ${message}`)
}

const events = await prisma.narrativeEvent.findMany({ include: { chapter: true } })
const bodies = await prisma.body.findMany({ where: { originalCharacterId: { not: null } } })
const charactersById = new Map(
  (await prisma.character.findMany()).map((character) => [character.id, character]),
)
const presences = await prisma.presence.findMany({
  include: {
    fromEvent: { include: { chapter: true } },
    untilEvent: { include: { chapter: true } },
    location: true,
  },
})
const bodyStates = await prisma.bodyState.findMany({
  include: { fromEvent: { include: { chapter: true } } },
})

const bodyBySlug = new Map()
for (const body of bodies) {
  const owner = charactersById.get(body.originalCharacterId)
  if (owner) bodyBySlug.set(owner.slug, body)
}
const presencesByEntity = new Map()
for (const presence of presences) {
  const bucket = presencesByEntity.get(presence.entityId) || []
  bucket.push(presence)
  presencesByEntity.set(presence.entityId, bucket)
}
const onShipEvents = new Map()
for (const event of events.filter((candidate) => candidate.occursOnBlackWhale)) {
  const bucket = onShipEvents.get(event.chapter.number) || []
  bucket.push(event)
  onShipEvents.set(event.chapter.number, bucket)
}
/// The backfill resolves a bare `ch-N` to the chapter's first event, so death
/// bounds land there too.
const firstEventOfChapter = new Map()
for (const event of events) {
  const current = firstEventOfChapter.get(event.chapter.number)
  if (!current || event.sequence < current.sequence) {
    firstEventOfChapter.set(event.chapter.number, event)
  }
}

for (const character of characters) {
  const scope = character.id
  const body = bodyBySlug.get(character.id)
  const shipLocation = character.shipLocation || {}

  // Rooms 1001-1014 are the royal residential sector, which is on Tier 1.
  const room = String(shipLocation.room || '')
  if (/^10(0[0-9]|1[0-4])$/.test(room) && shipLocation.tier !== 1) {
    fail(scope, `room ${room} is on Tier 1 but the catalogue claims Tier ${shipLocation.tier}`)
  }

  for (const [index, leg] of (character.mapTrajectory || []).entries()) {
    if (!leg.location || !leg.fromChapterId) {
      fail(scope, `trajectory leg ${index} needs both a location and a fromChapterId`)
    }
    const next = character.mapTrajectory[index + 1]
    if (next && leg.untilChapterId) {
      fail(
        scope,
        `trajectory leg ${index} sets untilChapterId but leg ${index + 1} already ends it`,
      )
    }
  }

  if (!body) {
    if (character.mapTrajectory?.length) fail(scope, 'declares a trajectory but has no body')
    continue
  }

  const ownPresences = presencesByEntity.get(body.id) || []
  const death = deathChapter(character)

  for (const appearance of character.mangaAppearances || []) {
    if (!presentStatuses.has(appearance.status)) continue
    let chapterEvents = onShipEvents.get(appearance.chapter)
    if (!chapterEvents) continue // the chapter plays out off the ship

    // Dying ends the presence, so only the part of the chapter up to the death
    // can be checked — and a chapter can open off the ship, as 383 does with
    // Kacho's escape. Nothing to assert then: the death happened elsewhere.
    if (appearance.status === 'death') {
      const deathEvent = firstEventOfChapter.get(appearance.chapter)
      chapterEvents = chapterEvents.filter((event) => event.sequence <= deathEvent.sequence)
      if (!chapterEvents.length) continue
    }

    const covered = chapterEvents.some((event) =>
      ownPresences.some((presence) => isActiveAt(presence, event)),
    )
    if (!covered) {
      fail(scope, `"${appearance.status}" in chapter ${appearance.chapter} with no map position`)
    }
  }

  if (death !== null) {
    const stillOpen = ownPresences.filter(
      (presence) => !presence.untilEventId || presence.untilEvent.chapter.number > death + 1,
    )
    if (stillOpen.length) {
      fail(scope, `dies in chapter ${death} but keeps ${stillOpen.length} presence(s) afterwards`)
    }
    const dead = bodyStates.filter((state) => state.bodyId === body.id && state.state === 'DEAD')
    if (!dead.length) {
      fail(scope, `dies in chapter ${death} with no DEAD body state`)
    } else if (dead.some((state) => state.fromEvent.chapter.number !== death)) {
      fail(
        scope,
        `DEAD body state starts in chapter ${dead[0].fromEvent.chapter.number}, death is ${death}`,
      )
    }
  }
}

await prisma.$disconnect()

if (failures.length) {
  console.error(`${failures.length} map inconsistencies:\n`)
  for (const failure of failures) console.error(`  ${failure}`)
  process.exitCode = 1
} else {
  console.log(`Map verified: ${characters.length} catalogue entries agree with their presences.`)
}
