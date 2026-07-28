import { describe, expect, it } from 'vitest'
import {
  buildAffiliations,
  buildCharacterProfile,
  buildRoleHistory,
  readFirstAppearanceChapter,
} from './character-profile.js'

const event = (chapter: number) => ({ chapter: { number: chapter }, sequence: 1, title: 'e' })

describe('buildCharacterProfile', () => {
  /** The markup indexes these directly; undefined would throw in the template. */
  it('normalises every missing list to an empty array', () => {
    const profile = buildCharacterProfile({ id: 'x', canonicalName: 'X' }, [], null)

    expect(profile.aliases).toEqual([])
    expect(profile.biography).toEqual([])
    expect(profile.equipment).toEqual([])
    expect(profile.mangaAppearances).toEqual([])
    expect(profile.battles).toEqual([])
    expect(profile.competitions).toEqual([])
  })

  it('normalises every missing scalar to null', () => {
    const profile = buildCharacterProfile({ id: 'x', canonicalName: 'X' }, [], null)

    expect(profile.identity).toBeNull()
    expect(profile.shipLocation).toBeNull()
    expect(profile.factionId).toBeNull()
    expect(profile.description).toBeNull()
    expect(profile.nen).toBeNull()
  })

  it('exposes the catalogue id as the slug', () => {
    expect(buildCharacterProfile({ id: 'kurapika' }, [], null).slug).toBe('kurapika')
  })

  it('attaches abilities owned by the character', () => {
    const abilities = [{ id: 'chain', ownerId: 'kurapika' }, { id: 'other', ownerId: 'hisoka' }]

    expect(buildCharacterProfile({ id: 'kurapika' }, abilities, null).abilities).toEqual([
      abilities[0],
    ])
  })

  /** Shared techniques list their users; the owner is not the only carrier. */
  it('attaches abilities the character merely uses', () => {
    const abilities = [{ id: 'nen-beast', ownerId: 'tserriednich', userIds: ['kurapika'] }]

    expect(buildCharacterProfile({ id: 'kurapika' }, abilities, null).abilities).toEqual(abilities)
  })
})

describe('buildRoleHistory', () => {
  it('merges roles and official assignments', () => {
    const history = buildRoleHistory({
      roles: [{ roleName: 'Bodyguard', fromEvent: event(2), untilEvent: { chapter: { number: 8 } } }],
      assignments: [{ officialRole: 'Hunter', fromEvent: event(5) }],
    })

    expect(history).toEqual([
      { label: 'Bodyguard', chapter: 2, untilChapter: 8, detail: 'e' },
      { label: 'Hunter', chapter: 5, untilChapter: null, detail: 'e' },
    ])
  })

  it('yields nothing for a character absent from the database', () => {
    expect(buildRoleHistory(null)).toEqual([])
  })
})

describe('buildAffiliations', () => {
  it('flattens a membership to the chapters it spans', () => {
    const affiliations = buildAffiliations({
      affiliations: [
        {
          faction: { name: 'Kakin Royal Family' },
          role: 'Guard',
          status: 'ACTIVE',
          fromEvent: event(3),
          untilEvent: { chapter: { number: 11 } },
        },
      ],
    })

    expect(affiliations).toEqual([
      { name: 'Kakin Royal Family', role: 'Guard', status: 'ACTIVE', chapter: 3, untilChapter: 11 },
    ])
  })

  it('yields nothing for a character absent from the database', () => {
    expect(buildAffiliations(null)).toEqual([])
  })
})

describe('readFirstAppearanceChapter', () => {
  it('reads the number out of a chapter id', () => {
    expect(readFirstAppearanceChapter({ firstAppearanceChapterId: 'ch-349' })).toBe(349)
  })

  /** null means "no restriction" — an unknown debut must not hide the page. */
  it('returns null when the catalogue records no debut', () => {
    expect(readFirstAppearanceChapter({})).toBeNull()
    expect(readFirstAppearanceChapter({ firstAppearanceChapterId: 'unknown' })).toBeNull()
  })
})
