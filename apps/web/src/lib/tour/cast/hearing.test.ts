import { describe, expect, it } from 'vitest'
import { hearTheRoom } from './hearing'
import type { CastMember, Post } from './types'

const HERE = 'tier-3-medical-zone-ward-1'
const NEXT = 'tier-3-medical-zone-ward-2'

const post = (characterId: string, spaceId = HERE): Post => {
  const member: CastMember = {
    characterId,
    name: characterId,
    locations: [spaceId],
    role: 'Hunter',
    since: null,
    nen: true,
    hatsu: [],
    beast: null,
  }
  return { member, spaceId, tierId: 'tier-3', at: [0, 0], costume: { role: 'hunter' } }
}

const listen = (
  posts: Post[],
  auras: Record<string, 'ten' | 'ren' | 'zetsu' | null> = {},
  playing = false,
) =>
  hearTheRoom({
    posts,
    spaceId: HERE,
    auraFor: (each) => auras[each.member.characterId] ?? null,
    playing,
  })

describe('what the ear picks up in the room', () => {
  // The one thing the plan cannot show: how many people are actually in here.
  it('counts the hearts in the room and nobody else’s', () => {
    const heard = listen([post('cheadle'), post('leorio'), post('kacho', NEXT)])
    expect(heard.hearts).toBe(2)
    expect(heard.tells).toContain('hearts')
  })

  it('says the room is empty rather than saying nothing', () => {
    expect(listen([post('kacho', NEXT)])).toEqual({ hearts: 0, tells: ['alone'] })
  })

  it('reports what the auras in the room are doing, one tell each', () => {
    const heard = listen([post('a'), post('b'), post('c')], { a: 'ren', b: 'ten', c: null })
    expect(heard.tells).toEqual(['hearts', 'ren', 'ten', 'still'])
  })

  // The same refusal `reading.ts` makes down the reticle, arriving by the other
  // door: the heart is heard either way, and the concealment is not reported.
  it('hears the heart of a body in Zetsu without reporting the Zetsu', () => {
    const heard = listen([post('hidden')], { hidden: 'zetsu' })
    expect(heard.hearts).toBe(1)
    expect(heard.tells).toEqual(['hearts', 'still'])
  })

  // You cannot play into a room and listen to it at the same time, and the walk
  // says which of the two is happening rather than handing over both.
  it('hears nothing but the flute while the flute is up', () => {
    const heard = listen([post('cheadle'), post('leorio')], {}, true)
    expect(heard).toEqual({ hearts: 0, tells: ['playing'] })
  })

  it('hears nothing at all between rooms', () => {
    const between = hearTheRoom({
      posts: [post('cheadle')],
      spaceId: null,
      auraFor: () => 'ren',
      playing: false,
    })
    expect(between).toEqual({ hearts: 0, tells: ['alone'] })
  })
})
