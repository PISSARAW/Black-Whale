import { describe, expect, it } from 'vitest'
import { theShip } from '../blueprint'
import { closestPointOnSegment, pointInPolygon } from '../geometry'
import { castApparitions, distribute } from './distribution'
import { pacedAt, pacedPosts, type Pace } from './pace'
import type { CastMember } from './types'

const ship = theShip()

function member(overrides: Partial<CastMember> & { characterId: string }): CastMember {
  return {
    name: overrides.characterId,
    locations: [],
    role: 'guard',
    since: 'ch-358',
    nen: null,
    hatsu: [],
    beast: null,
    ...overrides,
  }
}

/** The three bodies given a beat, each where the catalogue posts it. */
const WALKERS: CastMember[] = [
  member({
    characterId: 'babimyna',
    locations: ['tier-1-royal-residential-sector-room-1014'],
  }),
  member({
    characterId: 'bladge',
    locations: ['tier-1-royal-residential-sector-room-1012'],
    outsideDoorOf: 'tier-1-royal-residential-sector-room-1012',
  }),
  member({ characterId: 'mizaistom-nana', locations: ['tier-3-central-police-station'] }),
]

const drawn = (members: CastMember[]) => castApparitions(ship, distribute(ship, members))

describe('a beat', () => {
  const pace: Pace = { from: [0, 0], to: [3, 0], speed: 1, rest: 2, offset: 0 }

  it('stands at the post, walks out, stands, and walks back', () => {
    expect(pacedAt(pace, 1)).toEqual({ at: [0, 0], walking: false })
    expect(pacedAt(pace, 3.5)).toEqual({ at: [1.5, 0], walking: true })
    expect(pacedAt(pace, 6)).toEqual({ at: [3, 0], walking: false })
    expect(pacedAt(pace, 8.5)).toEqual({ at: [1.5, 0], walking: true })
  })

  it('comes round to the post again, and reads the same a cycle later', () => {
    expect(pacedAt(pace, 10.5)).toEqual(pacedAt(pace, 0.5))
    expect(pacedAt(pace, -9.5)).toEqual(pacedAt(pace, 0.5))
  })

  it('stays put on a beat with no length', () => {
    expect(pacedAt({ ...pace, to: [0, 0] }, 4)).toEqual({ at: [0, 0], walking: false })
  })
})

describe('who walks one', () => {
  it.each(WALKERS)('gives $characterId a beat that starts at the post', (walker) => {
    const [seen] = drawn([walker])
    expect(seen?.human?.pace?.from).toEqual(seen?.at)
  })

  it.each(WALKERS)('keeps $characterId on clear floor the whole way', (walker) => {
    const [seen] = drawn([walker])
    const pace = seen!.human!.pace!
    const space = ship.spaces.get(seen!.spaceId)!
    const walls = ship.plans.get(seen!.tierId)!.walls
    for (let t = 0; t <= 1; t += 0.05) {
      const at: [number, number] = [
        pace.from[0] + (pace.to[0] - pace.from[0]) * t,
        pace.from[1] + (pace.to[1] - pace.from[1]) * t,
      ]
      expect(pointInPolygon(at, space.footprint)).toBe(true)
      for (const wall of walls) {
        const near = closestPointOnSegment(at, wall.start, wall.end)
        expect(Math.hypot(near[0] - at[0], near[1] - at[1])).toBeGreaterThan(0.33)
      }
    }
  })

  /** Beyond's watch room is a table, a bench and shelving: nowhere to walk. */
  it('stands a body whose room has no clear line to walk', () => {
    const [seen] = drawn([
      member({
        characterId: 'bladge',
        locations: ['tier-1-vvip-prison-beyond'],
        outsideDoorOf: 'tier-1-vvip-prison-beyond-cell',
      }),
    ])
    expect(seen?.spaceId).toBe('tier-1-vvip-prison-beyond-watch')
    expect(seen?.human?.pace).toBeUndefined()
  })

  it('leaves everybody else standing', () => {
    const [seen] = drawn([
      member({
        characterId: 'sakata',
        locations: ['tier-1-royal-residential-sector-room-1014'],
      }),
    ])
    expect(seen?.human).toBeDefined()
    expect(seen?.human?.pace).toBeUndefined()
  })
})

describe('the posts as the reticle finds them', () => {
  const sakata = member({
    characterId: 'sakata',
    locations: ['tier-1-royal-residential-sector-room-1014'],
  })

  it('moves a walker along its beat and hands a standing body back as it came', () => {
    const posts = distribute(ship, [WALKERS[1]!, sakata])
    const [{ human }] = castApparitions(ship, [posts[0]!])
    const pace = human!.pace!
    const span = Math.hypot(pace.to[0] - pace.from[0], pace.to[1] - pace.from[1]) / pace.speed
    const halfway = pace.rest + span / 2 - pace.offset
    const [walker, standing] = pacedPosts(ship, posts, halfway)
    expect(walker!.at).toEqual(pacedAt(pace, halfway).at)
    expect(walker!.at).not.toEqual(posts[0]!.at)
    expect(standing).toBe(posts[1])
  })
})
