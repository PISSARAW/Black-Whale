import { publicText } from '$lib/i18n/publicText'
import { foldSearch } from '$lib/search/text'
import { SEARCH_CATEGORIES, type SearchCategory, type SearchResult } from '$lib/search/types'
import { loadAbilityVisibility } from './ability-visibility'
import {
  readFirstAppearanceChapter,
  type CatalogCharacterRecord,
  type AbilityRecord,
} from './character-profile'
import { readDataFile, type CatalogFaction } from './data-files'
import contentTexts from './public-content.json'
import { searchPages } from './siteSearchPages'
import type { SearchDocument } from './siteSearchRanking'

interface EventRecord {
  id: string
  title: string
  summary?: string
  chapter: number
}
interface SpaceRecord {
  id: string
  name: string
  nameFr: string
  source?: string
  provenance: string
}

function categoryOf(value: string | undefined): SearchCategory {
  const category = foldSearch(value ?? '')
  const aliases: Record<string, SearchCategory> = {
    enhancement: 'enhancer',
    conjuration: 'conjurer',
    emission: 'emitter',
  }
  if (aliases[category]) return aliases[category]
  return SEARCH_CATEGORIES.find((candidate) => category.includes(candidate)) ?? 'none'
}

function document(
  base: Omit<SearchResult, 'excerpt'>,
  metadata: {
    text?: string
    excerpt?: string
    titleFr?: string
    category?: SearchCategory
    dated?: boolean
  } = {},
): SearchDocument {
  const titleFr = metadata.titleFr ?? publicText(base.title, 'fr', contentTexts.fr)
  const text = metadata.text ?? ''
  const excerpt = metadata.excerpt ?? text
  return {
    ...base,
    titleEn: base.title,
    titleFr,
    text: `${text} ${publicText(excerpt, 'fr', contentTexts.fr)}`,
    excerpt,
    category: metadata.category ?? 'none',
    dated: metadata.dated ?? false,
  }
}

function charactersIndex(characters: CatalogCharacterRecord[]): SearchDocument[] {
  return characters.map((character) =>
    document(
      {
        id: `character:${character.id}`,
        kind: 'character',
        title: character.canonicalName ?? character.id,
        href: `/characters/${encodeURIComponent(character.id)}`,
        // An undated identity correction can change the public name itself.
        chapter: character.identity ? null : readFirstAppearanceChapter(character),
      },
      {
        text: [character.description, ...(character.aliases ?? []), character.factionId]
          .filter(Boolean)
          .join(' '),
        excerpt: character.description ?? '',
        category: categoryOf(character.nen?.type),
      },
    ),
  )
}

function abilitiesIndex(
  abilities: AbilityRecord[],
  options: {
    firstChapter: (id: string) => number | null
    names: Map<string, string>
  },
): SearchDocument[] {
  return abilities.map((ability) =>
    document(
      {
        id: `ability:${ability.id}`,
        kind: 'ability',
        title: ability.name ?? ability.id,
        href: `/abilities/${encodeURIComponent(ability.id)}`,
        chapter: options.firstChapter(ability.id),
      },
      {
        text: [
          ability.description,
          ...(ability.alternateNames ?? []),
          options.names.get(ability.ownerId ?? ''),
        ]
          .filter(Boolean)
          .join(' '),
        excerpt: ability.description ?? '',
        category: categoryOf(ability.category),
      },
    ),
  )
}

function eventsIndex(events: EventRecord[]): SearchDocument[] {
  return events.map((event) =>
    document(
      {
        id: `event:${event.id}`,
        kind: 'event',
        title: event.title,
        href: `/events/${encodeURIComponent(event.id)}`,
        chapter: event.chapter,
      },
      {
        text: `${event.summary ?? ''} ch ${event.chapter}`,
        excerpt: event.summary ?? '',
        dated: true,
      },
    ),
  )
}

function placesIndex(spaces: SpaceRecord[]): SearchDocument[] {
  return spaces.map((space) => {
    const chapters = [...(space.source ?? '').matchAll(/(?:ch\.?|chap\.?|chapter)\s*(\d+)/gi)].map(
      (match) => Number(match[1]),
    )
    // Every referenced chapter must be readable before this current room label is searchable.
    const chapter = space.provenance === 'panel' && chapters.length ? Math.max(...chapters) : null
    return document(
      {
        id: `place:${space.id}`,
        kind: 'place',
        title: space.name,
        href: `/tour?space=${encodeURIComponent(space.id)}`,
        chapter,
      },
      { titleFr: space.nameFr },
    )
  })
}

async function buildSearchCatalog() {
  const [characters, abilities, events, factions, blueprint, chapters, visibility] =
    await Promise.all([
      readDataFile<CatalogCharacterRecord[]>('characters/characters.json'),
      readDataFile<AbilityRecord[]>('abilities/abilities.json'),
      readDataFile<EventRecord[]>('events/events.json'),
      readDataFile<CatalogFaction[]>('factions/factions.json'),
      readDataFile<{ spaces: SpaceRecord[] }>('ship/blueprint.json'),
      readDataFile<Array<{ number: number }>>('chapters/chapters.json'),
      loadAbilityVisibility(),
    ])
  const names = new Map(characters.map((person) => [person.id, person.canonicalName ?? person.id]))
  return {
    latestChapter: Math.max(...chapters.map((chapter) => chapter.number)),
    documents: [
      ...searchPages(),
      ...charactersIndex(characters),
      ...abilitiesIndex(abilities, { firstChapter: visibility.firstVisibleChapter, names }),
      ...eventsIndex(events),
      ...placesIndex(blueprint.spaces),
      // No chapter-bound faction catalogue exists: withhold these entries under a cap.
      ...factions.map((faction) =>
        document(
          {
            id: `faction:${faction.id}`,
            kind: 'faction',
            title: faction.name,
            href: '/relationships',
            chapter: null,
          },
          { text: faction.description },
        ),
      ),
    ],
  }
}

let catalogue: ReturnType<typeof buildSearchCatalog> | undefined
export function loadSearchCatalog() {
  catalogue ??= buildSearchCatalog().catch((error: unknown) => {
    catalogue = undefined
    throw error
  })
  return catalogue
}
