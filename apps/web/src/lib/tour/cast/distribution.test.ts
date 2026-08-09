import { describe, expect, it } from 'vitest'
import { theShip } from '../blueprint'
import { castApparitions, distribute, postsIn } from './distribution'
import { auraReader, CALM } from './nen'
import { beastApparitions } from './beasts'
import type { CastMember, StandingBeast } from './types'

const ship = theShip()

/** Room 1014: the one room of the ship every phase of ADR-003 is argued from. */
const ROOM_1014 = 'tier-1-royal-residential-sector-room-1014'

function member(overrides: Partial<CastMember> & { characterId: string }): CastMember {
  return {
    name: overrides.characterId,
    locations: [ROOM_1014],
    role: 'Royal Bodyguard for Prince Woble Hui Guo Rou',
    since: 'ch-358',
    nen: false,
    hatsu: [],
    beast: null,
    ...overrides,
  }
}

describe('the distribution', () => {
  it('stands a named body in the room the catalogue puts it in', () => {
    const [post] = distribute(ship, [member({ characterId: 'sakata' })])
    expect(post?.member.characterId).toBe('sakata')
    expect(ship.spaces.get(post!.spaceId)?.locationId).toBe(ROOM_1014)
    expect(post?.costume).toEqual({ role: 'guard' })
  })

  /** The doctrinal guarantee, stated as a test: nobody is invented. */
  it('leaves a room the canon does not people empty', () => {
    expect(distribute(ship, [])).toEqual([])
    const nowhere = member({ characterId: 'nobody', locations: [] })
    expect(distribute(ship, [nowhere])).toEqual([])
  })

  it('draws nobody for a role the wardrobe has never heard of', () => {
    const stranger = member({ characterId: 'stranger', role: 'ship rat' })
    expect(distribute(ship, [stranger])).toEqual([])
  })

  it('puts the same body in the same spot every time', () => {
    const once = distribute(ship, [member({ characterId: 'sakata' })])
    const twice = distribute(ship, [member({ characterId: 'sakata' })])
    expect(once[0]!.at).toEqual(twice[0]!.at)
  })

  it('gives two bodies in one room two different spots', () => {
    const posts = distribute(ship, [
      member({ characterId: 'sakata' }),
      member({ characterId: 'hashito' }),
    ])
    expect(posts).toHaveLength(2)
    expect(posts[0]!.at).not.toEqual(posts[1]!.at)
  })

  it('stands a body only in the detailed suite, never in its entrance box', () => {
    const posts = distribute(ship, [member({ characterId: 'sakata' })])
    expect(posts).toHaveLength(1)
    expect(posts[0]!.tierId).toBe('interior-room-1014')
    expect(posts[0]!.member.characterId).toBe('sakata')
    expect(posts[0]!.inside).toBe(true)
  })

  /** A watch is kept at the way in: the suite's own corridor, facing the room. */
  it('posts a guard at the door of the suite and a queen in a room of it', () => {
    const [guard] = distribute(ship, [member({ characterId: 'sakata' })])
    expect(ship.spaces.get(guard!.spaceId)?.category).toBe('corridor')
    expect(guard!.heading).toBeDefined()

    const [queen] = distribute(ship, [member({ characterId: 'oito', role: 'kakin royal family' })])
    expect(ship.spaces.get(queen!.spaceId)?.category).not.toBe('corridor')
    expect(queen!.spaceId).not.toMatch(/servants|wc|bathroom|kitchen/)
  })

  it('keeps an explicitly catalogued outside presence at the corridor door', () => {
    const [post] = distribute(ship, [
      member({
        characterId: 'outside-watch',
        outsideDoorOf: ROOM_1014,
      }),
    ])
    expect(post!.tierId).toBe('tier-1')
    expect(post!.spaceId).toBe('tier-1-royal-residential-approach-1014')
    expect(ship.spaces.get(post!.spaceId)?.category).toBe('corridor')
    expect(post!.inside).toBeUndefined()
  })

  it('places Beyond’s attested watch on the corridor side of his cell door', () => {
    const location = 'tier-1-vvip-prison-beyond'
    const [post] = distribute(ship, [
      member({
        characterId: 'saiyu',
        locations: [location],
        outsideDoorOf: location,
        role: 'zodiaque / taupe potentiel, garde de Beyond',
      }),
    ])
    expect(post!.tierId).toBe('tier-1-b')
    expect(ship.spaces.get(post!.spaceId)?.category).toBe('corridor')
    expect(post!.inside).toBeUndefined()
  })

  it('keeps a room the plans draw only once to a single post', () => {
    const zodiac = member({
      characterId: 'cluck',
      locations: ['tier-3-observation-deck'],
      role: 'zodiaque',
    })
    expect(distribute(ship, [zodiac])).toHaveLength(1)
  })

  it('resolves a sector to one of its rooms, deterministically', () => {
    const zodiac = member({
      characterId: 'cluck',
      locations: ['tier-3-political-ward', 'tier-3-central-courthouse', 'tier-3-central-hospital'],
      role: 'zodiaque',
    })
    const [post] = distribute(ship, [zodiac])
    expect(post).toBeDefined()
    expect(distribute(ship, [zodiac])[0]!.spaceId).toBe(post!.spaceId)
  })

  it('keeps to one level when the walk asks for one', () => {
    expect(distribute(ship, [member({ characterId: 'sakata' })], { tierId: 'tier-5' })).toEqual([])
    const inside = distribute(ship, [member({ characterId: 'sakata' })], {
      tierId: 'interior-room-1014',
    })
    expect(inside).toHaveLength(1)
    expect(inside[0]!.inside).toBe(true)
  })
})

describe('what the scene is handed', () => {
  it('draws one avatar per body, keyed on the character', () => {
    const posts = distribute(ship, [member({ characterId: 'sakata' })])
    const [seen] = castApparitions(ship, posts)
    expect(seen).toMatchObject({
      id: 'cast:sakata',
      kind: 'avatar',
      human: { role: 'guard', identity: 'sakata', pose: 'guard' },
    })
  })

  it('dresses a queen in her own clothes', () => {
    const posts = distribute(ship, [
      member({ characterId: 'oito', role: 'kakin royal family', nen: false }),
    ])
    const [seen] = castApparitions(ship, posts)
    expect(seen!.human).toMatchObject({ role: 'witness', dress: 'gown' })
  })

  /** §2.3: aura is a fact of the catalogue, never a fact of the post. */
  it('gives an aura to the declared user and none to the guard beside them', () => {
    const posts = distribute(ship, [
      member({ characterId: 'kurapika', role: 'Nen teacher/protector', nen: true }),
      member({ characterId: 'sakata', nen: false }),
    ])
    const seen = castApparitions(ship, posts, auraReader())
    const kurapika = seen.find((one) => one.id === 'cast:kurapika')
    const guard = seen.find((one) => one.id === 'cast:sakata')
    expect(kurapika!.human!.aura).toBe('ten')
    expect(guard!.human!.aura).toBeUndefined()
  })

  it('raises the room to Ren when the visitor casts in it', () => {
    const posts = distribute(ship, [
      member({ characterId: 'kurapika', role: 'Nen teacher/protector', nen: true }),
    ])
    const alarmed = auraReader({
      ...CALM,
      visitorIn: posts[0]!.spaceId,
      visitorCasting: true,
    })
    expect(castApparitions(ship, posts, alarmed)[0]!.human!.aura).toBe('ren')
  })

  it('answers who is standing in one room', () => {
    const posts = distribute(ship, [member({ characterId: 'sakata' })])
    expect(postsIn(posts, posts[0]!.spaceId)).toHaveLength(1)
    expect(postsIn(posts, 'tier-5-engine-room')).toEqual([])
    expect(postsIn(posts, null)).toEqual([])
  })
})

describe('the guardian beasts', () => {
  const beast = {
    ownerId: 'prince-momoze',
    ownerName: 'Momoze Hui Guo Rou',
    silhouette: 'sprite' as const,
    sourceChapterId: 'ch-362',
  }

  it('stands a declared beast in its owner’s room, and nowhere else', () => {
    const posts = distribute(ship, [
      member({ characterId: 'prince-momoze', role: 'victime de Tuffdy', beast }),
      member({ characterId: 'sakata' }),
    ])
    const beasts = beastApparitions(ship, posts)
    expect(beasts).toHaveLength(1)
    expect(beasts[0]).toMatchObject({ id: 'cast-beast:prince-momoze', kind: 'sprite', pick: true })
    expect(beasts[0]!.spaceId).toBe(
      posts.find((post) => post.member.characterId === 'prince-momoze')!.spaceId,
    )
  })

  it('follows its prince into the detailed suite only', () => {
    const posts = distribute(ship, [
      member({ characterId: 'prince-momoze', role: 'victime de Tuffdy', beast }),
    ])
    const beasts = beastApparitions(ship, posts)
    expect(beasts.map((one) => one.id)).toEqual(['cast-beast:prince-momoze'])
    expect(beasts[0]!.tierId).toBe('interior-room-1014')
  })

  it('walks a beast whose owner is never placed to the body it stands with', () => {
    const posts = distribute(ship, [member({ characterId: 'oito-nephew-fake-woble' })])
    const standing: StandingBeast[] = [
      {
        ownerId: 'prince-woble',
        ownerName: 'Woble Hui Guo Rou',
        silhouette: 'ghost',
        sourceChapterId: 'ch-358',
        standsWithId: 'oito-nephew-fake-woble',
      },
    ]
    const beasts = beastApparitions(ship, posts, standing)
    expect(beasts).toHaveLength(1)
    expect(beasts[0]!.spaceId).toBe(posts[0]!.spaceId)
    // Present and dormant: it wanders its room and does nothing else.
    expect(beasts[0]!.spread).toBeGreaterThan(0)
    expect(beasts[0]!.stage).toBe(0)
  })

  it('draws no beast when the body it stands with is not in the walk', () => {
    const standing: StandingBeast[] = [
      {
        ownerId: 'prince-woble',
        ownerName: 'Woble Hui Guo Rou',
        silhouette: 'ghost',
        sourceChapterId: 'ch-358',
        standsWithId: 'oito-nephew-fake-woble',
      },
    ]
    expect(beastApparitions(ship, [], standing)).toEqual([])
  })
})
