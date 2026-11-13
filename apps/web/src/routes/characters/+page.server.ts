import { localizedLoad } from '$lib/server/localized-load'
import { visibleLineage } from '$lib/beyondLineage'
import { isVisibleAtSpoilerLimit } from '$lib/server/character-profile'
import { readDataFile, type CatalogCharacter } from '$lib/server/data-files'
import { readSpoilerLimit } from '$lib/server/spoiler'
import type { PageServerLoad } from './$types'

interface CatalogChapter {
  number: number
}

export const load: PageServerLoad = localizedLoad(
  async ({ cookies }: Parameters<PageServerLoad>[0]) => {
    const [characters, chapters] = await Promise.all([
      readDataFile<CatalogCharacter[]>('characters/characters.json'),
      readDataFile<CatalogChapter[]>('chapters/chapters.json'),
    ])
    const spoilerLimit = readSpoilerLimit(cookies)
    const latestChapter = chapters.reduce((latest, chapter) => Math.max(latest, chapter.number), 0)
    const isCapped = spoilerLimit !== undefined && spoilerLimit < latestChapter

    // Filtering must happen before serialization: hiding a card in the browser
    // would still leak its name and description in the page payload. Undated
    // catalogue prose is withheld while the archive is genuinely capped; there
    // is no honest chapter boundary at which it can be truncated.
    const visible: CatalogCharacter[] = characters
      .filter((character) => isVisibleAtSpoilerLimit(character, spoilerLimit))
      .map((character): CatalogCharacter => {
        const lineage = visibleLineage(character.beyondLineage, spoilerLimit)
        const card: CatalogCharacter = {
          id: character.id,
          canonicalName: character.canonicalName,
          aliases: character.aliases,
          description: character.description,
          factionId: character.factionId,
          firstAppearanceChapterId: character.firstAppearanceChapterId,
          canonStatus: character.canonStatus,
          ...(lineage ? { beyondLineage: lineage } : {}),
        }
        if (!isCapped) {
          return card
        }

        return {
          id: character.id,
          canonicalName: character.canonicalName,
          firstAppearanceChapterId: character.firstAppearanceChapterId,
          canonStatus: character.canonStatus,
          ...(lineage ? { beyondLineage: lineage } : {}),
        }
      })

    return { characters: visible, spoilerLimit }
  },
)
