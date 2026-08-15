import { describe, expect, it } from 'vitest'
import { theShip } from '../blueprint'
import { EMPTY_WORLD } from '../hatsu'
import { BUDGET, COOLDOWN, DORMANT_KINDS, intentsFor, runConduct } from './conduite'
import { distribute } from './distribution'
import type { CastMember, Post } from './types'

const ship = theShip()

function member(overrides: Partial<CastMember> & { characterId: string }): CastMember {
  return {
    name: overrides.characterId,
    locations: ['tier-1-royal-residential-sector-room-1014'],
    role: 'Royal Bodyguard for Prince Woble Hui Guo Rou',
    since: 'ch-358',
    nen: true,
    hatsu: ['senses'],
    beast: null,
    ...overrides,
  }
}

function posts(members: CastMember[]): Post[] {
  return distribute(ship, members)
}

/** Treat every carried technique as attested when a test is about another rule. */
function attested(standing: Post[]): Record<string, string[]> {
  return Object.fromEntries(standing.map((post) => [post.member.characterId, post.member.hatsu]))
}

/** The tick a given body acts on, found by asking rather than by assuming. */
function firstActiveTick(standing: Post[], room: string): number {
  for (let tick = 0; tick < COOLDOWN * 4; tick++) {
    const found = intentsFor(standing, {
      tick,
      chapter: 361,
      visitorIn: room,
      standing: 0,
      eventHatsu: attested(standing),
    })
    if (found.length > 0) return tick
  }
  return -1
}

describe('the conduct', () => {
  it('casts nothing while the visitor is nowhere near', () => {
    const standing = posts([member({ characterId: 'sakata' })])
    for (let tick = 0; tick < 40; tick++) {
      expect(
        intentsFor(standing, {
          tick,
          chapter: 361,
          visitorIn: null,
          standing: 0,
          eventHatsu: attested(standing),
        }),
      ).toEqual([])
    }
  })

  it('casts nothing for a body the catalogue gives no Nen', () => {
    const standing = posts([member({ characterId: 'sakata', nen: false })])
    const room = standing[0]!.spaceId
    expect(firstActiveTick(standing, room)).toBe(-1)
  })

  it('casts nothing for a body with no technique the walk carries', () => {
    const standing = posts([member({ characterId: 'sakata', hatsu: [] })])
    expect(firstActiveTick(standing, standing[0]!.spaceId)).toBe(-1)
  })

  it('does not activate a known Hatsu merely because the visitor enters the room', () => {
    const standing = posts([member({ characterId: 'sakata' })])
    const room = standing[0]!.spaceId
    for (let tick = 0; tick < COOLDOWN * 4; tick++) {
      expect(
        intentsFor(standing, {
          tick,
          chapter: 361,
          visitorIn: room,
          standing: 0,
          eventHatsu: {},
        }),
      ).toEqual([])
    }
  })

  /** The property the whole phase rests on: the same marche twice. */
  it('makes the same decisions on the same tick, every replay', () => {
    const standing = posts([member({ characterId: 'sakata' })])
    const tick = {
      tick: 7,
      chapter: 361,
      visitorIn: standing[0]!.spaceId,
      standing: 0,
      eventHatsu: attested(standing),
    }
    expect(intentsFor(standing, tick)).toEqual(intentsFor(standing, tick))
  })

  it('holds to its budget', () => {
    const standing = posts(
      ['a', 'b', 'c', 'd', 'e', 'f'].map((id) => member({ characterId: `guard-${id}` })),
    )
    const room = standing[0]!.spaceId
    for (let tick = 0; tick < COOLDOWN * 4; tick++) {
      const found = intentsFor(standing, {
        tick,
        chapter: 361,
        visitorIn: room,
        standing: 0,
        eventHatsu: attested(standing),
      })
      expect(found.length).toBeLessThanOrEqual(BUDGET)
    }
  })

  it('yields to effects the ship is already carrying', () => {
    const standing = posts([member({ characterId: 'sakata' })])
    const room = standing[0]!.spaceId
    const tick = firstActiveTick(standing, room)
    expect(tick).toBeGreaterThanOrEqual(0)
    expect(
      intentsFor(standing, {
        tick,
        chapter: 361,
        visitorIn: room,
        standing: BUDGET,
        eventHatsu: attested(standing),
      }),
    ).toEqual([])
  })

  /** §2.4: a beast in a salon is present and dormant, and stays that way. */
  it('never enlists a beast', () => {
    const standing = posts([member({ characterId: 'prince-momoze', hatsu: [...DORMANT_KINDS] })])
    expect(firstActiveTick(standing, standing[0]!.spaceId)).toBe(-1)
  })

  it('casts through the same door the visitor casts through', () => {
    const standing = posts([member({ characterId: 'sakata', hatsu: ['senses'] })])
    const room = standing[0]!.spaceId
    const tick = firstActiveTick(standing, room)
    const intents = intentsFor(standing, {
      tick,
      chapter: 361,
      visitorIn: room,
      standing: 0,
      eventHatsu: attested(standing),
    })
    const { world, casts } = runConduct(ship, EMPTY_WORLD, intents)
    expect(casts).toHaveLength(1)
    expect(casts[0]!.characterId).toBe('sakata')
    // The engine answered — whatever it answered. A refusal is a fact about the
    // technique and is kept, never smoothed over here.
    expect(casts[0]!.report).toBeDefined()
    expect(world).not.toBe(EMPTY_WORLD)
  })

  it('does nothing at all when nobody intends anything', () => {
    const { world, casts } = runConduct(ship, EMPTY_WORLD, [])
    expect(casts).toEqual([])
    expect(world).toBe(EMPTY_WORLD)
  })
})
