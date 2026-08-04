import { describe, expect, it } from 'vitest'
import { auraFor, CALM, WATCH_EN_RADIUS, type Situation } from './nen'
import type { CastMember, Post } from './types'

const ROOM = 'tier-1-royal-residential-sector-room-1014'

function post(overrides: Partial<CastMember> & { characterId: string }): Post {
  const member: CastMember = {
    name: overrides.characterId,
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

/** The rule that decides who glows, and the only one. */
describe('who carries an aura', () => {
  it('gives nothing at all to a body the catalogue does not call a user', () => {
    expect(auraFor(post({ characterId: 'sakata', nen: false }))).toEqual({})
  })

  it('gives nothing to an ordinary soldier even in a room the visitor is casting in', () => {
    const situation = { ...CALM, visitorIn: ROOM, visitorCasting: true, hostileRooms: [] }
    expect(auraFor(post({ characterId: 'sakata', nen: false }), situation)).toEqual({})
  })
})

describe('the conduct at a post', () => {
  it('holds Ten and nothing else where nothing has happened', () => {
    const look = auraFor(post({ characterId: 'kurapika', role: 'Nen teacher' }), CALM)
    expect(look.aura).toBe('ten')
    expect(look.nen?.en).toBeNull()
    expect(look.nen?.gyo).toBe(false)
    expect(look.nen?.ryu).toEqual({})
    expect(look.alert).toBeUndefined()
  })

  it('sweeps a standing En when the role is to watch', () => {
    const look = auraFor(post({ characterId: 'sakata', role: 'Royal Bodyguard for Prince Woble' }))
    expect(look.nen?.en).toEqual({ radius: WATCH_EN_RADIUS })
  })

  it('sweeps nothing where the role is not to watch', () => {
    const look = auraFor(post({ characterId: 'melody', role: 'soutien / musique Nen' }))
    expect(look.nen?.en).toBeNull()
  })

  it('reads the French and the English the catalogue writes the same order in', () => {
    for (const role of ['Private Guard of Prince Camilla', 'zodiaque / garde de Beyond']) {
      expect(auraFor(post({ characterId: 'someone', role })).nen?.en).not.toBeNull()
    }
  })
})

describe('the conduct when something happens', () => {
  const casting = { ...CALM, visitorIn: ROOM, visitorCasting: true, hostileRooms: [] }

  it('raises Ren, looks with Gyo and covers with Ryu when the visitor casts here', () => {
    const look = auraFor(post({ characterId: 'kurapika', role: 'Nen teacher' }), casting)
    expect(look.aura).toBe('ren')
    expect(look.alert).toBe(true)
    expect(look.nen?.gyo).toBe(true)
    expect(look.nen?.ryu.torso).toBeGreaterThan(look.nen!.ryu.hands!)
  })

  /** Ryu is a distribution: the engine normalises it, so it sums to one. */
  it('leaves no zone abandoned and distributes the whole of the aura', () => {
    const look = auraFor(post({ characterId: 'kurapika', role: 'Nen teacher' }), casting)
    const shares = Object.values(look.nen!.ryu) as number[]
    expect(shares).toHaveLength(4)
    expect(shares.every((share) => share > 0)).toBe(true)
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1)
  })

  it('is not felt in the next room along', () => {
    const elsewhere = {
      ...CALM,
      visitorIn: 'tier-5-engine-room',
      visitorCasting: true,
      hostileRooms: [],
    }
    expect(auraFor(post({ characterId: 'kurapika', role: 'Nen teacher' }), elsewhere).aura).toBe(
      'ten',
    )
  })

  /**
   * A hostile is already visible. Gyo answers what was *felt* and cannot be
   * seen, so it belongs to the raised aura beside you and to nothing else.
   */
  it('raises Ren for a hostile in the room but does not look for it', () => {
    const hostile = { ...CALM, visitorIn: null, visitorCasting: false, hostileRooms: [ROOM] }
    const look = auraFor(post({ characterId: 'kurapika', role: 'Nen teacher' }), hostile)
    expect(look.aura).toBe('ren')
    expect(look.nen?.gyo).toBe(false)
  })
})

describe('the conduct of a body the visitor is doing something to', () => {
  const teacher = post({ characterId: 'kurapika', role: 'Nen teacher' })

  /** Being aimed at is not the same event as being nearby when something goes
   * off: it happens to you, and the conduct answers it personally. */
  it('raises the aura of whoever is being aimed at, wherever they stand', () => {
    const aimed = { ...CALM, aimedAt: 'kurapika' }
    const look = auraFor(teacher, aimed)
    expect(look.aura).toBe('ren')
    expect(look.nen?.gyo).toBe(true)
    expect(auraFor(post({ characterId: 'sakata', role: 'Nen teacher' }), aimed).aura).toBe('ten')
  })

  it('holds a bound body at Ren, guarded and alarmed', () => {
    const look = auraFor(teacher, { ...CALM, holds: { kurapika: 'bound' } })
    expect(look.aura).toBe('ren')
    expect(look.alert).toBe(true)
    expect(look.nen?.gyo).toBe(true)
  })

  /** Music and a closing chain settle a body: drawing Melody's flute as an
   * alarm would contradict the ability the walk just performed. */
  it('settles a soothed body rather than alarming it', () => {
    const look = auraFor(teacher, { ...CALM, holds: { kurapika: 'soothed' } })
    expect(look.aura).toBe('ten')
    expect(look.alert).toBeUndefined()
  })

  /** Not defending itself, because it is not the one deciding — and the walk
   * says nothing at all about the mind behind it. */
  it('drops a controlled body to Ten with nothing distributed', () => {
    const look = auraFor(teacher, { ...CALM, holds: { kurapika: 'controlled' } })
    expect(look.aura).toBe('ten')
    expect(look.nen?.ryu).toEqual({})
  })

  it('lets the hold outrank the room it is being held in', () => {
    const loud: Situation = {
      ...CALM,
      visitorIn: ROOM,
      visitorCasting: true,
      holds: { kurapika: 'soothed' },
    }
    expect(auraFor(teacher, loud).aura).toBe('ten')
  })
})

describe('a body that is hiding', () => {
  const hidden = post({ characterId: 'illumi', role: 'undercover assassin / identity unknown' })

  it('holds Zetsu whatever the room does', () => {
    const loud = { ...CALM, visitorIn: ROOM, visitorCasting: true, hostileRooms: [ROOM] }
    expect(auraFor(hidden, loud).aura).toBe('zetsu')
  })

  /** Zetsu is the aura put away: everything fed by it falls with it. */
  it('sweeps nothing, looks with nothing and covers nothing', () => {
    const look = auraFor(hidden, {
      ...CALM,
      visitorIn: ROOM,
      visitorCasting: true,
      hostileRooms: [],
    })
    expect(look.nen?.en).toBeNull()
    expect(look.nen?.gyo).toBe(false)
    expect(look.nen?.ryu).toEqual({})
    expect(look.alert).toBeUndefined()
  })
})

/**
 * Ch. 369: Sayird has no aura for as long as Kurapika has his ability. Not a
 * hold, and it must not behave like one — on the twenty-five-second timer the
 * drain expired while the technique it took was still open in the book, which
 * had the walk saying that a stolen ability grows back.
 */
describe('the body Steal Chain emptied', () => {
  const sayird = post({ characterId: 'sayird', role: 'Royal Bodyguard for Prince Woble' })
  const drained = (who: string[]): Situation => ({ ...CALM, drained: who })

  it('has nothing at all to see, which is what Gyo finds', () => {
    expect(auraFor(sayird, drained(['sayird'])).aura).toBe('zetsu')
  })

  it('outlasts every hold, because it is not one', () => {
    const alsoHeld: Situation = { ...drained(['sayird']), holds: { sayird: 'struck' } }
    expect(auraFor(sayird, alsoHeld).aura).toBe('zetsu')
  })

  it('empties nobody else', () => {
    expect(auraFor(sayird, drained(['someone-else'])).aura).not.toBe('zetsu')
  })
})
