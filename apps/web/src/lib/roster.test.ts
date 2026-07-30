import { describe, expect, it } from 'vitest'
import type { CatalogCharacter } from '$lib/server/data-files'
import {
  beyondLineageStatusFor,
  buildCatalogIndex,
  buildHatsuIndex,
  factionTagsForMembershipType,
  hatsuIdsFor,
  hatsuNamesFor,
  resolveFactionTags,
} from './roster'
import {
  BEYOND_LINEAGE_CONFIRMED_CHAPTER,
  BEYOND_LINEAGE_SUSPECTED_CHAPTER,
} from './beyondLineage'

const CATALOG: CatalogCharacter[] = [
  { id: 'prince-benjamin', canonicalName: 'Benjamin Hui Guo Rou', factionId: 'prince-benjamin' },
  { id: 'kurapika', canonicalName: 'Kurapika', factionId: 'zodiacs' },
  { id: 'hisoka', canonicalName: 'Hisoka Morow', factionId: 'phantom-troupe' },
  { id: 'nobunaga', canonicalName: 'Nobunaga Hazama', factionId: 'phantom-troupe' },
  { id: 'morena', canonicalName: 'Morena Prudo', factionId: 'mafia-xi-yu' },
  {
    id: 'bill',
    canonicalName: 'Bill',
    factionId: 'prince-woble',
    shipLocation: { role: 'Garde du corps de la reine Oito' },
  },
  { id: 'unknown-passenger', canonicalName: 'Unknown Passenger', factionId: null },
]

const index = buildCatalogIndex(CATALOG)
const tags = (name: string, types: string[] = []) =>
  resolveFactionTags({ canonicalName: name }, types, index)

describe('factionTagsForMembershipType', () => {
  it('maps both royal army flavours to the guard chip', () => {
    expect(factionTagsForMembershipType('KAKIN_ROYAL_ARMY')).toEqual(['guards'])
    expect(factionTagsForMembershipType('BENJAMIN_PRIVATE_ARMY')).toEqual(['guards'])
  })

  it('returns nothing for an affiliation with no chip', () => {
    expect(factionTagsForMembershipType('CIVILIAN_COHORT')).toEqual([])
  })
})

describe('resolveFactionTags', () => {
  it('tags only the heirs as princes, not their camp', () => {
    expect(tags('Benjamin Hui Guo Rou')).toContain('princes')
    expect(tags('Bill')).not.toContain('princes')
  })

  it('derives the spider and mafia chips from the catalogue faction', () => {
    expect(tags('Hisoka Morow')).toContain('spider')
    expect(tags('Morena Prudo')).toContain('mafia')
  })

  it('treats the Zodiacs as hunters', () => {
    expect(tags('Kurapika')).toContain('hunters')
  })

  it('matches accented French role text', () => {
    // "Garde du corps" only reaches the /garde/ pattern once accents are stripped.
    expect(tags('Bill')).toContain('guards')
  })

  it('prefers a recorded membership over the catalogue fallback', () => {
    // Nobunaga is catalogued with the Troupe, but the temporal record puts him
    // in the royal army at this point in the story. Both chips apply.
    const result = tags('Nobunaga Hazama', ['KAKIN_ROYAL_ARMY'])
    expect(result).toContain('guards')
    expect(result).toContain('spider')
  })

  it('returns nothing for a character the catalogue does not know', () => {
    expect(tags('Someone Entirely New')).toEqual([])
  })

  it('never repeats a chip reached by two routes', () => {
    const result = tags('Kurapika', ['HUNTER_ASSOCIATION'])
    expect(result.filter((tag) => tag === 'hunters')).toHaveLength(1)
  })

  it('ignores a null faction rather than matching the mafia prefix', () => {
    expect(tags('Unknown Passenger')).toEqual([])
  })
})

describe('beyondLineageStatusFor', () => {
  const lineageIndex = buildCatalogIndex([
    ...CATALOG.map((character) =>
      character.id === 'prince-benjamin'
        ? {
            ...character,
            beyondLineage: {
              status: 'suspected' as const,
              revealedInChapterId: 'ch-401',
              evidence: 'Longhi puts the paternity to Kurapika.',
            },
          }
        : character,
    ),
    {
      id: 'furykov',
      canonicalName: 'Furykov',
      factionId: 'prince-benjamin',
      beyondLineage: {
        status: 'confirmed' as const,
        revealedInChapterId: 'ch-415',
        evidence: 'He carries the birthmark and says so.',
      },
    },
  ])
  const statusOf = (name: string, spoilerLimit?: number) =>
    beyondLineageStatusFor({ canonicalName: name }, lineageIndex, spoilerLimit)

  it('reports the catalogued status when the reader is past the reveal', () => {
    expect(statusOf('Furykov', BEYOND_LINEAGE_CONFIRMED_CHAPTER)).toBe('confirmed')
    expect(statusOf('Benjamin Hui Guo Rou', BEYOND_LINEAGE_SUSPECTED_CHAPTER)).toBe('suspected')
  })

  it('withholds the status from a reader capped below its reveal', () => {
    expect(statusOf('Furykov', BEYOND_LINEAGE_CONFIRMED_CHAPTER - 1)).toBeUndefined()
    expect(statusOf('Benjamin Hui Guo Rou', BEYOND_LINEAGE_SUSPECTED_CHAPTER - 1)).toBeUndefined()
  })

  it('gates the two claims separately, since they land in different chapters', () => {
    // The paternity hypothesis is argued long before the birthmarks are read.
    expect(statusOf('Benjamin Hui Guo Rou', BEYOND_LINEAGE_SUSPECTED_CHAPTER)).toBe('suspected')
    expect(statusOf('Furykov', BEYOND_LINEAGE_SUSPECTED_CHAPTER)).toBeUndefined()
  })

  it('reports nothing for a passenger with no recorded lineage', () => {
    expect(statusOf('Kurapika')).toBeUndefined()
  })

  it('reports nothing for a character the catalogue does not know', () => {
    expect(statusOf('Someone Entirely New')).toBeUndefined()
  })
})

describe('hatsuNamesFor', () => {
  const hatsu = buildHatsuIndex([
    { id: 'bungee-gum', ownerId: 'hisoka', name: 'Bungee Gum' },
    { id: 'texture-surprise', ownerId: 'hisoka', name: 'Texture Surprise' },
    { id: 'emperor-time', ownerId: 'kurapika', name: 'Emperor Time' },
    { id: 'orphan', ownerId: null, name: 'Unattributed technique' },
  ])

  it('collects every ability of one owner', () => {
    expect(hatsuNamesFor({ canonicalName: 'Hisoka Morow' }, index, hatsu)).toEqual([
      'Bungee Gum',
      'Texture Surprise',
    ])
  })

  it('drops abilities with no owner', () => {
    expect([...hatsu.values()].flat().map((ability) => ability.name)).not.toContain(
      'Unattributed technique',
    )
  })

  it('exposes catalogue ids, which is what the interaction layer resolves on', () => {
    expect(hatsuIdsFor({ canonicalName: 'Hisoka Morow' }, index, hatsu)).toEqual([
      'bungee-gum',
      'texture-surprise',
    ])
  })

  it('falls back to the slug when the catalogue does not know the name', () => {
    expect(hatsuNamesFor({ canonicalName: 'Unlisted', slug: 'kurapika' }, index, hatsu)).toEqual([
      'Emperor Time',
    ])
  })

  it('returns an empty list rather than undefined for an unknown character', () => {
    expect(hatsuNamesFor({ canonicalName: 'Nobody' }, index, hatsu)).toEqual([])
  })
})
