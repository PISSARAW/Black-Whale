import { createNenTechniqueState, transitionNen } from '@black-whale/nen-engine'
import { describe, expect, it } from 'vitest'
import { auraFor, CALM } from './nen'
import {
  contactWith,
  sensedBy,
  sensesFromKey,
  sensesKey,
  sweptByVisitor,
  type Visitor,
} from './sensing'
import type { CastMember, Post } from './types'

const ROOM = 'tier-1-royal-residential-sector-room-1014'
const WATCH_EN_RADIUS = 4

function post(characterId: string, role = 'Royal Bodyguard for Prince Woble'): Post {
  const member: CastMember = {
    name: characterId,
    characterId,
    locations: [ROOM],
    role,
    since: 'ch-358',
    nen: {
      techniques: ['En'],
      awakenedFromChapter: null,
      conduct: { mode: 'ten', concealedWithIn: false, enRadius: WATCH_EN_RADIUS },
    },
    hatsu: [],
    beast: null,
  }
  return { member, spaceId: ROOM, tierId: 'tier-1', at: [0, 0], costume: { role: 'guard' } }
}

const nenOf = (each: Post) => auraFor(each, CALM).nen

function visitor(at: number, ...actions: Parameters<typeof transitionNen>[1][]): Visitor {
  const nen = actions.reduce(
    (state, action) => transitionNen(state, action).state,
    createNenTechniqueState(),
  )
  return { at: [at, 0], nen }
}

describe('what a sweep finds', () => {
  const guard = post('sakata')

  it('feels an aura in Ten inside the radius', () => {
    expect(sensedBy([guard], visitor(WATCH_EN_RADIUS - 1), nenOf)).toEqual({ sakata: 'aura' })
  })

  it('feels only a body when the visitor is in Zetsu', () => {
    const quiet = visitor(1, { type: 'ZETSU' })
    expect(sensedBy([guard], quiet, nenOf)).toEqual({ sakata: 'body' })
  })

  it('finds nobody past the radius', () => {
    expect(sensedBy([guard], visitor(WATCH_EN_RADIUS + 1), nenOf)).toEqual({})
  })

  it('does not infer a sweep from the role', () => {
    const teacher = post('kurapika', 'Nen teacher')
    teacher.member.nen!.conduct.enRadius = null
    expect(sensedBy([teacher], visitor(0), nenOf)).toEqual({})
  })

  /** In hides from sight. A sweep is not sight. */
  it('feels an aura under In all the same', () => {
    const hidden = visitor(1, { type: 'IN', on: true })
    expect(sensedBy([guard], hidden, nenOf)).toEqual({ sakata: 'aura' })
  })

  it('returns every body touched by the visitor En, independently of the reticle', () => {
    const near = post('near')
    const far = post('far')
    near.at = [2, 0]
    far.at = [9, 0]
    expect(sweptByVisitor([near, far], visitor(0, { type: 'EN', radius: 5 }))).toEqual(['near'])
    expect(contactWith(near, { ...CALM, sweptBy: ['near'], visitorHidden: true }).felt).toBe(true)
  })
})

describe('what a sweep finds of a Shu left behind', () => {
  const guard = post('sakata')
  const far = WATCH_EN_RADIUS + 5
  const marked = (at: number, ...actions: Parameters<typeof transitionNen>[1][]) => ({
    ...visitor(far, { type: 'SHU', objectId: 'crate', on: true }, ...actions),
    marks: [[at, 0]] as const,
  })

  it('feels the aura of a marked object with the visitor out of range', () => {
    expect(sensedBy([guard], marked(1), nenOf)).toEqual({ sakata: 'aura' })
  })

  it('feels nothing of a marked object past the radius', () => {
    expect(sensedBy([guard], marked(WATCH_EN_RADIUS + 1), nenOf)).toEqual({})
  })

  /** In hides from sight; the object carries aura into the sweep all the same. */
  it('feels the object under In all the same', () => {
    expect(sensedBy([guard], marked(1, { type: 'IN', on: true }), nenOf)).toEqual({
      sakata: 'aura',
    })
  })

  it('lets the aura win over the bare body of the visitor nearer by', () => {
    const near = {
      ...visitor(1, { type: 'SHU', objectId: 'crate', on: true }),
      marks: [[2, 0]] as const,
    }
    expect(sensedBy([guard], near, nenOf)).toEqual({ sakata: 'aura' })
  })

  /** Zetsu lets every Shu go, so a stale list of marks leaves nothing behind. */
  it('leaves no trace once Zetsu has let the Shu go', () => {
    const quiet = { ...visitor(far, { type: 'ZETSU' }), marks: [[1, 0]] as const }
    expect(sensedBy([guard], quiet, nenOf)).toEqual({})
  })
})

describe('the key a reactive caller stops at', () => {
  it('round-trips and does not depend on order', () => {
    const senses = { b: 'body', a: 'aura' } as const
    expect(sensesKey(senses)).toBe(sensesKey({ a: 'aura', b: 'body' }))
    expect(sensesFromKey(sensesKey(senses))).toEqual(senses)
    expect(sensesFromKey('')).toEqual({})
  })
})

describe('how far the visitor reaches a body', () => {
  const guard = post('sakata')
  const casting = { ...CALM, visitorIn: ROOM, visitorCasting: true }

  it('is felt when an aura is in the sweep, even with nothing raised', () => {
    expect(contactWith(guard, { ...CALM, sensedBy: { sakata: 'aura' } })).toEqual({
      felt: true,
      looking: true,
      menaced: false,
    })
  })

  it('makes a body in Zetsu worth a look and not an alarm', () => {
    expect(contactWith(guard, { ...CALM, sensedBy: { sakata: 'body' } })).toEqual({
      felt: false,
      looking: true,
      menaced: false,
    })
  })

  it('hides a technique raised under In from a body that is not looking', () => {
    expect(contactWith(guard, { ...casting, visitorHidden: true }).felt).toBe(false)
    expect(contactWith(guard, { ...CALM, aimedAt: 'sakata', visitorHidden: true }).felt).toBe(false)
  })

  it('stops hiding it once the body has the visitor in its sweep', () => {
    const near = { ...casting, visitorHidden: true, sensedBy: { sakata: 'body' as const } }
    expect(contactWith(guard, near).felt).toBe(true)
  })
})

describe('the conduct it produces', () => {
  const guard = post('sakata')

  it('raises Ren and alarms the body that feels an aura', () => {
    const look = auraFor(guard, { ...CALM, sensedBy: { sakata: 'aura' } })
    expect(look.aura).toBe('ren')
    expect(look.alert).toBe(true)
    expect(look.nen?.gyo).toBe(true)
  })

  it('holds Ten and looks, unalarmed, at a body with nothing on it', () => {
    const look = auraFor(guard, { ...CALM, sensedBy: { sakata: 'body' } })
    expect(look.aura).toBe('ten')
    expect(look.alert).toBeUndefined()
    expect(look.nen?.gyo).toBe(true)
    expect(look.nen?.en).toEqual({ radius: WATCH_EN_RADIUS })
  })

  it('keeps a room calm when the technique raised in it is under In', () => {
    const look = auraFor(guard, {
      ...CALM,
      visitorIn: ROOM,
      visitorCasting: true,
      visitorHidden: true,
    })
    expect(look.aura).toBe('ten')
  })
})
