import { readDataFile, type CatalogCharacter } from '$lib/server/data-files'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async () => {
  const characters = await readDataFile<CatalogCharacter[]>('characters/characters.json')

  return { characters }
}
