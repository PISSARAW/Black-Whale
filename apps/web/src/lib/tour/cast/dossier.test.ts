import { describe, expect, it } from 'vitest'
import { dossierFor, type DossierAbility, type DossierCharacter } from './dossier'

const ABILITIES: DossierAbility[] = [
  { ownerId: 'kurapika', name: 'Chain Jail', carried: true },
  { ownerId: 'kurapika', name: 'Holy Chain', carried: true },
  { ownerId: 'illumi', name: 'Needle People', carried: true },
]

const FACTIONS = new Map([['phantom-troupe', 'the Phantom Troupe']])

const character = (overrides: Partial<DossierCharacter> = {}): DossierCharacter => ({
  id: 'kurapika',
  canonicalName: 'Kurapika',
  factionId: 'phantom-troupe',
  shipLocation: { role: 'Nen teacher/protector' },
  nen: { typeLabel: 'Conjurer' },
  mapTrajectory: [
    { location: 'room-1014', fromChapterId: 'ch-358' },
    { location: 'room-1003', fromChapterId: 'ch-365' },
  ],
  ...overrides,
})

const options = (cap: number | null) => ({ cap, factions: FACTIONS, abilities: ABILITIES })

describe('what one body can be asked', () => {
  it('reads the role, the faction and the declared category out of the catalogue', () => {
    const dossier = dossierFor(character(), options(null))
    expect(dossier.role).toBe('Nen teacher/protector')
    expect(dossier.faction).toBe('the Phantom Troupe')
    expect(dossier.factionId).toBe('phantom-troupe')
    expect(dossier.category).toBe('Conjurer')
  })

  it('gives them the techniques the catalogue makes them the owner of, and no others', () => {
    const dossier = dossierFor(character(), options(null))
    expect(dossier.techniques.map((one) => one.name)).toEqual(['Chain Jail', 'Holy Chain'])
  })

  /** Silence is an answer: an absent field is null, never an invented default. */
  it('says nothing where the archive says nothing', () => {
    const bare = character({ shipLocation: null, factionId: null, nen: null, mapTrajectory: null })
    const dossier = dossierFor(bare, options(null))
    expect(dossier.role).toBe('')
    expect(dossier.faction).toBeNull()
    expect(dossier.category).toBeNull()
    expect(dossier.route).toEqual([])
  })

  it('names a faction the catalogue holds no name for as no faction at all', () => {
    const orphan = character({ factionId: 'unknown-order' })
    expect(dossierFor(orphan, options(null)).faction).toBeNull()
    expect(dossierFor(orphan, options(null)).factionId).toBe('unknown-order')
  })
})

describe('the route, cut at the reader’s chapter', () => {
  it('travels whole to a reader who has set no cap', () => {
    const dossier = dossierFor(character(), options(null))
    expect(dossier.route.map((step) => step.label)).toEqual(['358', '365'])
    expect(dossier.withheld).toBe(0)
  })

  /** The count travels where the step does not: a true statement about the
   * archive, and one that says nothing about the manga. */
  it('counts what the cap held back rather than describing it', () => {
    const dossier = dossierFor(character(), options(360))
    expect(dossier.route.map((step) => step.label)).toEqual(['358'])
    expect(dossier.withheld).toBe(1)
  })

  it('orders the steps oldest first, and reads 359.5 as a sequence inside 359', () => {
    const wandering = character({
      mapTrajectory: [
        { location: 'room-1003', fromChapterId: 'ch-360' },
        { location: 'room-1014', fromChapterId: 'ch-359.5' },
        { location: 'hangar', fromChapterId: 'ch-359' },
      ],
    })
    const dossier = dossierFor(wandering, options(null))
    expect(dossier.route.map((step) => step.label)).toEqual(['359', '359.5', '360'])
    expect(dossier.route[1]!.chapter).toBeCloseTo(359.005)
  })

  /** A step the archive does not date cannot be placed against a cap, so it is
   * neither shown nor counted — counting it would date it. */
  it('drops an undated step without counting it', () => {
    const undated = character({
      mapTrajectory: [{ location: 'nowhere', fromChapterId: 'unknown' }],
    })
    const dossier = dossierFor(undated, options(360))
    expect(dossier.route).toEqual([])
    expect(dossier.withheld).toBe(0)
  })
})

describe('the undated facts', () => {
  const suspect = character({
    suspectedAllegiance: 'Heil-Ly',
    identity: { description: 'travelling under a dead man’s name' },
  })

  it('are sealed for an uncapped reader, who can be shown them', () => {
    expect(dossierFor(suspect, options(null)).sealed).toEqual({
      allegiance: 'Heil-Ly',
      identity: 'travelling under a dead man’s name',
    })
  })

  /**
   * Absent rather than hidden for a capped reader: the walk cannot prove an
   * undated fact is not a revelation, so there is nothing for Body and Soul to
   * take — which is what stops the one punch in the walk being a way around the
   * spoiler filter.
   */
  it('are not sent to a capped reader at all', () => {
    expect(dossierFor(suspect, options(374)).sealed).toBeNull()
  })

  it('are the same null on a body with nothing to hide', () => {
    expect(dossierFor(character(), options(null)).sealed).toBeNull()
  })
})
