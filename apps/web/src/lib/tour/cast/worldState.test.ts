import { describe, expect, it } from 'vitest'
import { inSlugSpace } from '$lib/tour/cast'

/**
 * The defect this exists because of.
 *
 * The walk shipped with an empty cast, and every unit test was green: the
 * projection is pure and speaks slugs, the world state is relational and speaks
 * row ids, and nothing in between said so. `originalCharacterId` is a uuid, not
 * `kurapika`, so every body fell out of the catalogue lookup in silence.
 *
 * A translation is exactly the kind of seam a type cannot hold — both sides are
 * `string` — so it is held here instead.
 */
const WORLD = {
  characters: [
    { id: 'uuid-kurapika', slug: 'kurapika' },
    { id: 'uuid-nephew', slug: 'oito-nephew-fake-woble' },
  ],
  bodies: [
    { id: 'body-1', originalCharacterId: 'uuid-kurapika' },
    { id: 'body-2', originalCharacterId: null },
  ],
  appearances: [{ entityId: 'body-2', appearanceCharacterId: 'uuid-nephew' }],
  presences: [
    {
      entityId: 'body-1',
      locationId: 'uuid-room-1014',
      precision: 'EXACT_ROOM',
      fromEvent: { chapter: { number: 361 } },
    },
  ],
}

describe('the world state, in slug space', () => {
  it('turns a body’s owner into the id the catalogue files them under', () => {
    expect(inSlugSpace(WORLD).bodies).toEqual([
      { id: 'body-1', originalCharacterId: 'kurapika' },
      { id: 'body-2', originalCharacterId: null },
    ])
  })

  it('turns a borrowed face into one too', () => {
    expect(inSlugSpace(WORLD).appearances).toEqual([
      { entityId: 'body-2', appearanceCharacterId: 'oito-nephew-fake-woble' },
    ])
  })

  /** The provenance card says "here since ch. 361", not since a row id. */
  it('turns the chapter a position starts at into a chapter reference', () => {
    expect(inSlugSpace(WORLD).presences[0]).toEqual({
      entityId: 'body-1',
      locationId: 'uuid-room-1014',
      precision: 'EXACT_ROOM',
      fromEvent: { chapterId: 'ch-361' },
    })
  })

  it('says nothing rather than something wrong when a join is missing', () => {
    const bare = {
      ...WORLD,
      characters: [],
      presences: [{ ...WORLD.presences[0]!, fromEvent: null }],
    }
    expect(inSlugSpace(bare).bodies[0]!.originalCharacterId).toBe(null)
    expect(inSlugSpace(bare).presences[0]!.fromEvent.chapterId).toBe(null)
  })
})
