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
    ]).filter((post) => !post.inside)
    expect(posts).toHaveLength(2)
    expect(posts[0]!.at).not.toEqual(posts[1]!.at)
  })

  /**
   * The apartment is drawn twice — a box on the deck, seven rooms on its own
   * level — and a body in it is in both drawings. Posting only on the box is
   * what made a suite you had walked into come out empty.
   */
  it('stands a body in the suite as well as on the deck the suite is a box on', () => {
    const posts = distribute(ship, [member({ characterId: 'sakata' })])
    expect(posts).toHaveLength(2)
    const [deck, within] = posts[0]!.inside ? [posts[1]!, posts[0]!] : [posts[0]!, posts[1]!]
    expect(deck.tierId).toBe('tier-1')
    expect(within.tierId).toBe('interior-room-1014')
    expect(within.member.characterId).toBe('sakata')
  })

  /** A watch is kept at the way in: the suite's own corridor, facing the room. */
  it('posts a guard at the door of the suite and a queen in a room of it', () => {
    const [, guard] = distribute(ship, [member({ characterId: 'sakata' })])
    expect(ship.spaces.get(guard!.spaceId)?.category).toBe('corridor')
    expect(guard!.heading).toBeDefined()

    const [, queen] = distribute(ship, [
      member({ characterId: 'oito', role: 'kakin royal family' }),
    ])
    expect(ship.spaces.get(queen!.spaceId)?.category).not.toBe('corridor')
    expect(queen!.spaceId).not.toMatch(/servants|wc|bathroom|kitchen/)
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
    ]).filter((post) => !post.inside)
    const beasts = beastApparitions(ship, posts)
    expect(beasts).toHaveLength(1)
    expect(beasts[0]).toMatchObject({ id: 'cast-beast:prince-momoze', kind: 'sprite', pick: true })
    expect(beasts[0]!.spaceId).toBe(
      posts.find((post) => post.member.characterId === 'prince-momoze')!.spaceId,
    )
  })

  /** In the salon as well as on the box: the two drawings of the same room. */
  it('follows its prince into the suite, under an id of its own', () => {
    const posts = distribute(ship, [
      member({ characterId: 'prince-momoze', role: 'victime de Tuffdy', beast }),
    ])
    const beasts = beastApparitions(ship, posts)
    expect(beasts.map((one) => one.id)).toEqual([
      'cast-beast:prince-momoze',
      'cast-beast:prince-momoze:within',
    ])
    expect(new Set(beasts.map((one) => one.tierId)).size).toBe(2)
  })

  it('walks a beast whose owner is never placed to the body it stands with', () => {
    const posts = distribute(ship, [member({ characterId: 'oito-nephew-fake-woble' })]).filter(
      (post) => !post.inside,
    )
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
