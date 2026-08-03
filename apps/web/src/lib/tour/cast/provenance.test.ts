import { describe, expect, it } from 'vitest'
import { theShip } from '../blueprint'
import { distribute } from './distribution'
import { aimedPerson, personExhibit } from './provenance'
import type { CastMember } from './types'

const ship = theShip()

const WORDS = {
  badge: () => 'Panel',
  since: (chapter: string) => `Here since ch. ${chapter}`,
  sinceUnknown: 'No chapter dates this position.',
  claim: 'A named character of the canon.',
  standingIn: (room: string) => `Stands in ${room}`,
  role: (role: string) => `Aboard as: ${role}.`,
}

function member(overrides: Partial<CastMember> & { characterId: string }): CastMember {
  return {
    name: 'Kurapika',
    locations: ['tier-1-royal-residential-sector-room-1014'],
    role: 'Nen teacher/protector',
    since: 'ch-358',
    nen: true,
    hatsu: [],
    beast: null,
    ...overrides,
  }
}

describe('the provenance of a body', () => {
  it('answers who, since when, and in what role', () => {
    const [post] = distribute(ship, [member({ characterId: 'kurapika' })])
    const card = personExhibit(post!, 'Room 1014', WORDS)
    expect(card).toMatchObject({
      id: 'cast:kurapika',
      title: 'Kurapika',
      provenance: 'panel',
      source: 'Here since ch. 358',
      standingIn: 'Stands in Room 1014',
      measured: null,
    })
    expect(card.claim).toContain('Nen teacher/protector')
  })

  it('says so when the catalogue dates the position to no chapter', () => {
    const [post] = distribute(ship, [member({ characterId: 'kurapika', since: null })])
    expect(personExhibit(post!, null, WORDS).source).toBe('No chapter dates this position.')
  })
})

describe('what is down the reticle', () => {
  const posts = distribute(ship, [member({ characterId: 'kurapika' })])
  const target = posts[0]!

  it('finds the body the visitor is looking at', () => {
    const from: [number, number] = [target.at[0] - 2, target.at[1]]
    const heading = Math.atan2(target.at[0] - from[0], target.at[1] - from[1])
    expect(aimedPerson(posts, { from, heading, spaceId: target.spaceId })?.member.characterId).toBe(
      'kurapika',
    )
  })

  it('finds nobody when the visitor is looking the other way', () => {
    const from: [number, number] = [target.at[0] - 2, target.at[1]]
    const heading = Math.atan2(from[0] - target.at[0], from[1] - target.at[1])
    expect(aimedPerson(posts, { from, heading, spaceId: target.spaceId })).toBe(null)
  })

  it('finds nobody in another room, however well aimed', () => {
    const from: [number, number] = [target.at[0] - 2, target.at[1]]
    const heading = Math.atan2(target.at[0] - from[0], target.at[1] - from[1])
    expect(aimedPerson(posts, { from, heading, spaceId: 'tier-5-engine-room' })).toBe(null)
    expect(aimedPerson(posts, { from, heading, spaceId: null })).toBe(null)
  })

  it('finds nobody down a corridor the canon leaves empty', () => {
    expect(aimedPerson([], { from: [0, 0], heading: 0, spaceId: 'anywhere' })).toBe(null)
  })
})
