import { localizedLoad } from '$lib/server/localized-load'
import { readDataFile, type CatalogCharacter } from '$lib/server/data-files'
import { countLiving, type LivingCountCharacter } from '$lib/server/living-count'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

interface CatalogLocation {
  id: string
  deck: number | null
  zoneType: string
}

interface CatalogChapter {
  id: string
  number: number
  title: string
  date: string
}

// The homepage advertises the size of the archive. Every figure it shows is
// counted from the catalogue at request time so the numbers cannot drift away
// from the data the rest of the site serves.
export const load: PageServerLoad = localizedLoad(
  async ({ cookies }: Parameters<PageServerLoad>[0]) => {
    const [characters, locations, chapters, abilities] = await Promise.all([
      readDataFile<(CatalogCharacter & LivingCountCharacter)[]>('characters/characters.json'),
      readDataFile<CatalogLocation[]>('locations/locations.json'),
      readDataFile<CatalogChapter[]>('chapters/chapters.json'),
      readDataFile<unknown[]>('abilities/abilities.json'),
    ])

    // `deck` is null for the ship itself; the tier entries are containers rather
    // than places anyone stands in, so they are excluded from the room count.
    const tiers = new Set(
      locations.map((location) => location.deck).filter((deck): deck is number => deck !== null),
    )
    const rooms = locations.filter(
      (location) => location.zoneType !== 'ship' && location.zoneType !== 'tier',
    )

    const latestChapter = chapters.reduce<CatalogChapter | null>(
      (latest, chapter) => (latest === null || chapter.number > latest.number ? chapter : latest),
      null,
    )
    const chapterNumbers = chapters.map((chapter) => chapter.number)

    // A cap at or past the latest chapter hides nothing, and reading it as no cap
    // lets the deaths the catalogue never dates count for that reader too.
    const cap = readSpoilerLimit(cookies)
    const livingCap =
      cap !== undefined && latestChapter && cap < latestChapter.number ? cap : undefined

    return {
      living: { ...countLiving(characters, livingCap), asOfChapter: livingCap ?? null },
      metrics: {
        tiers: tiers.size,
        passengers: characters.length,
        rooms: rooms.length,
        abilities: abilities.length,
      },
      latestChapter: latestChapter && {
        number: latestChapter.number,
        title: latestChapter.title,
        date: latestChapter.date,
      },
      coverage: {
        first: Math.min(...chapterNumbers),
        last: Math.max(...chapterNumbers),
      },
    }
  },
)
