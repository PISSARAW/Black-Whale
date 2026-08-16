import { visibleLineage } from '$lib/beyondLineage'
import { readDataFile, type CatalogCharacter } from '$lib/server/data-files'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ cookies }) => {
  const characters = await readDataFile<CatalogCharacter[]>('characters/characters.json')
  const spoilerLimit = readSpoilerLimit(cookies)

  // Beyond's lineage is stripped rather than flagged: the registry filter runs in
  // the browser, so anything still attached here would be readable in the payload
  // by a reader who asked not to be spoiled.
  const visible: CatalogCharacter[] = characters.map((character): CatalogCharacter => {
    const lineage = visibleLineage(character.beyondLineage, spoilerLimit)
    if (lineage === character.beyondLineage) return character
    const { beyondLineage: _dropped, ...rest } = character
    return lineage ? { ...rest, beyondLineage: lineage } : rest
  })

  return { characters: visible, spoilerLimit }
}
