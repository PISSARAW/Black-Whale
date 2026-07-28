import { readDataFile, type CatalogCharacter } from '$lib/server/data-files'
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
export const load: PageServerLoad = async () => {
  const [characters, locations, chapters, abilities] = await Promise.all([
    readDataFile<CatalogCharacter[]>('characters/characters.json'),
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

  return {
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
  }
}
