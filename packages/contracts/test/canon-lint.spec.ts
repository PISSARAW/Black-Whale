import { describe, expect, it } from 'vitest'
import { canonLint, findDataRoot, formatFindings } from '../src/lint'
import { INVARIANTS } from '../src/invariants'
import type { Catalogue } from '../src/types'

/**
 * A lint that never fails proves nothing, so each rule is shown refusing
 * something as well as accepting the archive as it stands.
 */
const { catalogue, findings } = canonLint(findDataRoot(import.meta.dirname))

function run(name: string, mutate: (catalogue: Catalogue) => void) {
  const invariant = INVARIANTS.find((entry) => entry.name === name)
  if (!invariant) throw new Error(`No invariant named ${name}`)
  const copy = structuredClone(catalogue!) as Catalogue
  mutate(copy)
  return invariant.run(copy)
}

describe('the archive as it stands', () => {
  it('parses', () => {
    expect(catalogue).not.toBe(null)
  })

  it('has nothing to report', () => {
    expect(formatFindings(findings)).toContain('consistent')
    expect(findings).toEqual([])
  })
})

describe('unique-ids', () => {
  it('refuses two characters with the same id', () => {
    const found = run('unique-ids', (copy) => {
      copy.characters.push({ ...copy.characters[0]! })
    })
    expect(found).toHaveLength(1)
    expect(found[0]!.message).toBe('duplicate id')
  })
})

describe('references-resolve', () => {
  it('refuses an ability whose owner is not a character', () => {
    const found = run('references-resolve', (copy) => {
      copy.abilities[0]!.ownerId = 'nobody-at-all'
    })
    expect(found).toEqual([
      expect.objectContaining({
        rule: 'ability-owner',
        message: 'unknown reference nobody-at-all',
      }),
    ])
  })

  it('refuses a character in a faction that does not exist', () => {
    const found = run('references-resolve', (copy) => {
      copy.characters[0]!.factionId = 'the-ninth-prince'
    })
    expect(found).toEqual([expect.objectContaining({ rule: 'character-faction' })])
  })
})

describe('chapter-references-are-well-formed', () => {
  it('accepts the explicit ch-unknown', () => {
    const found = run('chapter-references-are-well-formed', (copy) => {
      copy.characters[0]!.firstAppearanceChapterId = 'ch-unknown'
    })
    expect(found).toEqual([])
  })

  it('refuses a reference that is not ch-<number>', () => {
    const found = run('chapter-references-are-well-formed', (copy) => {
      copy.characters[0]!.firstAppearanceChapterId = 'chapitre-quarante'
    })
    expect(found).toEqual([expect.objectContaining({ rule: 'chapter-reference' })])
  })

  it('refuses a chapter past the end of the arc', () => {
    const found = run('chapter-references-are-well-formed', (copy) => {
      copy.characters[0]!.firstAppearanceChapterId = 'ch-9999'
    })
    expect(found[0]!.message).toContain('past the last catalogued chapter')
  })
})

describe('events-are-ordered', () => {
  it('refuses two events in the same place in the story', () => {
    const found = run('events-are-ordered', (copy) => {
      copy.events.push({ ...copy.events[0]!, title: 'A second telling' })
    })
    expect(found).toEqual([expect.objectContaining({ rule: 'event-order' })])
  })

  it('refuses an event outside the arc', () => {
    const found = run('events-are-ordered', (copy) => {
      copy.events[0]!.chapter = 12
    })
    expect(found).toEqual([expect.objectContaining({ rule: 'event-chapter' })])
  })
})

describe('ranked-claims-cite-a-source', () => {
  it('refuses a panel-ranked space with no source', () => {
    const found = run('ranked-claims-cite-a-source', (copy) => {
      const space = copy.blueprint.spaces.find((entry) => entry.provenance === 'panel')!
      space.source = '   '
    })
    expect(found).toEqual([expect.objectContaining({ rule: 'provenance-source' })])
  })

  it('lets an inferred space stand without one', () => {
    const found = run('ranked-claims-cite-a-source', (copy) => {
      const space = copy.blueprint.spaces[0]!
      space.provenance = 'inferred'
      space.source = ''
    })
    expect(
      found.filter((entry) => entry.where.includes(catalogue!.blueprint.spaces[0]!.id)),
    ).toEqual([])
  })
})

describe('structures-fit-their-space', () => {
  it('refuses a structure that reaches through the ceiling', () => {
    const found = run('structures-fit-their-space', (copy) => {
      copy.blueprint.structures[0]!.height = 500
    })
    expect(found[0]!.message).toContain('through a')
  })

  it('refuses a structure sunk below its own floor', () => {
    const found = run('structures-fit-their-space', (copy) => {
      copy.blueprint.structures[0]!.base = -3
    })
    expect(found).toEqual([expect.objectContaining({ message: 'stands below its own floor' })])
  })
})

describe('links-join-real-spaces', () => {
  it('refuses a door to nowhere', () => {
    const found = run('links-join-real-spaces', (copy) => {
      copy.blueprint.links[0]!.to = 'tier-9-nowhere'
    })
    expect(found).toEqual([expect.objectContaining({ rule: 'link-endpoint' })])
  })
})

describe('positions-name-a-room', () => {
  it('refuses a passenger standing on a bare deck', () => {
    const found = run('positions-name-a-room', (copy) => {
      copy.characters[0]!.shipLocation = { tier: 3, room: null, status: 'actif', role: 'passager' }
    })
    expect(found).toEqual([expect.objectContaining({ rule: 'bare-tier' })])
  })

  it('refuses a royal-sector room filed on the wrong deck', () => {
    const found = run('positions-name-a-room', (copy) => {
      copy.characters[0]!.shipLocation = { tier: 4, room: '1011', status: 'actif', role: 'garde' }
    })
    expect(found[0]!.message).toContain('room 1011 is on tier 1')
  })

  it('refuses a trajectory leg that stops on a deck', () => {
    const found = run('positions-name-a-room', (copy) => {
      const character = copy.characters.find((entry) => entry.mapTrajectory?.length)!
      character.mapTrajectory![0]!.location = 'tier-3'
    })
    expect(found).toEqual([
      expect.objectContaining({ message: 'leg 0 stops on a deck, not in a room' }),
    ])
  })

  it('refuses a route written out of order', () => {
    const found = run('positions-name-a-room', (copy) => {
      const character = copy.characters.find((entry) => (entry.mapTrajectory?.length ?? 0) > 1)!
      character.mapTrajectory![1]!.fromChapterId = 'ch-341'
    })
    expect(found[0]!.message).toContain('starts before leg 0')
  })

  // Momoze dies in her room at 368 and is carried to the burial chamber at 371.
  // Nothing may draw her in either place in between, so the gap has to survive.
  it('lets a leg end before the next one begins', () => {
    const found = run('positions-name-a-room', (copy) => {
      const character = copy.characters.find((entry) => (entry.mapTrajectory?.length ?? 0) > 1)!
      character.mapTrajectory![0]!.untilChapterId = character.mapTrajectory![0]!.fromChapterId
    })
    expect(found).toEqual([])
  })

  it('refuses a leg still open once the next one has begun', () => {
    const found = run('positions-name-a-room', (copy) => {
      const character = copy.characters.find((entry) => (entry.mapTrajectory?.length ?? 0) > 1)!
      character.mapTrajectory![0]!.untilChapterId = 'ch-416'
      character.mapTrajectory![1]!.fromChapterId = 'ch-400'
    })
    expect(found.map((entry) => entry.message)).toContain('leg 0 ends after leg 1 has begun')
  })
})

describe('spoiler-coverage', () => {
  it('refuses an undated character that is not a databook entry', () => {
    const found = run('spoiler-coverage', (copy) => {
      const character = copy.characters.find((entry) => entry.firstAppearanceChapterId)!
      character.firstAppearanceChapterId = null
    })
    expect(found).toEqual([expect.objectContaining({ rule: 'spoiler-coverage' })])
  })
})
