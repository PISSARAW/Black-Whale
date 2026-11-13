import { error } from '@sveltejs/kit'
import { localizedLoad } from '$lib/server/localized-load'
import { readDataFile } from '$lib/server/data-files'
import { readSpoilerLimit } from '$lib/server/spoiler'
import { prisma } from '$lib/server/db'
import type { PageServerLoad } from './$types'

interface SourceRef {
  chapterId: string
  note?: string
}

interface CuratedEvent {
  id: string
  chapter: number
  chapterTitle: string
  sequence: number
  title: string
  summary?: string
  occurredAtLabel?: string
  occursOnBlackWhale?: boolean
  modifiedAt: string
  sources: SourceRef[]
}

interface AbilityUse {
  id: string
  chapter: number
  eventTitle?: string
  abilityId: string
  userId: string
  status: string
  note: string
}

interface NamedRecord {
  id: string
  name?: string
  canonicalName?: string
}

async function loadDatabaseContext(sourceId: string) {
  const databaseEvent = await prisma.narrativeEvent.findUnique({
    where: { sourceId },
    include: { chapter: true, participations: true },
  })
  const participantIds = [
    ...new Set(databaseEvent?.participations.map((entry) => entry.participantId) ?? []),
  ]
  const [location, participantCharacters] = await Promise.all([
    databaseEvent?.locationId
      ? prisma.location.findUnique({ where: { id: databaseEvent.locationId } })
      : null,
    participantIds.length
      ? prisma.character.findMany({
          where: { id: { in: participantIds } },
          select: { slug: true, canonicalName: true },
        })
      : [],
  ])

  return { databaseEvent, location, participantCharacters }
}

export const load: PageServerLoad = localizedLoad(
  async ({ params, cookies }: Parameters<PageServerLoad>[0]) => {
    const [events, uses, abilities, characters] = await Promise.all([
      readDataFile<CuratedEvent[]>('events/events.json'),
      readDataFile<AbilityUse[]>('abilities/uses.json'),
      readDataFile<NamedRecord[]>('abilities/abilities.json'),
      readDataFile<NamedRecord[]>('characters/characters.json'),
    ])
    const event = events.find((candidate) => candidate.id === params.slug)
    const spoilerLimit = readSpoilerLimit(cookies)
    if (!event || (spoilerLimit !== undefined && event.chapter > spoilerLimit)) {
      throw error(404, 'Event not found')
    }

    const { databaseEvent, location, participantCharacters } = await loadDatabaseContext(event.id)
    const characterById = new Map(characters.map((character) => [character.id, character]))
    const abilityById = new Map(abilities.map((ability) => [ability.id, ability]))
    const eventUses = uses
      .filter((use) => use.eventTitle === event.title)
      .map((use) => ({
        ...use,
        abilityName: abilityById.get(use.abilityId)?.name ?? use.abilityId,
        userName: characterById.get(use.userId)?.canonicalName ?? use.userId,
      }))

    return {
      event,
      chronology: databaseEvent
        ? {
            databaseId: databaseEvent.id,
            ordinal: databaseEvent.ordinal,
            occurredAtLabel: databaseEvent.occurredAtLabel,
            occurredAtBasis: databaseEvent.occurredAtBasis,
            occurredAtSource: databaseEvent.occurredAtSource,
          }
        : null,
      location: location && { id: location.slug, name: location.name },
      participants: participantCharacters.map((character) => ({
        id: character.slug,
        name: character.canonicalName,
      })),
      uses: eventUses,
    }
  },
)
