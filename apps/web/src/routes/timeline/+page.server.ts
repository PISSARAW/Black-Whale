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

export const load: PageServerLoad = async ({ cookies }) => {
  const maxChapter = readSpoilerLimit(cookies)

  // Fetch all chapters with their events, filtered by spoiler limit
  const [chapters, uses, abilities] = await Promise.all([
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
  ])

  const abilityNames = new Map(abilities.map((ability) => [ability.id, ability.name]))
  const visibleUses = uses
    .filter((use) => use.occursOnBlackWhale)
    .filter((use) => maxChapter === undefined || use.chapter <= maxChapter)
    .map((use) => ({ ...use, abilityName: abilityNames.get(use.abilityId) ?? use.abilityId }))

  const enrichedChapters = chapters.map((chapter) => ({
    ...chapter,
    abilityUses: visibleUses.filter((use) => use.chapter === chapter.number && !use.eventTitle),
    events: chapter.events.map((event) => ({
      ...event,
      abilityUses: visibleUses.filter(
        (use) => use.chapter === chapter.number && use.eventTitle === event.title,
      ),
    })),
  }))

  return {
    chapters: enrichedChapters,
    spoilerLimit: maxChapter,
  }
}
