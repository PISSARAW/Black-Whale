import { describe, expect, it } from 'vitest'
import {
  createNenTechniqueState,
  transitionNen,
  type NenTechniqueAction,
  type NenTechniqueState,
} from '@black-whale/nen-engine'
import { readBody, readingIsFelt, type ReadingInput } from './reading'
import type { CastBeast, CastMember, Post } from './types'

const ROOM = 'tier-1-royal-residential-sector-room-1014'

const BEAST: CastBeast = {
  ownerId: 'prince-momoze',
  ownerName: 'Momoze Hui Guo Rou',
  silhouette: 'sprite',
  sourceChapterId: 'ch-362',
}

function post(overrides: Partial<CastMember> = {}): Post {
  const member: CastMember = {
    characterId: 'sakata',
    name: 'Sakata',
    locations: [ROOM],
    role: 'Royal Bodyguard for Prince Woble Hui Guo Rou',
    since: 'ch-358',
    nen: true,
    hatsu: [],
    beast: null,
    ...overrides,
  }
  return { member, spaceId: ROOM, tierId: 'tier-1', at: [0, 0], costume: { role: 'guard' } }
}

/** The visitor's own state, built through the engine rather than by hand. */
function visitor(...actions: NenTechniqueAction[]): NenTechniqueState {
  return actions.reduce(
    (state, action) => transitionNen(state, action).state,
    createNenTechniqueState(),
  )
}

const reading = (overrides: Partial<ReadingInput> = {}) =>
  readBody({
    target: post(),
    aura: 'ten',
    beast: null,
    visitor: visitor({ type: 'TEN' }),
    range: 3,
    ...overrides,
  })

describe('what an aura tells you about a body', () => {
  /** Zetsu closes the envelope, and the sense that comes with it goes too. */
  it('tells a visitor who has put their own aura away nothing at all', () => {
    expect(reading({ visitor: visitor({ type: 'ZETSU' }) })).toEqual(['blind'])
  })

  it('feels a raised aura and a held one, and says which', () => {
    expect(reading({ aura: 'ren' })).toContain('ren')
    expect(reading({ aura: 'ten' })).toContain('ten')
  })

  /** Reporting Zetsu to a visitor in plain Ten would be a concealment detector. */
  it('reads a hidden body and a body with no aura as the same silence', () => {
    expect(reading({ aura: 'zetsu' })).toEqual(['still'])
    expect(reading({ aura: null })).toEqual(['still'])
  })

  it('never comes back with nothing to say', () => {
    for (const aura of ['ten', 'ren', 'zetsu', null] as const) {
      expect(reading({ aura }).length).toBeGreaterThan(0)
    }
  })
})

describe('what Gyo adds, and only Gyo', () => {
  const looking = visitor({ type: 'REN' }, { type: 'GYO', on: true })

  it('separates a body holding itself unfindable from an empty one', () => {
    expect(reading({ aura: 'zetsu', visitor: looking })).toContain('zetsu')
    expect(reading({ aura: null, visitor: looking })).not.toContain('zetsu')
  })

  it('shows an animal standing with them, and shows it to nobody else', () => {
    expect(reading({ beast: BEAST, visitor: looking })).toContain('beast')
    expect(reading({ beast: BEAST })).not.toContain('beast')
  })
})

describe('En senses a body rather than its aura', () => {
  const sweeping = visitor({ type: 'REN' }, { type: 'EN', radius: 10 })

  it('finds one inside the sphere and not one outside it', () => {
    expect(reading({ visitor: sweeping, range: 4 })).toContain('en')
    expect(reading({ visitor: sweeping, range: 40 })).not.toContain('en')
  })

  it('finds nobody at all without a sphere out', () => {
    expect(reading({ range: 0 })).not.toContain('en')
  })

  /** Coarsest sense first: that something is there, then what it is doing. */
  it('is said before what comes off the body', () => {
    expect(reading({ visitor: sweeping, range: 4 })[0]).toBe('en')
  })
})

describe('whether the body can tell it is being read', () => {
  it('is felt from a raised aura, and from the two that impose one', () => {
    expect(readingIsFelt(visitor({ type: 'REN' }))).toBe(true)
    expect(readingIsFelt(visitor({ type: 'REN' }, { type: 'KEN', on: true }))).toBe(true)
    expect(readingIsFelt(visitor({ type: 'REN' }, { type: 'ON', on: true }))).toBe(true)
  })

  /** Gyo and En are quiet, which is why they are what you use to go unnoticed. */
  it('is not felt from a visitor merely looking hard', () => {
    expect(readingIsFelt(visitor({ type: 'TEN' }, { type: 'GYO', on: true }))).toBe(false)
    expect(readingIsFelt(visitor({ type: 'TEN' }, { type: 'EN', radius: 20 }))).toBe(false)
    expect(readingIsFelt(visitor({ type: 'ZETSU' }))).toBe(false)
  })
})
