import { localizedLoad } from '$lib/server/localized-load'
import { prisma } from '$lib/server/db'
import { readDataFile } from '$lib/server/data-files'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

interface AbilityUseRow {
  id: string
  chapter: number
  eventTitle?: string
  abilityId: string
  userId: string
  status: 'ACTIVATED' | 'MAINTAINED' | 'REVEALED' | 'FAILED' | 'PREVENTED' | 'EXPLAINED'
  occursOnBlackWhale: boolean
  note: string
}

interface AbilityRow {
  id: string
  name: string
}

interface CuratedEventRow {
  id: string
  title: string
  modifiedAt: string
}

export const load: PageServerLoad = localizedLoad(
  async ({ cookies }: Parameters<PageServerLoad>[0]) => {
    const maxChapter = readSpoilerLimit(cookies)

    // Fetch all chapters with their events, filtered by spoiler limit
    const [chapters, uses, abilities, curatedEvents] = await Promise.all([
      prisma.chapter.findMany({
        where: {
          ...(maxChapter !== undefined ? { number: { lte: maxChapter } } : {}),
          events: { some: { occursOnBlackWhale: true } },
        },
        orderBy: { number: 'asc' },
        include: {
          events: {
            where: { occursOnBlackWhale: true },
            orderBy: { sequence: 'asc' },
          },
        },
      }),
      readDataFile<AbilityUseRow[]>('abilities/uses.json'),
      readDataFile<AbilityRow[]>('abilities/abilities.json'),
      readDataFile<CuratedEventRow[]>('events/events.json'),
    ])

    const abilityNames = new Map(abilities.map((ability) => [ability.id, ability.name]))
    const curatedByTitle = new Map(curatedEvents.map((event) => [event.title, event]))
    const visibleUses = uses
      .filter((use) => use.occursOnBlackWhale)
      .filter((use) => maxChapter === undefined || use.chapter <= maxChapter)
      .map((use) => ({ ...use, abilityName: abilityNames.get(use.abilityId) ?? use.abilityId }))

    const enrichedChapters = chapters.map((chapter) => ({
      ...chapter,
      abilityUses: visibleUses.filter((use) => use.chapter === chapter.number && !use.eventTitle),
      events: chapter.events.map((event) => ({
        ...event,
        publicId: event.sourceId ?? curatedByTitle.get(event.title)?.id ?? null,
        modifiedAt: curatedByTitle.get(event.title)?.modifiedAt ?? '2026-11-13',
        abilityUses: visibleUses.filter(
          (use) => use.chapter === chapter.number && use.eventTitle === event.title,
        ),
      })),
    }))

    return {
      chapters: enrichedChapters,
      spoilerLimit: maxChapter,
      modifiedAt: enrichedChapters
        .flatMap((chapter) => chapter.events)
        .reduce(
          (latest, event) => (event.modifiedAt > latest ? event.modifiedAt : latest),
          '1970-01-01',
        ),
    }
  },
)
