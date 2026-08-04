import { describe, expect, it } from 'vitest'
import { rosterFrom, type RosterInput } from './roster'

const LOCATIONS = [
  { id: 'loc-1014', slug: 'tier-1-royal-residential-sector-room-1014', parentLocationId: 'loc-1' },
  { id: 'loc-1', slug: 'tier-1-royal-residential-sector', parentLocationId: null },
  { id: 'loc-ward', slug: 'tier-3-political-ward', parentLocationId: null },
  { id: 'loc-court', slug: 'tier-3-central-courthouse', parentLocationId: 'loc-ward' },
]

const CATALOGUE = [
  {
    id: 'kurapika',
    canonicalName: 'Kurapika',
    shipLocation: { role: 'Nen teacher/protector' },
    nen: { type: 'conjurer' },
  },
  { id: 'sakata', canonicalName: 'Sakata', shipLocation: { role: 'Royal Bodyguard' } },
  {
    id: 'prince-woble',
    canonicalName: 'Woble Hui Guo Rou',
    guardianBeast: {
      silhouette: 'ghost',
      sourceChapterId: 'ch-358',
      standsWith: 'oito-nephew-fake-woble',
    },
  },
  { id: 'oito-nephew-fake-woble', canonicalName: "Oito's Nephew", shipLocation: { role: 'faux' } },
]

function input(overrides: Partial<RosterInput> = {}): RosterInput {
  return {
    bodies: [
      { id: 'body-kurapika', originalCharacterId: 'kurapika' },
      { id: 'body-nephew', originalCharacterId: 'oito-nephew-fake-woble' },
    ],
    appearances: [],
    presences: [
      {
        entityId: 'body-kurapika',
        locationId: 'loc-1014',
        precision: 'EXACT_ROOM',
        fromEvent: { chapterId: 'ch-358' },
      },
    ],
    locations: LOCATIONS,
    catalogue: CATALOGUE,
    abilities: [
      { ownerId: 'kurapika', kind: 'scarlet' },
      { ownerId: 'kurapika', kind: null },
      { ownerId: 'sakata', kind: 'impact' },
    ],
    ...overrides,
  }
}

describe('the roster', () => {
  it('reads a body out of the world state, with its room and its chapter', () => {
    const { members } = rosterFrom(input())
    expect(members).toHaveLength(1)
    expect(members[0]).toMatchObject({
      characterId: 'kurapika',
      name: 'Kurapika',
      role: 'Nen teacher/protector',
      since: 'ch-358',
      nen: true,
      hatsu: ['scarlet'],
    })
    expect(members[0]!.locations).toContain('tier-1-royal-residential-sector-room-1014')
  })

  /** Aboard is not a place: a position no finer than a deck is left to the map. */
  it('refuses a position that is not a place', () => {
    const onADeck = input({
      presences: [{ entityId: 'body-kurapika', locationId: 'loc-1', precision: 'TIER' }],
    })
    expect(rosterFrom(onADeck).members).toEqual([])
    const lost = input({
      presences: [{ entityId: 'body-kurapika', locationId: 'loc-1', precision: 'UNKNOWN' }],
    })
    expect(rosterFrom(lost).members).toEqual([])
  })

  /**
   * A suite is a place. `ZONE` says the catalogue named a room rather than
   * numbered one — the family offices, the hospital, the cabins — and refusing
   * those emptied every deck but the first while the same bodies stood on the
   * map.
   */
  it('stands a body in a place the catalogue names rather than numbers', () => {
    const inTheWard = input({
      presences: [
        {
          entityId: 'body-kurapika',
          locationId: 'loc-court',
          precision: 'ZONE',
          fromEvent: { chapterId: 'ch-358' },
        },
      ],
    })
    const [member] = rosterFrom(inTheWard).members
    expect(member).toMatchObject({ characterId: 'kurapika', approximate: true })
    expect(member!.locations).toContain('tier-3-central-courthouse')
  })

  /** A room number is not approximate, and the card must be able to tell. */
  it('leaves a numbered room unmarked', () => {
    expect(rosterFrom(input()).members[0]).not.toHaveProperty('approximate')
  })

  it('hands a sector its rooms as well as itself', () => {
    const inWard = input({
      presences: [{ entityId: 'body-kurapika', locationId: 'loc-ward', precision: 'EXACT_ROOM' }],
    })
    expect(rosterFrom(inWard).members[0]!.locations).toEqual(
      expect.arrayContaining(['tier-3-political-ward', 'tier-3-central-courthouse']),
    )
  })

  /**
   * The managed identity: a body wearing somebody else's face travels under the
   * face. The reader capped below the revelation is shown what they have read.
   */
  it('shows a body under the identity valid at the cap', () => {
    const disguised = input({
      appearances: [{ entityId: 'body-nephew', appearanceCharacterId: 'kurapika' }],
      presences: [{ entityId: 'body-nephew', locationId: 'loc-1014', precision: 'EXACT_ROOM' }],
    })
    expect(rosterFrom(disguised).members[0]!.characterId).toBe('kurapika')
  })

  it('resolves a beast whose owner is never placed to the body it stands with', () => {
    const { beasts } = rosterFrom(input())
    expect(beasts).toEqual([
      expect.objectContaining({ ownerId: 'prince-woble', standsWithId: 'oito-nephew-fake-woble' }),
    ])
  })

  it('does not double a beast whose owner is placed after all', () => {
    const wobleIsAboard = input({
      bodies: [{ id: 'body-woble', originalCharacterId: 'prince-woble' }],
      presences: [{ entityId: 'body-woble', locationId: 'loc-1014', precision: 'EXACT_ROOM' }],
    })
    const { members, beasts } = rosterFrom(wobleIsAboard)
    expect(members[0]!.beast).toMatchObject({ ownerId: 'prince-woble' })
    expect(beasts).toEqual([])
  })
})
