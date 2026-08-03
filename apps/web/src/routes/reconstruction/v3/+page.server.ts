import { listCanonicalEvents } from '@black-whale/canon-engine'
import { prisma } from '$lib/server/db'
import { nenRuntime } from '$lib/server/nen'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies }) => {
  const spoilerLimit = readSpoilerLimit(cookies)
  const [events, locations, characters] = await Promise.all([
    listCanonicalEvents(prisma, spoilerLimit),
    prisma.location.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.character.findMany({
      where:
        spoilerLimit === undefined
          ? {}
          : { firstVisibleEvent: { chapter: { number: { lte: spoilerLimit } } } },
      orderBy: { canonicalName: 'asc' },
      select: {
        id: true,
        slug: true,
        canonicalName: true,
        originalBody: { select: { id: true } },
      },
    }),
  ])

  return {
    events: events.map((event) => ({
      id: event.id,
      title: event.title,
      chapter: event.chapter.number,
      sequence: event.sequence,
    })),
    locations,
    characters: characters.flatMap((character) =>
      character.originalBody
        ? [
            {
              id: character.id,
              canonicalName: character.canonicalName,
              bodyId: character.originalBody.id,
            },
          ]
        : [],
    ),
    abilities: nenRuntime
      .listRunnableAbilities()
      .map(({ id, name, owner }) => ({
        id,
        name,
        ownerCharacterId:
          characters.find((character) => character.slug === owner || character.id === owner)?.id ??
          null,
      }))
      .sort((left, right) => left.name.localeCompare(right.name)),
    spoilerLimit: spoilerLimit ?? null,
  }
}
